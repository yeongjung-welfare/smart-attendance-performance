import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase";
import { getStructureBySubProgram } from "./teamSubProgramMapAPI";
import { getSubProgramMembers } from "./subProgramMemberAPI";
import { isPresent } from "../utils/attendanceUtils";
import { normalizeDate, getCurrentKoreanDate } from "../utils/dateUtils"; // ✅ 추가

// 프로그램 운영일수(횟수) 산출 함수(예시, 실제 운영계획 DB에 맞게 구현)
export async function getProgramSessionsForMonth(세부사업명, yearMonth) {
  // 예시: ProgramPlan 컬렉션에서 세부사업명+yearMonth로 운영일수 조회
  // 실제 운영 DB 구조에 맞게 구현 필요!
  // 임시: 항상 4회 반환
  return 4;
}

// 고유아이디 조회
export async function getUserId(이용자명, 세부사업명) {
  const members = await getSubProgramMembers({ 세부사업명 });
  const member = members.find(m => m.이용자명 === 이용자명);
  return member ? member.고유아이디 : "";
}

// ✅ 월별 출석 횟수 조회 함수 추가
export async function getAttendanceCountForMonth(세부사업명, 이용자명, yearMonth) {
  try {
    const collectionRef = collection(db, "AttendanceRecords");
    const q = query(
      collectionRef,
      where("세부사업명", "==", 세부사업명),
      where("이용자명", "==", 이용자명)
    );
    
    const snapshot = await getDocs(q);
    let count = 0;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const recordDate = normalizeDate(data.날짜);
      if (recordDate && recordDate.slice(0, 7) === yearMonth) {
        count++;
      }
    });
    
    return count;
  } catch (error) {
    console.error("월별 출석 횟수 조회 오류:", error);
    return 0;
  }
}

