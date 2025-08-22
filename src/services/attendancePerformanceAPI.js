import {
  collection,
  getDocs,
  getDoc,
  orderBy,
  limit,
  startAfter,
  startAt,
  endAt,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  writeBatch,
  getCountFromServer,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase";
import { getStructureBySubProgram, resetTeamSubProgramMapCache } from "./teamSubProgramMapAPI";
import { getSubProgramMembers } from "./subProgramMemberAPI";
import { isPresent } from "../utils/attendanceUtils";
import { normalizeDate, getCurrentKoreanDate } from "../utils/dateUtils"; // ✅ 추가

// ✅ 문서 ID로 쓰기 안전한 키 생성 (슬래시/공백 등 문제 방지)
const makeSafeIdPart = (v) => encodeURIComponent(String(v ?? ""));
const buildDeterministicId = (...parts) => parts.map(makeSafeIdPart).join("__");

function coalesceKorEngKeys(obj = {}) {
  // 기능
  obj.기능 = obj.기능 || obj.function || "";
  obj.function = obj.function || obj.기능 || "";
  // 단위사업명
  obj.단위사업명 = obj.단위사업명 || obj.unit || "";
  obj.unit = obj.unit || obj.단위사업명 || "";
  // 팀명
  obj.팀명 = obj.팀명 || obj.team || "";
  obj.team = obj.team || obj.팀명 || "";
  return obj;
}

// 프로그램 운영일수(횟수) 산출 함수(예시, 실제 운영계획 DB에 맞게 구현)
export async function getProgramSessionsForMonth(세부사업명, yearMonth) {
  // 예시: ProgramPlan 컬렉션에서 세부사업명+yearMonth로 운영일수 조회
  // 실제 운영 DB 구조에 맞게 구현 필요!
  // 임시: 항상 4회 반환
  return 4;
}

/**
 * @param {Object} options
 *   - filters: { 세부사업명, 기능, 단위사업명, 날짜 } 등
 *   - pageSize: 한 페이지당 데이터 건수 (기본 50)
 *   - startAfterDoc: 페이지 커서 역할 문서 스냅샷
 */
export async function fetchPerformancesPaging({ filters = {}, pageSize = 50, startAfterDoc = null }) {
  const baseRef = collection(db, "PerformanceSummary");
  const conditions = [where("실적유형", "==", "개별")];

  if (filters.function) conditions.push(where("기능", "==", filters.function));
  if (filters.unit) conditions.push(where("단위사업명", "==", filters.unit));
  if (filters.세부사업명) conditions.push(where("세부사업명", "==", filters.세부사업명));
  if (filters.날짜) conditions.push(where("날짜", "==", normalizeDate(filters.날짜)));
  if (filters.이용자명) conditions.push(where("이용자명", "==", filters.이용자명));

  let total = null;
  try {
    const countQ = query(baseRef, ...conditions);
    const countSnap = await getCountFromServer(countQ);
    total = countSnap.data().count;
  } catch (e) {
    console.warn("getCountFromServer skipped:", e?.message || e);
  }

  let q = query(
    baseRef,
    ...conditions,
    orderBy("날짜", "desc"),
    orderBy("__name__"),
    limit(pageSize)
  );
  if (startAfterDoc) {
    q = query(q, startAfter(startAfterDoc));
  }

  const snap = await getDocs(q);
  return {
    items: snap.docs.map(d => ({ id: d.id, ...d.data() })),
    lastDoc: snap.docs[snap.docs.length - 1] || null,
    total
  };
}

// 고유아이디 조회
// ✅ 동명이인 모두 반환 (고유아이디 배열)
export async function getUserIds(이용자명, 성별, 세부사업명) {
  const members = await getSubProgramMembers({ 세부사업명 });
  let matches = members.filter(m => m.이용자명 === 이용자명 && m.성별 === 성별);

  if (matches.length === 0) {
    matches = members.filter(m => m.이용자명 === 이용자명);
  }

  return matches.map(m => m.고유아이디);
}

// ✅ 월별 출석 횟수 조회 (범위 쿼리 최적화 버전)
export async function getAttendanceCountForMonth(세부사업명, 이용자명, yearMonth) {
  try {
    // 날짜는 YYYY-MM-DD 포맷으로 저장되어 있다고 가정
    const start = `${yearMonth}-01`;
    const end = `${yearMonth}-\uf8ff`; // 문자열 상한 트릭

    const collectionRef = collection(db, "AttendanceRecords");
    const q = query(
      collectionRef,
      where("세부사업명", "==", 세부사업명),
      where("이용자명", "==", 이용자명),
      where("날짜", ">=", start),
      where("날짜", "<=", end)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("월별 출석 횟수 조회 오류:", error);
    return 0;
  }
}

// 출석 단건/일괄 등록 (동명이인 지원 + 중복 원천 차단 + 횟수/건수 반영)
export async function saveAttendanceRecords(records) {
  const collectionRef = collection(db, "AttendanceRecords");
  const perfCollectionRef = collection(db, "PerformanceSummary");
  const results = [];

  for (const record of records) {
    try {
      const 세부사업명 = record.세부사업명 || record.subProgram || "";
      const 이용자명 = record.이용자명 || record.memberName || "";
      const 성별 = record.성별 || record.gender || "";
      const 연락처 = record.연락처 || record.phone || "";
      const 내용 = record["내용(특이사항)"] || record.note || "";
      const normalizedDate = normalizeDate(record.날짜 || record.date);
      const 출석여부 = isPresent(record.출석여부);
      const 생년월일 = record.생년월일 ? normalizeDate(record.생년월일) : "";

      // 고유아이디 조회
      const 고유아이디목록 = record.고유아이디
        ? [record.고유아이디]
        : await getUserIds(이용자명, 성별, 세부사업명);

      if (고유아이디목록.length === 0) {
        results.push({ success: false, record, error: "고유아이디 없음 (동명이인/미등록)" });
        continue;
      }

      // 유료/무료 자동 연동
      let feeType = record.feeType || record.유료무료 || "";
      if (!feeType && 세부사업명 && 이용자명) {
        const members = await getSubProgramMembers({ 세부사업명 });
        const member = members.find(m => m.이용자명 === 이용자명 && m.성별 === 성별);
        if (member) feeType = member.유료무료 || "";
      }

      // 기능/단위/팀 자동 매핑
      let 기능 = record.function || record.기능 || "";
      let 단위사업명 = record.unit || record.단위사업명 || "";
      let 팀명 = record.team || record.팀명 || "";
      // 기존 매핑 부분 전체 대체
if ((!기능 || !단위사업명 || !팀명) && 세부사업명) {
  try {
    const mapped = await getStructureBySubProgram(세부사업명);
    기능 = 기능 || mapped?.function || "미지정";
    단위사업명 = 단위사업명 || mapped?.unit || "미지정";
    팀명 = 팀명 || mapped?.team || "미지정";
  } catch {
    기능 = 기능 || "미지정";
    단위사업명 = 단위사업명 || "미지정";
    팀명 = 팀명 || "미지정";
  }
}
// 혹시 세부사업명 자체도 없으면
if (!기능) 기능 = "미지정";
if (!단위사업명) 단위사업명 = "미지정";
if (!팀명) 팀명 = "미지정";

      // 횟수 / 건수 계산
      const sessions = Number(record.횟수) || 1;
      const cases = (!record.연인원 && !record.실인원) ? (Number(record.건수) || 0) : 0;

      // 동명이인 각각 트랜잭션 처리
      for (const 고유아이디 of 고유아이디목록) {
        const baseData = {
          날짜: normalizedDate,
          세부사업명,
          이용자명,
          성별,
          연락처,
          생년월일,
          "내용(특이사항)": 내용,
          고유아이디,
          출석여부,
          feeType,
          기능,
          단위사업명,
          팀명,
          // 영문 키 동시 저장
          function: 기능,
          unit: 단위사업명,
          team: 팀명,
          sessions,
          cases,
          createdAt: getCurrentKoreanDate(),
        };
        coalesceKorEngKeys(baseData);

        // 결정론적 문서 ID
        const attId = buildDeterministicId(normalizedDate, 세부사업명, 고유아이디);
        const perfId = buildDeterministicId(normalizedDate, 세부사업명, 고유아이디);
        const attRef = doc(collectionRef, attId);
        const perfRef = doc(perfCollectionRef, perfId);

        try {
          await runTransaction(db, async (tx) => {
            // 1) 출석: 없을 때만 생성
            const attSnap = await tx.get(attRef);
            if (attSnap.exists()) {
              // 이미 등록된 출석 -> 트랜잭션 중단
              throw new Error("DUP_ATTENDANCE");
            }
            tx.set(attRef, baseData); // 생성

            // 2) 실적: upsert (없으면 생성, 있으면 누적 업데이트)
            const perfSnap = await tx.get(perfRef);
            if (!perfSnap.exists()) {
              tx.set(perfRef, { ...baseData, 실적유형: "개별" });
            } else {
              const prev = perfSnap.data() || {};
              tx.update(perfRef, {
                ...baseData,
                sessions: (Number(prev.sessions) || 1) + sessions,
                cases: (Number(prev.cases) || 0) + cases,
              });
            }
          });

          results.push({ success: true, record, 고유아이디 });
        } catch (e) {
          if (e && e.message === "DUP_ATTENDANCE") {
            results.push({
              success: false,
              record,
              고유아이디,
              error: "이미 등록된 출석 (고유아이디 기준)",
            });
          } else {
            results.push({ success: false, record, 고유아이디, error: e?.message || String(e) });
          }
        }
      }
    } catch (err) {
      results.push({ success: false, record, error: err.message });
    }
  }

  return results;
}

// ✅ 새로 추가: 대량 출석을 배치로 저장(경고/부하 완화)
export async function saveAttendanceRecordsBatched(records, chunkSize = 350) {
  const collectionRef = collection(db, "AttendanceRecords");
  const perfCollectionRef = collection(db, "PerformanceSummary");
  const results = [];

  let batch = writeBatch(db);
  let pendingOps = 0;

  async function flush() {
    if (pendingOps > 0) {
      await batch.commit();
      batch = writeBatch(db);
      pendingOps = 0;
    }
  }

  for (const record of records) {
    try {
      const 세부사업명 = record.세부사업명 || record.subProgram || "";
      const 이용자명 = record.이용자명 || record.memberName || "";
      const 성별 = record.성별 || record.gender || "";
      const 연락처 = record.연락처 || record.phone || "";
      const 내용 = record["내용(특이사항)"] || record.note || "";
      const normalizedDate = normalizeDate(record.날짜 || record.date);
      const 출석여부 = isPresent(record.출석여부);
      const 생년월일 = record.생년월일 ? normalizeDate(record.생년월일) : "";

      const 고유아이디목록 = record.고유아이디
        ? [record.고유아이디]
        : await getUserIds(이용자명, 성별, 세부사업명);

      if (고유아이디목록.length === 0) {
        results.push({ success: false, record, error: "고유아이디 없음 (동명이인/미등록)" });
        continue;
      }

      let feeType = record.feeType || record.유료무료 || "";
      if (!feeType && 세부사업명 && 이용자명) {
        const members = await getSubProgramMembers({ 세부사업명 });
        const member = members.find(m => m.이용자명 === 이용자명 && m.성별 === 성별);
        if (member) feeType = member.유료무료 || "";
      }

      let 기능 = record.function || record.기능 || "";
      let 단위사업명 = record.unit || record.단위사업명 || "";
      let 팀명 = record.team || record.팀명 || "";
      if ((!기능 || !단위사업명 || !팀명) && 세부사업명) {
        try {
          const map = await getStructureBySubProgram(세부사업명);
          if (map) {
            기능 = 기능 || map.function;
            단위사업명 = 단위사업명 || map.unit;
            팀명 = 팀명 || map.team;
          }
        } catch {
          기능 = 기능 || "오류";
          단위사업명 = 단위사업명 || "오류";
          팀명 = 팀명 || "오류";
        }
      }

      let sessions = Number(record.횟수) || 1;
      let cases = (!record.연인원 && !record.실인원) ? (Number(record.건수) || 0) : 0;

      for (const 고유아이디 of 고유아이디목록) {
        // --- 기존 saveAttendanceRecords와 동일한 1~3순위 중복검사 ---
        let isDuplicate = false;

        // 고유아이디 기준 중복만 체크 (동명이인 허용)
        let q = query(
          collectionRef,
          where("날짜", "==", normalizedDate),
          where("세부사업명", "==", 세부사업명),
          where("고유아이디", "==", 고유아이디)
        );
        let snapshot = await getDocs(q);
        if (!snapshot.empty) isDuplicate = true;

        if (isDuplicate) {
          results.push({ success: false, record, error: "이미 등록된 출석 (고유아이디 기준)" });
          continue;
        }

        // --- AttendanceRecords: set (배치) ---
        const attRef = doc(collectionRef);
        const docData = {
          날짜: normalizedDate,
          세부사업명, 이용자명, 성별, 연락처, 생년월일,
          "내용(특이사항)": 내용,
          고유아이디, 출석여부, feeType, 기능, 단위사업명, 팀명,
         // ✅ 영문 키 동시 저장
         function: 기능,
         unit: 단위사업명,
         team: 팀명,
          sessions, cases, createdAt: getCurrentKoreanDate()
        };
        coalesceKorEngKeys(docData); // ⬇️ 여기
        batch.set(attRef, docData);
        pendingOps++;

        // --- PerformanceSummary: upsert (배치) ---
        const perfQ = query(
          perfCollectionRef,
          where("날짜", "==", normalizedDate),
          where("세부사업명", "==", 세부사업명),
          where("고유아이디", "==", 고유아이디)
        );
        const perfSnap = await getDocs(perfQ);

        if (perfSnap.empty) {
          const newPerfRef = doc(perfCollectionRef);
          batch.set(newPerfRef, { ...docData, 실적유형: "개별" });
          pendingOps++;
        } else {
          const prev = perfSnap.docs[0].data();
          const perfDocRef = doc(db, "PerformanceSummary", perfSnap.docs[0].id);
          batch.update(perfDocRef, {
            ...docData,
            sessions: (Number(prev.sessions) || 1) + sessions,
            cases: (Number(prev.cases) || 0) + cases
          });
          pendingOps++;
        }

        if (pendingOps >= chunkSize) await flush();
        results.push({ success: true, record, 고유아이디 });
      }
    } catch (err) {
      results.push({ success: false, record, error: err.message });
    }
  }

  await flush();
  return results;
}

// 출석 전체 조회 (필터 적용)
export async function fetchAttendances(filters = {}) {
  let q = collection(db, "AttendanceRecords");
  const conditions = [];

  if (filters.날짜) conditions.push(where("날짜", "==", normalizeDate(filters.날짜))); // ✅ 날짜 정규화
  if (filters.세부사업명) conditions.push(where("세부사업명", "==", filters.세부사업명));
  if (filters.이용자명) conditions.push(where("이용자명", "==", filters.이용자명));

  if (conditions.length > 0) q = query(q, ...conditions);

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    출석여부: isPresent(doc.data().출석여부)
  }));
}

