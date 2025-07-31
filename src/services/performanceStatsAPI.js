// src/services/performanceStatsAPI.js (완전 수정본)

import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { isPresent } from "../utils/attendanceUtils";

/**
 * 실적 통계 데이터 fetch (기능/팀/단위/세부/월/분기별, 대량실적 포함)
 * - 등록인원/실인원: 고유 이용자 수(이용자명/고유아이디 기준)
 * - 연인원: 누적 참여 횟수
 * - 건수: 연인원/실인원 산출 불가 실적만 집계
 * - 횟수: 프로그램별+날짜별 1회만 집계(출석자 수와 무관, 표준)
 */
export async function fetchPerformanceStats({
  function: func,
  team,
  unit,
  subProgram,
  months,
  quarters,
  performanceType = "전체"
} = {}) {
  console.log("📊 fetchPerformanceStats 호출:", { func, team, unit, subProgram, months, quarters, performanceType });

  // 수정된 쿼리 로직: 월별 필터는 클라이언트에서 처리
  const queries = [];

  // 공통 필터 조건 (월별 필터 제거)
  const commonConstraints = [];
  if (func) commonConstraints.push(where("기능", "==", func));
  if (team) commonConstraints.push(where("팀명", "==", team));
  if (unit) commonConstraints.push(where("단위사업명", "==", unit));
  if (subProgram) commonConstraints.push(where("세부사업명", "==", subProgram));

  // 실적유형별 쿼리 전략 개선
  if (performanceType === "전체") {
    // 1) 개별실적 조회
    let individualQuery = collection(db, "PerformanceSummary");
    let individualConstraints = [...commonConstraints];
    try {
      individualConstraints.push(where("실적유형", "==", "개별"));
    } catch (error) {
      console.warn("개별 실적 쿼리 실패, 전체 조회로 대체:", error);
      individualConstraints = [...commonConstraints];
    }
    if (individualConstraints.length > 0) {
      individualQuery = query(individualQuery, ...individualConstraints);
    }
    queries.push(individualQuery);

    // 2) 대량실적 조회
    let bulkQuery = collection(db, "PerformanceSummary");
    let bulkConstraints = [...commonConstraints, where("실적유형", "==", "대량")];
    if (bulkConstraints.length > 0) {
      bulkQuery = query(bulkQuery, ...bulkConstraints);
    }
    queries.push(bulkQuery);

  } else if (performanceType === "개별") {
  let individualQuery = collection(db, "PerformanceSummary");
  let individualConstraints = [...commonConstraints];
  individualConstraints.push(where("실적유형", "==", "개별")); // 필수 추가!
  if (individualConstraints.length > 0) {
    individualQuery = query(individualQuery, ...individualConstraints);
  }
  queries.push(individualQuery);
}
 else if (performanceType === "대량") {
    let bulkQuery = collection(db, "PerformanceSummary");
    let bulkConstraints = [...commonConstraints, where("실적유형", "==", "대량")];
    if (bulkConstraints.length > 0) {
      bulkQuery = query(bulkQuery, ...bulkConstraints);
    }
    queries.push(bulkQuery);
  }

  console.log("📊 실행할 쿼리 개수:", queries.length);

  // 병렬 쿼리 실행
  const snapshots = await Promise.all(
    queries.map(async (q) => {
      try {
        return await getDocs(q);
      } catch (error) {
        console.error("쿼리 실행 오류:", error);
        if (error.code === "failed-precondition") {
          // 인덱스 부족 시 빈 결과 반환
          return { docs: [] };
        }
        throw error;
      }
    })
  );

  // 전체 문서 리스트 병합 (개별 + 대량)
  const allDocs = snapshots.flatMap((snapshot) => snapshot.docs);

// 🔧 중복 문서 제거 (doc.id 기준)
const seenKeys = new Set();
const uniqueDocs = [];

// 🔧 dedupKey 생성 로직 개선
for (const doc of allDocs) {
  const d = doc.data();

   // 1월 어르신 라인댄스 원본 데이터 확인용 로그
  if (
    d["세부사업명"] === "어르신 라인댄스" &&
    d["날짜"]?.startsWith("2025-01")
  ) {
    console.log("[DEBUG][allDocs] 어르신 라인댄스 1월 원본 row:", d);
  }

  // 날짜 정규화
  const normalizedDate = d.날짜 ? d.날짜.slice(0, 10) : "";

  // 고유아이디 우선, 없으면 이용자명+연락처 fallback
  const userId = (d["고유아이디"] || "").trim().toLowerCase();
  const userName = (d["이용자명"] || "").trim().toLowerCase();
  const phone = (d["연락처"] || "").replace(/[^0-9]/g, ""); // 숫자만
  const birth = (d["생년월일"] || "").slice(0, 10);

  const dedupKey = [
  (d["세부사업명"] || "").trim(),
  normalizedDate || "0000-00-00",
  d["고유아이디"] && d["고유아이디"].trim()
    ? d["고유아이디"].trim()
    : `${(d["이용자명"] || "").trim()}|${(d["연락처"] || "").replace(/[^0-9]/g, "")}|${(d["생년월일"] || "").slice(0,10)}`
].join("|");

if (dedupKey.includes("어르신 라인댄스") && dedupKey.includes("2025-01")) {
  console.log("[DEBUG][dedup] dedupKey, 고유아이디, 이용자명, 연락처:", dedupKey, d["고유아이디"], d["이용자명"], d["연락처"]);
}

  const isBulkPerformance = d.실적유형 && d.실적유형.trim() === "대량";

if (isBulkPerformance) {
  // 대량실적은 중복제거하지 않고 무조건 추가
  uniqueDocs.push(doc);
} else {
  if (!seenKeys.has(dedupKey)) {
    seenKeys.add(dedupKey);
    uniqueDocs.push(doc);
  }
}
}

  // 집계 객체 초기화
  const grouped = {};
  const uniqueUserMap = {};
  const sessionSet = {};

  let filteredDocs = uniqueDocs;
if (performanceType === "개별") {
  filteredDocs = uniqueDocs.filter(
    (doc) => doc.data().실적유형?.trim() !== "대량"
  );
}

filteredDocs.forEach((doc) => {
  const d = doc.data();

    // 연도, 월, 분기 계산 및 키 생성
    const year = d.날짜 ? d.날짜.slice(0, 4) : d.year;
    const rawMonth = d.날짜 ? d.날짜.slice(5, 7) : d.month;
const month = rawMonth ? rawMonth.padStart(2, "0") : "00";
const quarter = month ? Math.ceil(parseInt(month, 10) / 3).toString() : "";

// 월별/분기별 필터링 (클라이언트 사이드)
if (Array.isArray(months) && months.length > 0) {
  const normalizedMonths = months.map(m => {
    if (typeof m === "string" && m.includes("-")) {
      return m.slice(5, 7); // yyyy-MM → MM
    }
    return String(m).padStart(2, "0");
  });
  if (!normalizedMonths.includes(month)) return;
}

if (Array.isArray(quarters) && quarters.length > 0) {
  if (!quarters.includes(quarter)) return;
}

    // 필드명 보완 (한글/영문 혼용)
    const func = d.function || d["기능"] || "";
    const teamName = d.team || d["팀명"] || "";
    const unitName = d.unit || d["단위사업명"] || "";
    const subProgramName = d.subProgram || d["세부사업명"] || "";

    const key = [func, teamName, unitName, subProgramName, year || "", month || "", quarter || ""].join("|");

    if (key.includes("어르신 라인댄스|2025|01")) {
  console.log("[DEBUG][grouped] 집계 key 생성 및 초기화:", key);
}
    // grouped 객체 초기화
    if (!grouped[key]) {
      grouped[key] = {
        id: key,
        function: func,
        team: teamName,
        unit: unitName,
        subProgram: subProgramName,
        year,
        month,
        quarter,
        registered: 0,
        actual: 0,
        total: 0,
        cases: 0,
        sessions: 0,
        actualMale: 0,
        actualFemale: 0,
        totalMale: 0,
        totalFemale: 0,
        paidMale: 0,
        paidFemale: 0,
        paidSum: 0,
        freeMale: 0,
        freeFemale: 0,
        freeSum: 0,
        // performanceType 결정
        performanceType: (d.실적유형?.trim() === "대량") ? "대량" : "개별",
      };
      uniqueUserMap[key] = new Set();
      sessionSet[key] = new Set();
    }

    // 횟수(운영일수) 집계: 프로그램+날짜별 1회만
    const sessionKey = `${subProgramName}_${d.날짜 || ""}`;
    if (d.날짜 && subProgramName && !sessionSet[key].has(sessionKey)) {
      grouped[key].sessions += 1;
      sessionSet[key].add(sessionKey);
    }

    // 대량/개별 실적 구분
const perfType = d.실적유형 ? d.실적유형.trim() : "";
const isBulkPerformance = perfType === "대량";

if (isBulkPerformance) {
  // 대량실적 집계 (출석여부 무관)
  grouped[key].registered += Number(d.등록인원 || 0);
  grouped[key].actual += Number(d.실인원 || 0);
  grouped[key].total += Number(d.연인원 || 0);
  grouped[key].cases += Number(d.건수 || 0);

  grouped[key].actualMale += Number(d.actualMale || 0);
  grouped[key].actualFemale += Number(d.actualFemale || 0);
  grouped[key].totalMale += Number(d.totalMale || 0);
  grouped[key].totalFemale += Number(d.totalFemale || 0);
  grouped[key].paidMale += Number(d.paidMale || 0);
  grouped[key].paidFemale += Number(d.paidFemale || 0);
  grouped[key].freeMale += Number(d.freeMale || 0);
  grouped[key].freeFemale += Number(d.freeFemale || 0);

} else {
  // 개별실적 집계: 출석 여부 반드시 true인 경우만
  if (isPresent(d.출석여부)) {
    const userKey = d.고유아이디 || d.이용자명 || "";
    if (userKey && !uniqueUserMap[key].has(userKey)) {
      grouped[key].registered += 1;
      grouped[key].actual += 1;
      if (d.성별 === "남") grouped[key].actualMale += 1;
      if (d.성별 === "여") grouped[key].actualFemale += 1;
      uniqueUserMap[key].add(userKey);
    }

    grouped[key].total += 1;
    if (d.성별 === "남") grouped[key].totalMale += 1;
    if (d.성별 === "여") grouped[key].totalFemale += 1;

    if (["유료", "Paid"].includes(d.feeType) || d.유료무료 === "유료") {
      if (d.성별 === "남") grouped[key].paidMale += 1;
      if (d.성별 === "여") grouped[key].paidFemale += 1;
    }

    if (["무료", "Free"].includes(d.feeType) || d.유료무료 === "무료") {
      if (d.성별 === "남") grouped[key].freeMale += 1;
      if (d.성별 === "여") grouped[key].freeFemale += 1;
    }
  }
  if ((!d.실인원 && !d.연인원) && d.건수) {
    grouped[key].cases += Number(d.건수 || 0);
  }
}

    // 유료/무료 합계 재계산
    grouped[key].paidSum = grouped[key].paidMale + grouped[key].paidFemale;
    grouped[key].freeSum = grouped[key].freeMale + grouped[key].freeFemale;
  });

  // 결과 가공후 반환
  const result = Object.values(grouped).map((row) => ({
    ...row,
    actualTotal: row.actual,
    totalSum: row.total,
    performanceType: row.performanceType || "개별",
  }));

  const statRows = Object.values(grouped);
  const totalActual = statRows.reduce((sum, r) => sum + r.actual, 0);
  const totalVisits = statRows.reduce((sum, r) => sum + r.total, 0);

  console.log("📊 최종 row 수:", statRows.length);
  console.log(`📊 실인원 합계: ${totalActual}, 연인원 합계: ${totalVisits}`);

  console.log("📊 최종 결과:", result.length, "건");
  console.log(
    "📊 실적유형별 분포:",
    result.reduce((acc, item) => {
      acc[item.performanceType] = (acc[item.performanceType] || 0) + 1;
      return acc;
    }, {})
  );

  return result;
}

/**
 * [추가] 상세 참여자 raw 데이터 조회 함수
 */
export async function fetchAttendanceList({ function: func, team, unit, subProgram, year, month }) {
  const col = collection(db, "PerformanceSummary");
  const conditions = [
    where("기능", "==", func),
    where("팀명", "==", team),
    where("단위사업명", "==", unit),
    where("세부사업명", "==", subProgram),
  ];
  if (year && month) {
  const startDate = `${year}-${month}-01`;
  const lastDay = new Date(year, parseInt(month, 10), 0).getDate();
  const endDate = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
  conditions.push(where("날짜", ">=", startDate));
  conditions.push(where("날짜", "<=", endDate));
}

  const q = query(col, ...conditions);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      date: d.날짜,
      name: d.이용자명,
      gender: d.성별,
      result: isPresent(d.출석여부) ? "출석" : "결석",
      note: d["내용(특이사항)"] || "",
    };
  });
}