// 출석 단건/일괄 등록 (중복 제외, 신규만 등록) + 실적 자동 생성/업데이트
export async function saveAttendanceRecords(records) {
  const collectionRef = collection(db, "AttendanceRecords");
  const perfCollectionRef = collection(db, "PerformanceSummary");
  const results = [];

  for (const record of records) {
    const 출석여부 = isPresent(record.출석여부);
    const normalizedDate = normalizeDate(record.날짜 || record.date); // ✅ 날짜 정규화 추가

    const q = query(
      collectionRef,
      where("날짜", "==", normalizedDate), // ✅ 정규화된 날짜 사용
      where("세부사업명", "==", record.세부사업명 || record.subProgram),
      where("이용자명", "==", record.이용자명 || record.memberName)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      results.push({ success: false, record, error: "이미 등록된 출석입니다." });
      continue;
    }

    try {
      // ✅ 필드명 통일 처리
      const 세부사업명 = record.세부사업명 || record.subProgram || "";
      const 이용자명 = record.이용자명 || record.memberName || "";
      const 성별 = record.성별 || record.gender || "";
      const 연락처 = record.연락처 || record.phone || "";
      const 내용 = record["내용(특이사항)"] || record.note || "";

      // 유료/무료 자동 연동
      let feeType = record.feeType || record.유료무료 || "";
      if (!feeType && 세부사업명 && 이용자명) {
        const members = await getSubProgramMembers({ 세부사업명 });
        const member = members.find(m => m.이용자명 === 이용자명);
        if (member) feeType = member.유료무료 || "";
      }

      // 기능/단위/팀 자동 매핑
      let 기능 = record.function || record.기능 || "";
      let 단위사업명 = record.unit || record.단위사업명 || "";
      let 팀명 = record.team || record.팀명 || "";
      if ((!기능 || !단위사업명 || !팀명) && 세부사업명) {
        const map = await getStructureBySubProgram(세부사업명);
        if (map) {
          기능 = 기능 || map.function;
          단위사업명 = 단위사업명 || map.unit;
          팀명 = 팀명 || map.team;
        }
      }

      // 횟수: 프로그램별+날짜별 1회만 집계(운영일수 기준)
      let sessions = Number(record.횟수) || 1;
      // 건수는 연인원/실인원 산출 불가 실적만 입력
      let cases = (!record.연인원 && !record.실인원) ? (Number(record.건수) || 0) : 0;

      const 고유아이디 = await getUserId(이용자명, 세부사업명);

      await addDoc(collectionRef, {
        날짜: normalizedDate, // ✅ 문자열로 저장
        세부사업명,
        이용자명,
        성별,
        연락처,
        "내용(특이사항)": 내용,
        고유아이디,
        출석여부,
        feeType,
        기능,
        단위사업명,
        팀명,
        sessions,
        cases,
        createdAt: getCurrentKoreanDate() // ✅ 문자열로 저장
      });

      // 실적 자동 생성/업데이트
      if (이용자명 && normalizedDate && 세부사업명) {
        const perfQ = query(
          perfCollectionRef,
          where("날짜", "==", normalizedDate), // ✅ 정규화된 날짜 사용
          where("세부사업명", "==", 세부사업명),
          where("이용자명", "==", 이용자명)
        );
        const perfSnap = await getDocs(perfQ);

        let docData = {
          날짜: normalizedDate, // ✅ 문자열로 저장
          세부사업명,
          이용자명,
          성별,
          연락처,
          "내용(특이사항)": 내용,
          고유아이디,
          출석여부,
          feeType,
          기능,
          단위사업명,
          팀명,
          sessions,
          cases,
          실적유형: "개별", // ✅ 실적유형 명시
          createdAt: getCurrentKoreanDate() // ✅ 문자열로 저장
        };

        if (perfSnap.empty) {
          await addDoc(perfCollectionRef, docData);
        } else {
          const prev = perfSnap.docs[0].data();
          const perfDocRef = doc(db, "PerformanceSummary", perfSnap.docs[0].id);
          await updateDoc(perfDocRef, {
            ...docData,
            sessions: (Number(prev.sessions) || 1) + sessions,
            cases: (Number(prev.cases) || 0) + cases
          });
        }
      }

      results.push({ success: true, record });
    } catch (err) {
      results.push({ success: false, record, error: err.message });
    }
  }

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

// 실적 전체 조회 (개별실적만 조회하도록 수정)
export async function fetchPerformances(filters = {}) {
  let q = collection(db, "PerformanceSummary");
  const conditions = [];

  // ✅ 개별 실적만 조회 (대량실적 제외)
  conditions.push(where("실적유형", "!=", "대량"));

  if (filters.function) conditions.push(where("기능", "==", filters.function));
  if (filters.unit) conditions.push(where("단위사업명", "==", filters.unit));
  if (filters.팀명) conditions.push(where("팀명", "==", filters.팀명));
  if (filters.세부사업명) conditions.push(where("세부사업명", "==", filters.세부사업명));
  if (filters.날짜) conditions.push(where("날짜", "==", normalizeDate(filters.날짜))); // ✅ 날짜 정규화

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
    conditions.push(where("실적유형", "!=", "대량"));
  } else if (includeType === "bulk") {
    conditions.push(where("실적유형", "==", "대량"));
  }
  // includeType === "all"이면 필터 없음

  if (filters.function) conditions.push(where("기능", "==", filters.function));
  if (filters.unit) conditions.push(where("단위사업명", "==", filters.unit));
  if (filters.팀명) conditions.push(where("팀명", "==", filters.팀명));
  if (filters.세부사업명) conditions.push(where("세부사업명", "==", filters.세부사업명));
  if (filters.날짜) conditions.push(where("날짜", "==", normalizeDate(filters.날짜))); // ✅ 날짜 정규화

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
    const normalizedDate = normalizeDate(data.날짜); // ✅ 날짜 정규화

    const q = query(
      collectionRef,
      where("날짜", "==", normalizedDate), // ✅ 정규화된 날짜 사용
      where("세부사업명", "==", data.세부사업명),
      where("이용자명", "==", data.이용자명)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      throw new Error("이미 등록된 실적입니다.");
    }
  }

  let docData = { ...data };
  docData.날짜 = normalizeDate(docData.날짜); // ✅ 날짜 정규화

  docData.고유아이디 = await getUserId(docData.이용자명, docData.세부사업명);

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
    }
  }

  docData.출석여부 = isPresent(data.출석여부);
  docData.실적유형 = "개별"; // ✅ 실적유형 명시
  docData.createdAt = getCurrentKoreanDate(); // ✅ 문자열로 저장

  const docRef = await addDoc(collectionRef, docData);
  return { id: docRef.id, ...docData };
}