// ✅ 출석 기록 페이징 조회
export async function fetchAttendanceRecords({ pageSize = 100, lastDoc = null }) {
  let q = query(
    collection(db, "AttendanceRecords"),
    orderBy("날짜", "desc"),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    출석여부: isPresent(doc.data().출석여부)
  }));

  return {
    data,
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
  };
}

// 실적 전체 조회 (개별실적만 조회하도록 수정)
export async function fetchPerformances(filters = {}) {
  let q = collection(db, "PerformanceSummary");
  const conditions = [];

  // ✅ 개별 실적만 조회 (대량실적 제외)
  conditions.push(where("실적유형", "==", "개별"));

  if (filters.function) conditions.push(where("기능", "==", filters.function));
  if (filters.unit) conditions.push(where("단위사업명", "==", filters.unit));
  if (filters.팀명) conditions.push(where("팀명", "==", filters.팀명));
  if (filters.세부사업명) conditions.push(where("세부사업명", "==", filters.세부사업명));
  if (filters.날짜) conditions.push(where("날짜", "==", normalizeDate(filters.날짜))); // ✅ 날짜 정규화

  // ✅ 고유아이디 필터 추가
  if (filters.고유아이디) conditions.push(where("고유아이디", "==", filters.고유아이디));
  if (conditions.length > 0) q = query(q, ...conditions);

  const snapshot = await getDocs(q);
  const result = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    출석여부: isPresent(doc.data().출석여부)
  }));

  return result;
}

