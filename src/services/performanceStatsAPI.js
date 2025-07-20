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
  
  // ✅ 수정된 쿼리 로직: 더 안전하고 포괄적인 조회
  const queries = [];
  
  // 공통 필터 조건
  const commonConstraints = [];
  if (func) commonConstraints.push(where("기능", "==", func));
  if (team) commonConstraints.push(where("팀명", "==", team));
  if (unit) commonConstraints.push(where("단위사업명", "==", unit));
  if (subProgram) commonConstraints.push(where("세부사업명", "==", subProgram));
  if (months && months.length > 0) {
    commonConstraints.push(where("month", "in", months));
  }

  // ✅ 실적유형별 쿼리 전략 개선
  if (performanceType === "전체") {
    // 전체 조회: 개별실적과 대량실적을 각각 조회
    
    // 1) 개별실적 조회 (실적유형이 "대량"이 아닌 모든 데이터)
    let individualQuery = collection(db, "PerformanceSummary");
    const individualConstraints = [...commonConstraints];
    // ✅ 핵심 수정: "개별"로 직접 조회하지 않고 "대량"이 아닌 모든 것 조회
    individualConstraints.push(where("실적유형", "!=", "대량"));
    
    if (individualConstraints.length > 0) {
      individualQuery = query(individualQuery, ...individualConstraints);
    }
    queries.push(individualQuery);

    // 2) 대량실적 조회
    let bulkQuery = collection(db, "PerformanceSummary");
    const bulkConstraints = [...commonConstraints, where("실적유형", "==", "대량")];
    
    if (bulkConstraints.length > 0) {
      bulkQuery = query(bulkQuery, ...bulkConstraints);
    }
    queries.push(bulkQuery);
    
  } else if (performanceType === "개별") {
    // 개별실적만 조회
    let individualQuery = collection(db, "PerformanceSummary");
    const individualConstraints = [...commonConstraints, where("실적유형", "!=", "대량")];
    
    if (individualConstraints.length > 0) {
      individualQuery = query(individualQuery, ...individualConstraints);
    }
    queries.push(individualQuery);
    
  } else if (performanceType === "대량") {
    // 대량실적만 조회
    let bulkQuery = collection(db, "PerformanceSummary");
    const bulkConstraints = [...commonConstraints, where("실적유형", "==", "대량")];
    
    if (bulkConstraints.length > 0) {
      bulkQuery = query(bulkQuery, ...bulkConstraints);
    }
    queries.push(bulkQuery);
  }

  console.log("📊 실행할 쿼리 개수:", queries.length);

  // ✅ 병렬 쿼리 실행
  const snapshots = await Promise.all(queries.map(q => getDocs(q)));
  const allDocs = snapshots.flatMap(snapshot => snapshot.docs);
  
  console.log("📊 조회된 문서 개수:", allDocs.length);
  console.log("📊 조회된 데이터 샘플:", allDocs.slice(0, 3).map(doc => ({
    id: doc.id,
    실적유형: doc.data().실적유형,
    세부사업명: doc.data().세부사업명,
    기능: doc.data().기능
  })));

  // ✅ 집계 로직 (기존 유지하면서 안전성 강화)
  const grouped = {};
  const uniqueUserMap = {}; // key별 고유 이용자명/고유아이디 Set
  const sessionSet = {}; // key별 프로그램+날짜 Set (횟수 집계용)

  allDocs.forEach(doc => {
    const d = doc.data();
    const year = d.날짜 ? d.날짜.slice(0, 4) : d.year;
    const month = d.날짜 ? d.날짜.slice(5, 7) : d.month;
    const quarter = month ? Math.ceil(parseInt(month, 10) / 3).toString() : "";

    if (Array.isArray(quarters) && quarters.length > 0 && !quarters.includes(quarter)) return;

    // 💡 필드명 매핑 보완 (한글 필드 대응 추가)
    const func = d.function || d["기능"] || "";
    const teamName = d.team || d["팀명"] || "";
    const unitName = d.unit || d["단위사업명"] || "";
    const subProgramName = d.subProgram || d["세부사업명"] || "";

    const key = [
      func,
      teamName,
      unitName,
      subProgramName,
      year || "",
      month || "",
      quarter || ""
    ].join("|");

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
        // ✅ performanceType 결정 로직 개선
        performanceType: (d.실적유형 && d.실적유형.trim() === "대량") ? "대량" : "개별"
      };
      uniqueUserMap[key] = new Set();
      sessionSet[key] = new Set();
    }

    // === 횟수(운영일수) 표준 집계: 프로그램+날짜별 1회만 ===
    const sessionKey = `${subProgramName}_${d.날짜 || ""}`;
    if (d.날짜 && subProgramName && !sessionSet[key].has(sessionKey)) {
      grouped[key].sessions += 1;
      sessionSet[key].add(sessionKey);
    }

    // ✅ 대량실적과 개별실적 구분 처리 (더 안전한 조건)
    const isBulkPerformance = d.실적유형 && d.실적유형.trim() === "대량";
    
    if (isBulkPerformance) {
      // 대량실적 처리
      grouped[key].registered += Number(d.등록인원) || 0;
      grouped[key].actual += Number(d.실인원) || 0;
      grouped[key].total += Number(d.연인원) || 0;
      grouped[key].cases += Number(d.건수) || 0;
      
      // 성별별 집계 (대량실적도 성별 데이터가 있는 경우 처리)
      if (d.actualMale !== undefined) grouped[key].actualMale += Number(d.actualMale) || 0;
      if (d.actualFemale !== undefined) grouped[key].actualFemale += Number(d.actualFemale) || 0;
      if (d.totalMale !== undefined) grouped[key].totalMale += Number(d.totalMale) || 0;
      if (d.totalFemale !== undefined) grouped[key].totalFemale += Number(d.totalFemale) || 0;
      if (d.paidMale !== undefined) grouped[key].paidMale += Number(d.paidMale) || 0;
      if (d.paidFemale !== undefined) grouped[key].paidFemale += Number(d.paidFemale) || 0;
      if (d.freeMale !== undefined) grouped[key].freeMale += Number(d.freeMale) || 0;
      if (d.freeFemale !== undefined) grouped[key].freeFemale += Number(d.freeFemale) || 0;
      
    } else {
      // 개별실적 처리: 출석여부가 출석일 때만 집계
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

        if (d.feeType === "유료" || d.유료무료 === "유료") {
          if (d.성별 === "남") grouped[key].paidMale += 1;
          if (d.성별 === "여") grouped[key].paidFemale += 1;
        }

        if (d.feeType === "무료" || d.유료무료 === "무료") {
          if (d.성별 === "남") grouped[key].freeMale += 1;
          if (d.성별 === "여") grouped[key].freeFemale += 1;
        }

        if ((!d.실인원 && !d.연인원) && d.건수) {
          grouped[key].cases += Number(d.건수) || 0;
        }
      }
    }

    // 유료/무료 합계 업데이트
    grouped[key].paidSum = grouped[key].paidMale + grouped[key].paidFemale;
    grouped[key].freeSum = grouped[key].freeMale + grouped[key].freeFemale;
  });

  const result = Object.values(grouped).map(row => ({
    ...row,
    actualTotal: row.actual,
    totalSum: row.total,
    // ✅ performanceType 최종 확정
    performanceType: row.performanceType || "개별"
  }));

  console.log("📊 최종 결과:", result.length, "건");
  console.log("📊 실적유형별 분포:", result.reduce((acc, item) => {
    acc[item.performanceType] = (acc[item.performanceType] || 0) + 1;
    return acc;
  }, {}));

  return result;
}