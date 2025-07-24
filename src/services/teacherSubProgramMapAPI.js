import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where
} from "firebase/firestore";
import { db } from "../firebase";
import { getCurrentKoreanDate } from "../utils/dateUtils"; // ✅ 추가


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
    createdAt: getCurrentKoreanDate() // ✅ UTC 시간 문제 해결
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


/**
 * ✅ 강사 이메일로 담당 세부사업 조회
 */
export async function getMySubPrograms(teacherEmail) {
  if (!teacherEmail) return [];
  
  try {
    const q = query(
      collection(db, "TeacherSubProgramMap"),
      where("이메일", "==", teacherEmail)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      subProgramName: doc.data().세부사업명,
      teacherName: doc.data().강사명
    }));
  } catch (error) {
    console.error("강사 세부사업 조회 오류:", error);
    return [];
  }
}

/**
 * ✅ getTeacherSubPrograms 별칭 함수
 */
export async function getTeacherSubPrograms(teacherEmail) {
  return await getMySubPrograms(teacherEmail);
}