// ✅ 대량실적 전용 조회 함수 추가
export async function fetchBulkPerformances(filters = {}) {
  let q = collection(db, "PerformanceSummary");
  const conditions = [];

  // 대량실적만 조회
  conditions.push(where("실적유형", "==", "대량"));

  if (filters.function) conditions.push(where("기능", "==", filters.function));
  if (filters.unit) conditions.push(where("단위사업명", "==", filters.unit));
  if (filters.팀명) conditions.push(where("팀명", "==", filters.팀명));
  if (filters.세부사업명) conditions.push(where("세부사업명", "==", filters.세부사업명));
  if (filters.날짜) conditions.push(where("날짜", "==", normalizeDate(filters.날짜))); // ✅ 날짜 정규화

  if (conditions.length > 0) q = query(q, ...conditions);

  const snapshot = await getDocs(q);
  const result = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return result;
}

// ✅ 전체 실적 조회 함수 (필터 옵션 추가)
export async function fetchAllPerformances(filters = {}, includeType = "all") {
  let q = collection(db, "PerformanceSummary");
  const conditions = [];

  // 실적 유형별 필터링
  if (includeType === "individual") {
    conditions.push(where("실적유형", "==", "개별"));
  } else if (includeType === "bulk") {
    conditions.push(where("실적유형", "==", "대량"));
  }
  // includeType === "all"이면 필터 없음

  if (filters.function) conditions.push(where("기능", "==", filters.function));
  if (filters.unit) conditions.push(where("단위사업명", "==", filters.unit));
  if (filters.팀명) conditions.push(where("팀명", "==", filters.팀명));
  if (filters.세부사업명) conditions.push(where("세부사업명", "==", filters.세부사업명));
  if (filters.날짜) conditions.push(where("날짜", "==", normalizeDate(filters.날짜))); // ✅ 날짜 정규화
  if (filters.이용자명) conditions.push(where("이용자명", "==", filters.이용자명));

  if (conditions.length > 0) q = query(q, ...conditions);

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    출석여부: isPresent(doc.data().출석여부)
  }));
}

