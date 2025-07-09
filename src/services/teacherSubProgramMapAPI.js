import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * 강사-세부사업 매핑 전체 조회
 */
export async function getAllTeacherSubProgramMaps() {
  const snapshot = await getDocs(collection(db, "TeacherSubProgramMap"));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    teacherName: doc.data().강사명,
    email: doc.data().이메일,
    subProgramName: doc.data().세부사업명,
  }));
}

/**
 * 강사-세부사업 매핑 등록
 */
export async function addTeacherSubProgramMap(data) {
  if (!data["강사명"] || !data["이메일"] || !data["세부사업명"]) {
    throw new Error("모든 필드를 입력해주세요.");
  }
  await addDoc(collection(db, "TeacherSubProgramMap"), {
    강사명: data["강사명"].trim(),
    이메일: data["이메일"].trim(),
    세부사업명: data["세부사업명"].trim(),
    createdAt: new Date().toISOString()
  });
}

/**
 * 강사-세부사업 매핑 삭제
 */
export async function deleteTeacherSubProgramMap(docId) {
  if (!docId || typeof docId !== "string") {
    throw new Error("유효한 문서 ID가 필요합니다.");
  }
  await deleteDoc(doc(db, "TeacherSubProgramMap", docId));
}