// 실적 수정 (+ 출석 데이터 동기화) - 완전히 개선된 버전
export async function updatePerformance(id, data) {
  const docRef = doc(db, "PerformanceSummary", id);

  // ✅ undefined 값 완전 제거 및 데이터 정제
  const cleanData = {};

  // 각 필드를 안전하게 처리
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && key !== 'id') {
      cleanData[key] = value;
    }
  });

  // ✅ 날짜 정규화
  if (cleanData.날짜) {
    cleanData.날짜 = normalizeDate(cleanData.날짜);
  }

  // 필수 필드 자동 처리
  if (cleanData.이용자명 && cleanData.세부사업명) {
    cleanData.고유아이디 = await getUserId(cleanData.이용자명, cleanData.세부사업명);

    // 유료/무료 자동 연동
    if (!cleanData.feeType) {
      const members = await getSubProgramMembers({ 세부사업명: cleanData.세부사업명 });
      const member = members.find(m => m.이용자명 === cleanData.이용자명);
      if (member) cleanData.feeType = member.유료무료 || "";
    }
  }

  if (cleanData.출석여부 !== undefined) {
    cleanData.출석여부 = isPresent(cleanData.출석여부);
  }

  console.log("✅ API에서 정제된 데이터:", cleanData);
  await updateDoc(docRef, cleanData);

  // 출석 데이터 동기화
  if (cleanData.이용자명 && cleanData.날짜 && cleanData.세부사업명) {
    const attendCol = collection(db, "AttendanceRecords");
    const q = query(
      attendCol,
      where("날짜", "==", cleanData.날짜), // ✅ 정규화된 날짜 사용
      where("세부사업명", "==", cleanData.세부사업명),
      where("이용자명", "==", cleanData.이용자명)
    );
    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
      const syncData = { ...cleanData };
      delete syncData.id; // id 필드 제거
      await updateDoc(doc(db, "AttendanceRecords", docSnap.id), syncData);
    }
  }

  return { id, ...cleanData };
}