// 실적 단건 등록 (팀/단위/기능 자동 매핑)
export async function savePerformance(data) {
  const collectionRef = collection(db, "PerformanceSummary");
  let isUserPerformance = !!data.이용자명;

  if (isUserPerformance) {
    const normalizedDate = normalizeDate(data.날짜);

    // 고유아이디 조회
    const 고유아이디목록 = data.고유아이디
      ? [data.고유아이디]
      : await getUserIds(data.이용자명, data.성별, data.세부사업명);

    if (고유아이디목록.length === 0) {
      throw new Error("고유아이디 없음 (동명이인/미등록)");
    }

    for (const 고유아이디 of 고유아이디목록) {
      // 중복 체크
      const q = query(
        collectionRef,
        where("날짜", "==", normalizedDate),
        where("세부사업명", "==", data.세부사업명),
        where("고유아이디", "==", 고유아이디)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) continue; // 이미 등록된 경우 건너뜀

      // 실적 데이터 준비
      let docData = { ...data, 날짜: normalizedDate, 고유아이디, 실적유형: "개별" };

      // 유료/무료 자동 연동
      if (!docData.feeType && docData.세부사업명 && docData.이용자명) {
        const members = await getSubProgramMembers({ 세부사업명: docData.세부사업명 });
        const member = members.find(m => m.이용자명 === docData.이용자명);
        if (member) docData.feeType = member.유료무료 || "";
      }

      // 기능/단위/팀 자동 매핑
      if ((!docData.function || !docData.unit || !docData.team) && docData.세부사업명) {
        const map = await getStructureBySubProgram(docData.세부사업명);
        if (map) {
          docData.function = docData.function || map.function;
          docData.unit = docData.unit || map.unit;
          docData.team = docData.team || map.team;
          docData.기능 = docData.기능 || docData.function;
         docData.단위사업명 = docData.단위사업명 || docData.unit;
         docData.팀명 = docData.팀명 || docData.team;
        }
      }

      docData.출석여부 = isPresent(data.출석여부);
      docData.createdAt = getCurrentKoreanDate();

      // Firestore 저장
      coalesceKorEngKeys(docData); // ⬇️ 여기
      const docRef = await addDoc(collectionRef, docData);
      return { id: docRef.id, ...docData }; // ✅ 단일 결과 반환
    }

    throw new Error("이미 등록된 실적입니다."); // 모든 아이디가 이미 등록된 경우
  }

  // 이용자명이 없는 경우 (예외 처리)
  let docData = { ...data };
  docData.날짜 = normalizeDate(docData.날짜);
  docData.실적유형 = "개별";
  docData.createdAt = getCurrentKoreanDate();
  coalesceKorEngKeys(docData); // ⬇️ 여기
  const docRef = await addDoc(collectionRef, docData);
  return { id: docRef.id, ...docData };
}

