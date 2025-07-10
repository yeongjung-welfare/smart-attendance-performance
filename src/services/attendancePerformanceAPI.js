import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  setDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { getStructureBySubProgram } from "./teamSubProgramMapAPI";

// 출석 전체 조회 (필터 적용)
export async function fetchAttendances(filters = {}) {
  let q = collection(db, "AttendanceRecords");
  // 필터 예시
  // if (filters.date) q = query(q, where("date", "==", filters.date));
  // ...필요시 추가
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 실적 전체 조회 (필터 적용)
export async function fetchPerformances(filters = {}) {
  let q = collection(db, "PerformanceSummary");
  // 필터 예시
  // if (filters.date) q = query(q, where("date", "==", filters.date));
  // ...필요시 추가
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 출석 단건/일괄 등록
export async function saveAttendanceRecords(records) {
  const promises = records.map(async (record) => {
    const docRef = doc(
      db,
      "AttendanceRecords",
      record.id || `${record.name}_${record.date}_${record.subProgram}`
    );
    await setDoc(docRef, record); // 중복 ID면 덮어쓰기
  });
  await Promise.all(promises);
}

// 실적 단건 등록 (이용자별 실적 또는 집계용 실적 모두 지원)
export async function savePerformance(data) {
  const collectionRef = collection(db, "PerformanceSummary");
  // 집계용(세부사업명만 필수, 등록인원/실인원/연인원/건수/비고 등) 또는
  // 이용자별 실적(이름 등) 모두 지원
  // 집계성 데이터는 중복체크를 완화, 필요시 강화 가능
  let isUserPerformance = !!data.name;
  if (isUserPerformance) {
    // 이용자별 실적 중복 체크
    const q = query(
      collectionRef,
      where("date", "==", data.date),
      where("subProgram", "==", data.subProgram),
      where("name", "==", data.name)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      throw new Error("이미 등록된 실적입니다.");
    }
  }
  const docData = {
    ...data,
    attended: data.attended ?? (data.result?.trim() === "출석" || data.result?.trim() === "참여"),
    feeType: data.feeType ?? "",
    createdAt: new Date().toISOString()
  };
  const docRef = await addDoc(collectionRef, docData);
  return { id: docRef.id, ...docData };
}

// 실적 수정
export async function updatePerformance(id, data) {
  const docRef = doc(db, "PerformanceSummary", id);
  await updateDoc(docRef, data);
  return { id, ...data };
}

// 실적 삭제
export async function deletePerformance(id) {
  const docRef = doc(db, "PerformanceSummary", id);
  await deleteDoc(docRef);
}

// 실적 일괄 삭제
export async function deleteMultiplePerformances(ids) {
  const deleted = [];
  const failed = [];
  for (const id of ids) {
    try {
      await deleteDoc(doc(db, "PerformanceSummary", id));
      deleted.push(id);
    } catch (err) {
      failed.push({ id, error: err.message });
    }
  }
  return { deleted, failed };
}

// 실적 대량 업로드 (이용자별 실적 업로드)
export async function uploadPerformanceData(rows) {
  const results = [];
  const collectionRef = collection(db, "PerformanceSummary");
  for (const row of rows) {
    let { 기능, 단위사업명, 세부사업명, 이름, 날짜 } = row;
    // 자동 매핑(세부사업명 기준)
    if ((!기능 || !단위사업명) && 세부사업명) {
      try {
        const mapped = await getStructureBySubProgram(세부사업명);
        if (mapped) {
          기능 = 기능 || mapped.function;
          단위사업명 = 단위사업명 || mapped.unit;
        } else {
          results.push({ success: false, row, error: "자동 매핑 실패: 세부사업명에 대한 정보 없음" });
          continue;
        }
      } catch (err) {
        results.push({ success: false, row, error: "자동 매핑 오류: " + err.message });
        continue;
      }
    }
    if (!기능 || !단위사업명 || !세부사업명 || !이름 || !날짜) {
      results.push({ success: false, row, error: "필수 필드 누락" });
      continue;
    }
    const q = query(
      collectionRef,
      where("date", "==", 날짜),
      where("subProgram", "==", 세부사업명),
      where("name", "==", 이름)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      results.push({ success: false, row, error: "중복 데이터 존재" });
      continue;
    }
    try {
      const docData = {
        function: 기능,
        unit: 단위사업명,
        subProgram: 세부사업명,
        name: 이름,
        gender: row.성별 || "",
        result: row.출석여부 || "",
        note: row["내용(특이사항)"] || "",
        date: 날짜,
        cases: Number(row.건수) || 0,
        sessions: Number(row.횟수) || 0,
        attended: true,
        feeType: row.유형 || "",
        createdAt: new Date().toISOString()
      };
      await addDoc(collectionRef, docData);
      results.push({ success: true, row });
    } catch (err) {
      results.push({ success: false, row, error: err.message });
    }
  }
  return results;
}

// 실적 대량 업로드 (집계용: 세부사업명만 필수, 등록인원/실인원/연인원/건수/비고 등)
export async function uploadBulkPerformanceSummary(rows) {
  const collectionRef = collection(db, "PerformanceSummary");

  for (const row of rows) {
    const date = (row.date || "").trim();
    const subProgram = (row.subProgram || "").trim();
    const note = (row.note || "").trim(); // 비고 필드를 구분값으로 활용

    // 필수값 누락 시 무시
    if (!date || !subProgram) {
      console.warn("❌ 필수값 누락: 날짜 또는 세부사업명 없음", row);
      continue;
    }

    // ✅ 중복 체크: 같은 날짜 + 같은 세부사업명 + 같은 비고
    const q = query(
      collectionRef,
      where("date", "==", date),
      where("subProgram", "==", subProgram),
      where("note", "==", note)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      console.log(`⛔ 중복 데이터로 업로드 생략됨: ${date}, ${subProgram}, ${note}`);
      continue;
    }

    const docData = {
      subProgram,
      date,
      registered: Number(row.registered) || 0,
      actual: Number(row.actual) || 0,
      total: Number(row.total) || 0,
      cases: Number(row.cases) || 0,
      note,
      createdAt: new Date().toISOString()
    };

    await addDoc(collectionRef, docData);
    console.log(`✅ 등록 완료: ${date}, ${subProgram}, ${note}`);
  }
}

// 출석 대량 업로드 (예시, 실적과 유사하게 구현)
export async function uploadAttendanceData(rows) {
  await saveAttendanceRecords(rows);
}

// 세부사업명 기준 실적 조회
export async function fetchPerformanceBySubProgram(subProgramName) {
  const collectionRef = collection(db, "PerformanceSummary");
  const q = query(collectionRef, where("subProgram", "==", subProgramName));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}