import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from "firebase/firestore";
import { db } from "../firebase";
import generateUniqueId from "../utils/generateUniqueId";

// 🔗 Firestore 컬렉션
const subProgramMemberCollection = collection(db, "members"); // 소문자 'members'

/**
 * ✅ 세부사업별 이용자 전체 조회
 */
export async function getSubProgramMembers(subProgram) {
  try {
    const q = query(subProgramMemberCollection, where("subProgram", "==", subProgram));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("세부사업별 회원 조회 오류:", err);
    throw err;
  }
}

/**
 * ✅ 단일 회원 등록
 */
export async function registerSubProgramMember(member) {
  try {
    const fullMember = {
      ...member,
      userId: generateUniqueId(),
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(subProgramMemberCollection, fullMember);
    return docRef.id;
  } catch (err) {
    console.error("회원 등록 오류:", err);
    throw err;
  }
}

/**
 * ✅ 회원 정보 수정
 */
export async function updateSubProgramMember(id, updatedData) {
  try {
    const docRef = doc(db, "members", id);
    await updateDoc(docRef, updatedData);
  } catch (err) {
    console.error("회원 수정 오류:", err);
    throw err;
  }
}

/**
 * ✅ 회원 삭제
 */
export async function deleteSubProgramMember(id) {
  try {
    const docRef = doc(db, "members", id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error("회원 삭제 오류:", err);
    throw err;
  }
}

/**
 * ✅ 일괄 삭제
 */
export async function deleteMultipleSubProgramMembers(ids) {
  try {
    const deletions = ids.map((id) => deleteDoc(doc(db, "members", id)));
    await Promise.all(deletions);
  } catch (err) {
    console.error("일괄 삭제 오류:", err);
    throw err;
  }
}