// 실적 수정 (+ 출석 데이터 동기화) - 최종 버전
export async function updatePerformance(id, data) {
  // ✅ undefined/null 값 제거
  const cleanData = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && key !== "id") {
      cleanData[key] = value;
    }
  });

  // ✅ 날짜 정규화
  if (cleanData.날짜) {
    cleanData.날짜 = normalizeDate(cleanData.날짜);
  }

  // 필수 필드 처리 및 고유아이디 조회
  if (cleanData.이용자명 && cleanData.세부사업명) {
    const ids = await getUserIds(cleanData.이용자명, cleanData.성별, cleanData.세부사업명);
if (ids.length === 0) throw new Error("고유아이디 없음 (동명이인/미등록)");
cleanData.고유아이디 = ids[0];

    if (!cleanData.feeType) {
      const members = await getSubProgramMembers({ 세부사업명: cleanData.세부사업명 });
      const member = members.find(
        m => m.이용자명 === cleanData.이용자명 && m.고유아이디 === cleanData.고유아이디
      );
      if (member) cleanData.feeType = member.유료무료 || "";
    }
  }

  if (cleanData.출석여부 !== undefined) {
    cleanData.출석여부 = isPresent(cleanData.출석여부);
  }

  console.log("✅ updatePerformance 적용 데이터:", cleanData);
  coalesceKorEngKeys(cleanData);
  // ✅ PerformanceSummary에서 해당 고유아이디 전부 업데이트
  const perfQ = query(
    collection(db, "PerformanceSummary"),
    where("날짜", "==", cleanData.날짜),
    where("세부사업명", "==", cleanData.세부사업명),
    where("고유아이디", "==", cleanData.고유아이디) // 🔥 고유아이디 기준
  );
  const perfSnap = await getDocs(perfQ);

  for (const docSnap of perfSnap.docs) {
    await updateDoc(doc(db, "PerformanceSummary", docSnap.id), cleanData);
  }

  // ✅ AttendanceRecords도 고유아이디 기준으로 동기화
  if (cleanData.이용자명 && cleanData.날짜 && cleanData.세부사업명 && cleanData.고유아이디) {
    const attendQ = query(
      collection(db, "AttendanceRecords"),
      where("날짜", "==", cleanData.날짜),
      where("세부사업명", "==", cleanData.세부사업명),
      where("고유아이디", "==", cleanData.고유아이디) // 🔥 고유아이디 기준
    );
    const attendSnap = await getDocs(attendQ);

    for (const docSnap of attendSnap.docs) {
      const syncData = { ...cleanData };
      delete syncData.id;
      await updateDoc(doc(db, "AttendanceRecords", docSnap.id), syncData);
    }
  }

  return { ...cleanData };
}

