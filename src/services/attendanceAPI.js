import {
  doc,
  setDoc,
  getDocs,
  query,
  collection,
  where
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION_NAME = "AttendanceRecords";

/**
 * ✅ 출석 기록 저장 함수
 * - record.id는 고유 ID (예: "홍길동_2025-07-06_줌바")
 * - setDoc을 사용하여 중복 없이 덮어쓰기
 */
export async function saveAttendanceRecords(records) {
  const promises = records.map(async (record) => {
    const docRef = doc(db, COLLECTION_NAME, record.id);
    await setDoc(docRef, record); // 중복 ID면 덮어쓰기
  });
  await Promise.all(promises);
}

/**
 * ✅ 특정 날짜 + 세부사업 기준 출석 조회 함수
 * - 출석 기록 통계 계산 또는 UI 표시용
 * - 날짜와 세부사업명으로 필터링
 */
export async function getAttendanceRecordsByDateAndProgram(date, subProgram) {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("date", "==", date),
    where("subProgram", "==", subProgram)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
}

/**
 * ⛔️ (선택) 향후 확장을 위한 기타 함수 예시
 * export async function deleteAttendanceRecord(id) { ... }
 */