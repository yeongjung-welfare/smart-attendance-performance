// src/services/userAPI.js
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * 🔹 세부사업명 기준 사용자 목록 가져오기
 * - 관리자: 전체 회원 조회
 * - 강사: 담당 세부사업명에 해당하는 회원만 조회
 */
export async function getUsersBySubProgram(subProgram, role) {
  if (role === "admin") {
    // 전체 사용자 가져오기
    const q = query(collection(db, "members"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      userId: doc.id,
    }));
  } else if (role === "teacher" && subProgram) {
    // 담당 세부사업 사용자만 가져오기
    const q = query(
      collection(db, "members"),
      where("subProgram", "==", subProgram)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      userId: doc.id,
    }));
  } else {
    return []; // role이 없거나 조건에 맞지 않으면 빈 배열 반환
  }
}

/**
 * 🔹 개별 사용자 정보 가져오기
 */
export async function getUserByUid(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}