// 실적 삭제 (+ 출석 데이터 동기화)
export async function deletePerformance(id) {
  const perfDocRef = doc(db, "PerformanceSummary", id);
  const perfSnap = await getDoc(perfDocRef);
let perfData = perfSnap.exists() ? perfSnap.data() : null;

  await deleteDoc(perfDocRef);

  if (perfData && perfData.이용자명 && perfData.날짜 && perfData.세부사업명) {
    const attendCol = collection(db, "AttendanceRecords");
    const q = query(
  attendCol,
  where("날짜", "==", perfData.날짜),
  where("세부사업명", "==", perfData.세부사업명),
  where("고유아이디", "==", perfData.고유아이디)
);
    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, "AttendanceRecords", docSnap.id));
    }
  }

  return { id };
}

// 실적 일괄 삭제 (+ 출석 데이터 동기화)
export async function deleteMultiplePerformances(ids) {
  const deleted = [];
  const failed = [];

  for (const id of ids) {
    try {
      await deletePerformance(id);
      deleted.push(id);
    } catch (err) {
      failed.push({ id, error: err.message });
    }
  }

  return { deleted, failed };
}

// 실적 대량 업로드 (이용자별 실적 업로드, 팀/단위/기능 자동 매핑)
export async function uploadPerformanceData(rows) {
  try { await resetTeamSubProgramMapCache(); } catch {}
  const results = [];
  const collectionRef = collection(db, "PerformanceSummary");

  for (const row of rows) {
    let { 기능, 단위사업명, 세부사업명, 이용자명, 날짜 } = row;
    날짜 = normalizeDate(날짜);
    let 팀명 = row.팀명 ? String(row.팀명).trim() : "";

    if ((!기능 || !단위사업명 || !팀명) && 세부사업명) {
      try {
        const mapped = await getStructureBySubProgram(세부사업명);
        if (mapped) {
          기능 = 기능 || mapped.function || "";
          단위사업명 = 단위사업명 || mapped.unit || "";
          팀명 = 팀명 || mapped.team || "";
        }
        if (!기능) 기능 = "미지정";
        if (!단위사업명) 단위사업명 = "미지정";
        if (!팀명) 팀명 = "미지정";
      } catch (err) {
        기능 = 기능 || "미지정";
        단위사업명 = 단위사업명 || "미지정";
        팀명 = 팀명 || "미지정";
      }
    }

    if (!기능 || !단위사업명 || !세부사업명 || !이용자명 || !날짜 || !팀명) {
      results.push({ success: false, row, error: "필수 필드 누락" });
      continue;
    }

    const 고유아이디목록 = row.고유아이디
      ? [row.고유아이디]
      : await getUserIds(이용자명, row.성별, 세부사업명);

    if (고유아이디목록.length === 0) {
      results.push({ success: false, row, error: "고유아이디 없음 (동명이인/미등록)" });
      continue;
    }

    for (const 고유아이디 of 고유아이디목록) {
      const q = query(
        collectionRef,
        where("날짜", "==", 날짜),
        where("세부사업명", "==", 세부사업명),
        where("고유아이디", "==", 고유아이디)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        results.push({ success: false, row, error: `중복 데이터 존재 (${고유아이디})` });
        continue;
      }

      let feeType = row.feeType || row.유료무료 || "";
      if (!feeType && 세부사업명 && 이용자명) {
        const members = await getSubProgramMembers({ 세부사업명 });
        const member = members.find(m => m.고유아이디 === 고유아이디);
        if (member) feeType = member.유료무료 || "";
      }

      const docData = {
        function: 기능,
        unit: 단위사업명,
        team: 팀명,
        기능,
        단위사업명,
        팀명,
        세부사업명,
        이용자명,
        고유아이디,
        성별: row.성별 || "",
        result: row.출석여부 || "",
        "내용(특이사항)": row["내용(특이사항)"] || "",
        날짜,
        등록인원: Number(row.등록인원) || 0,
        실인원: Number(row.실인원) || 0,
        연인원: Number(row.연인원) || 0,
        건수: (!row.연인원 && !row.실인원) ? (Number(row.건수) || 0) : 0,
        sessions: Number(row.횟수) || 1,
        출석여부: isPresent(row.출석여부),
        feeType,
        비고: row.비고 || "",
        실적유형: "개별",
        createdAt: getCurrentKoreanDate()
      };

      coalesceKorEngKeys(docData);
      await addDoc(collectionRef, docData);
      results.push({ success: true, row, 고유아이디 });
    }
  }

  return results;
}

