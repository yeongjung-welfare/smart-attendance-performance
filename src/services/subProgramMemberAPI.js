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

// Firestore 컬렉션 (소문자 members)
const subProgramMemberCollection = collection(db, "members");

/**
 * 세부사업별 이용자 전체 조회
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
 * 이름+연락처로 기존 멤버 조회
 */
export async function findMemberByNameAndPhone(name, phone) {
  try {
    if (!name || !phone) return null;
    const q = query(
      subProgramMemberCollection,
      where("name", "==", name),
      where("phone", "==", phone)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  } catch (err) {
    console.error("중복 멤버 조회 오류:", err);
    return null;
  }
}

/**
 * 단일 회원 등록 (이용자명만 필수)
 */
export async function registerSubProgramMember(member) {
  try {
    if (!member.name || !member.name.trim()) {
      throw new Error("이용자명은 필수 입력입니다.");
    }
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
 * 회원 정보 수정
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
 * 회원 삭제
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
 * 일괄 삭제
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