// 실적 삭제 (+ 출석 데이터 동기화)
export async function deletePerformance(id) {
  const perfDocRef = doc(db, "PerformanceSummary", id);
  const perfSnap = await getDocs(query(collection(db, "PerformanceSummary"), where("__name__", "==", id)));

  let perfData = null;
  if (!perfSnap.empty) {
    perfData = perfSnap.docs[0].data();
  }

  await deleteDoc(perfDocRef);

  if (perfData && perfData.이용자명 && perfData.날짜 && perfData.세부사업명) {
    const attendCol = collection(db, "AttendanceRecords");
    const q = query(
      attendCol,
      where("날짜", "==", perfData.날짜),
      where("세부사업명", "==", perfData.세부사업명),
      where("이용자명", "==", perfData.이용자명)
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
  const results = [];
  const collectionRef = collection(db, "PerformanceSummary");

  for (const row of rows) {
    let { 기능, 단위사업명, 세부사업명, 이용자명, 날짜 } = row;
    날짜 = normalizeDate(날짜); // ✅ 날짜 정규화
    let 팀명 = row.팀명;

    if ((!기능 || !단위사업명 || !팀명) && 세부사업명) {
      try {
        const mapped = await getStructureBySubProgram(세부사업명);
        if (mapped) {
          기능 = 기능 || mapped.function;
          단위사업명 = 단위사업명 || mapped.unit;
          팀명 = 팀명 || mapped.team;
        } else {
          results.push({ success: false, row, error: "자동 매핑 실패: 세부사업명에 대한 정보 없음" });
          continue;
        }
      } catch (err) {
        results.push({ success: false, row, error: "자동 매핑 오류: " + err.message });
        continue;
      }
    }

    if (!기능 || !단위사업명 || !세부사업명 || !이용자명 || !날짜 || !팀명) {
      results.push({ success: false, row, error: "필수 필드 누락" });
      continue;
    }

    const q = query(
      collectionRef,
      where("날짜", "==", 날짜), // ✅ 정규화된 날짜 사용
      where("세부사업명", "==", 세부사업명),
      where("이용자명", "==", 이용자명)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      results.push({ success: false, row, error: "중복 데이터 존재" });
      continue;
    }

    try {
      const 고유아이디 = await getUserId(이용자명, 세부사업명);
      let feeType = row.feeType || row.유료무료 || "";

      if (!feeType && 세부사업명 && 이용자명) {
        const members = await getSubProgramMembers({ 세부사업명 });
        const member = members.find(m => m.이용자명 === 이용자명);
        if (member) feeType = member.유료무료 || "";
      }

      // 횟수: 프로그램별+날짜별 1회만 집계
      let sessions = Number(row.횟수) || 1;

      const docData = {
        function: 기능,
        unit: 단위사업명,
        team: 팀명,
        세부사업명,
        이용자명,
        고유아이디,
        성별: row.성별 || "",
        result: row.출석여부 || "",
        "내용(특이사항)": row["내용(특이사항)"] || "",
        날짜, // ✅ 정규화된 날짜
        등록인원: Number(row.등록인원) || 0,
        실인원: Number(row.실인원) || 0,
        연인원: Number(row.연인원) || 0,
        건수: Number(row.건수) || 0,
        cases: Number(row.건수) || 0,
        sessions,
        출석여부: isPresent(row.출석여부),
        feeType,
        비고: row.비고 || "",
        실적유형: "개별", // ✅ 실적유형 명시
        createdAt: getCurrentKoreanDate() // ✅ 문자열로 저장
      };

      await addDoc(collectionRef, docData);
      results.push({ success: true, row });
    } catch (err) {
      results.push({ success: false, row, error: err.message });
    }
  }

  return results;
}

// 실적 대량 업로드 (집계용: 세부사업명만 필수, 등록인원/실인원/연인원/건수/비고/기능/팀명/단위사업명)
// 실적 대량 업로드 (집계용: 세부사업명만 필수, 등록인원/실인원/연인원/건수/비고/기능/팀명/단위사업명)
export async function uploadBulkPerformanceSummary(rows) {
  const collectionRef = collection(db, "PerformanceSummary");
  const results = [];

  for (const row of rows) {
    const 날짜 = normalizeDate(row.날짜 || getCurrentKoreanDate()); // 날짜가 없으면 오늘 날짜
    const 세부사업명 = (row.세부사업명 || "").trim();

    // 필수 필드 검증
    if (!세부사업명) {
      results.push({ success: false, row, error: "세부사업명은 필수입니다." });
      continue;
    }

    // 자동 매핑: 세부사업명만 있을 때 기능/팀명/단위사업명 자동 매핑
    let 단위사업명 = (row.단위사업명 || "").trim();
    let 기능 = (row.기능 || "").trim();
    let 팀명 = (row.팀명 || "").trim();

    if ((!기능 || !단위사업명 || !팀명) && 세부사업명) {
      try {
        const mapped = await getStructureBySubProgram(세부사업명);
        if (mapped) {
          기능 = 기능 || mapped.function;
          단위사업명 = 단위사업명 || mapped.unit;
          팀명 = 팀명 || mapped.team;
        }
      } catch (error) {
        console.warn("자동 매핑 실패:", error);
      }
    }

    const 등록인원 = Number(row.등록인원) || 0;
    const 실인원 = Number(row.실인원) || 0;
    const 연인원 = Number(row.연인원) || 0;
    const 건수 = Number(row.건수) || 0;
    const 비고 = (row.비고 || "").trim();

    // 🔥 핵심: 모든 주요 필드 완전 일치 체크
    try {
      // Firestore 복합 쿼리 제한으로 인해 기본 필터링 후 클라이언트에서 완전 체크
      const q = query(
        collectionRef,
        where("날짜", "==", 날짜),
        where("세부사업명", "==", 세부사업명),
        where("실적유형", "==", "대량")
      );

      const snapshot = await getDocs(q);
      
      // 클라이언트에서 모든 필드 완전 일치 체크
      const duplicateDoc = snapshot.docs.find(doc => {
        const data = doc.data();
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
        results.push({ 
          success: false, 
          row, 
          error: "완전 중복 데이터 존재 (모든 필드 동일)" 
        });
        continue;
      }

      // 신규 등록
      const docData = {
        날짜,
        세부사업명,
        단위사업명,
        기능,
        팀명,
        등록인원,
        실인원,
        연인원,
        건수,
        비고,
        createdAt: getCurrentKoreanDate(),
        실적유형: "대량"
      };

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
  return await saveAttendanceRecords(rows);
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