// 실적 대량 업로드 (집계용: 세부사업명만 필수, 등록인원/실인원/연인원/건수/비고/기능/팀명/단위사업명)
export async function uploadBulkPerformanceSummary(rows) {
  try { await resetTeamSubProgramMapCache(); } catch {}
  const collectionRef = collection(db, "PerformanceSummary");
  const results = [];

  for (const row of rows) {
    const 날짜 = normalizeDate(row.날짜 || getCurrentKoreanDate());
    const 세부사업명 = (row.세부사업명 || "")
      .replace(/\u00A0|\u200B|\u200C|\u200D|\uFEFF/g, "")
      .trim()
      .replace(/\s+/g, " ");

    if (!세부사업명) {
      results.push({ success: false, row, error: "세부사업명은 필수입니다." });
      continue;
    }

    let 단위사업명 = (row.단위사업명 || "").trim();
    let 기능 = (row.기능 || "").trim();
    let 팀명 = (row.팀명 || "").trim();

    // 세부사업명 기반 자동 매핑
    if ((!기능 || !단위사업명 || !팀명) && 세부사업명) {
      try {
        const mapped = await getStructureBySubProgram(세부사업명); // { team, function, unit }
        if (mapped) {
          기능 = 기능 || mapped.function || "";
          단위사업명 = 단위사업명 || mapped.unit || "";
          팀명 = 팀명 || mapped.team || "";
        }
        if (!기능) 기능 = "미지정";
        if (!단위사업명) 단위사업명 = "미지정";
        if (!팀명) 팀명 = "미지정";
      } catch (err) {
        기능 = 기능 || "미지정";
        단위사업명 = 단위사업명 || "미지정";
        팀명 = 팀명 || "미지정";
      }
    }

    const 등록인원 = Number(row.등록인원) || 0;
    const 실인원 = Number(row.실인원) || 0;
    const 연인원 = Number(row.연인원) || 0;
    const 건수 = Number(row.건수) || 0;
    const 비고 = (row.비고 || "").trim();

    try {
      // 동일 날짜, 세부사업명, 대량 유형 문서 중 완전 동일값 중복 방지
      const q = query(
        collectionRef,
        where("날짜", "==", 날짜),
        where("세부사업명", "==", 세부사업명),
        where("실적유형", "==", "대량")
      );
      const snapshot = await getDocs(q);

      const duplicateDoc = snapshot.docs.find(d => {
        const data = d.data();
        return (
          data.단위사업명 === 단위사업명 &&
          data.등록인원 === 등록인원 &&
          data.실인원 === 실인원 &&
          data.연인원 === 연인원 &&
          data.건수 === 건수 &&
          data.비고 === 비고
        );
      });

      if (duplicateDoc) {
        results.push({ success: false, row, error: "완전 중복 데이터 존재 (모든 필드 동일)" });
        continue;
      }

      const docData = {
        날짜,
        세부사업명,
        단위사업명,
        기능,
        팀명,
        unit: 단위사업명,
        function: 기능,
        team: 팀명,
        등록인원,
        실인원,
        연인원,
        건수,
        비고,
        createdAt: getCurrentKoreanDate(),
        실적유형: "대량",
      };

      coalesceKorEngKeys(docData);
      await addDoc(collectionRef, docData);
      results.push({ success: true, row });
    } catch (err) {
      results.push({ success: false, row, error: err.message });
    }
  }

  return results;
}

// 출석 대량 업로드 (신규만 등록, 실적 자동 생성/업데이트)
export async function uploadAttendanceData(rows) {
  try { await resetTeamSubProgramMapCache(); } catch {}
  for (const row of rows) {
  if (!row.고유아이디 && row.세부사업명 && row.이용자명 && row.성별) {
    const members = await getSubProgramMembers({ 세부사업명: row.세부사업명 });
    const matched = members.find(m =>
  m.이용자명 === row.이용자명 &&
  (!row.성별 || m.성별 === row.성별) &&
  (!row.연락처 || m.연락처 === row.연락처) &&
  (!row.생년월일 || m.생년월일 === normalizeDate(row.생년월일))
);
    if (matched) {
      row.고유아이디 = matched.고유아이디;
      row.유료무료 = row.유료무료 || matched.유료무료;
    }
  }
}
  return rows.length > 350
  ? await saveAttendanceRecordsBatched(rows, 350) // ✅ 대량일 때 배치 저장
  : await saveAttendanceRecords(rows);            // ✅ 소량은 기존 로직
}

// 세부사업명 기준 실적 조회
export async function fetchPerformanceBySubProgram(세부사업명) {
  const collectionRef = collection(db, "PerformanceSummary");
  const q = query(collectionRef, where("세부사업명", "==", 세부사업명));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 대기 중인 신규 회원 저장 (6단계)
export async function savePendingMembers(members) {
  const batch = writeBatch(db);
  members.forEach(member => {
    const ref = doc(collection(db, "PendingMembers"));
    batch.set(ref, { 
      ...member, 
      createdAt: getCurrentKoreanDate(), // ✅ 문자열로 저장
      상태: "대기" 
    });
  });
  await batch.commit();
  return members.length;
}

// [추가] 필터 조건으로 Firestore를 커서 기반으로 끝까지 순회하여 전량 수집
export async function fetchAllPerformancesPaged(args) {
  const filters = args && args.filters ? args.filters : {};
  const batchSize = args && args.batchSize ? args.batchSize : 500;

  const baseRef = collection(db, "PerformanceSummary");
  const conds = [where("실적유형", "==", "개별")];

  if (filters.function) conds.push(where("기능", "==", filters.function));
  if (filters.unit) conds.push(where("단위사업명", "==", filters.unit));
  if (filters.팀명) conds.push(where("팀명", "==", filters.팀명));
  if (filters.세부사업명) conds.push(where("세부사업명", "==", filters.세부사업명));
  if (filters.날짜) conds.push(where("날짜", "==", normalizeDate(filters.날짜)));

  const namePrefix = (filters.이용자명 || "").trim();

  let q;
  if (namePrefix) {
    q = query(
      baseRef,
      ...conds,
      orderBy("이용자명"),
      orderBy("날짜", "desc"),
      orderBy("__name__"),
      startAt(namePrefix),
      endAt(namePrefix + "\uf8ff"),
      limit(batchSize)
    );
  } else {
    q = query(
      baseRef,
      ...conds,
      orderBy("날짜", "desc"),
      orderBy("__name__"),
      limit(batchSize)
    );
  }

  const all = [];
  let lastDoc = null;

  while (true) {
    const snap = await getDocs(q);
    if (snap.empty) break;

    for (const d of snap.docs) {
      all.push({ id: d.id, ...d.data() });
    }

    lastDoc = snap.docs[snap.docs.length - 1];

    if (namePrefix) {
      q = query(
        baseRef,
        ...conds,
        orderBy("이용자명"),
        orderBy("날짜", "desc"),
        orderBy("__name__"),
        startAt(namePrefix),
        endAt(namePrefix + "\uf8ff"),
        startAfter(lastDoc),
        limit(batchSize)
      );
    } else {
      q = query(
        baseRef,
        ...conds,
        orderBy("날짜", "desc"),
        orderBy("__name__"),
        startAfter(lastDoc),
        limit(batchSize)
      );
    }
  }

  return all;
}