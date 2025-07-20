// src/services/subProgramMemberAPI.js
import {
  collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, and
} from "firebase/firestore";
import { db } from "../firebase";
import generateUniqueId from "../utils/generateUniqueId";
import { getStructureBySubProgram } from "./teamSubProgramMapAPI";
import { getAllMembers } from "./memberAPI";
import { getAgeGroup } from "../utils/ageGroup";

const subProgramMemberCollection = collection(db, "SubProgramUsers");

export async function getSubProgramMembers({ 팀명, 단위사업명, 세부사업명 }) {
  try {
    let q = subProgramMemberCollection;

    // 필터가 없을 때는 전체 조회
    if (!팀명 && !단위사업명 && !세부사업명) {
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          기능: data["기능"] || "",
          단위사업명: data["단위사업명"] || ""
        };
      });
    }

    // ✅ AND 조건으로 정확한 필터링 구현
    const conditions = [];
    if (팀명) conditions.push(where("팀명", "==", 팀명));
    if (단위사업명) conditions.push(where("단위사업명", "==", 단위사업명));
    if (세부사업명) conditions.push(where("세부사업명", "==", 세부사업명));

    // 조건이 있을 때만 쿼리 적용
    if (conditions.length === 1) {
      q = query(q, conditions[0]);
    } else if (conditions.length > 1) {
      // ✅ AND 조건 적용 (기존의 OR에서 변경)
      q = query(q, and(...conditions));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("이용자 조회 오류:", err);
    throw err;
  }
}

export async function registerSubProgramMember(member) {
  try {
    if (!member.이용자명 || !member.이용자명.trim()) {
      throw new Error("이용자명은 필수 입력입니다.");
    }

    let 팀명 = member.팀명;
    let 단위사업명 = member.단위사업명;

    if ((!팀명 || !단위사업명) && member.세부사업명) {
      const map = await getStructureBySubProgram(member.세부사업명);
      if (map) {
        팀명 = map.team;
        단위사업명 = map.unit;
      }
    }

    const allMembers = await getAllMembers();
    const existingMember = allMembers.find(
      m => m.이용자명 === member.이용자명.trim() && m.생년월일 === member.생년월일 && m.연락처 === member.연락처
    );

    if (existingMember) {
      member.고유아이디 = existingMember.고유아이디;
    } else {
      member.고유아이디 = generateUniqueId();
    }

    const fullMember = {
      ...member,
      팀명,
      단위사업명,
      연령대: getAgeGroup(member.생년월일.substring(0, 4)),
      유료무료: member.유료무료 || "무료",
      이용상태: member.이용상태 || "이용",
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(subProgramMemberCollection, fullMember);
    return docRef.id;
  } catch (err) {
    console.error("회원 등록 오류:", err);
    throw err;
  }
}

export async function updateSubProgramMember(id, updatedData) {
  try {
    let 팀명 = updatedData.팀명;
    let 단위사업명 = updatedData.단위사업명;

    if ((!팀명 || !단위사업명) && updatedData.세부사업명) {
      const map = await getStructureBySubProgram(updatedData.세부사업명);
      if (map) {
        팀명 = map.team;
        단위사업명 = map.unit;
      }
    }

    const docRef = doc(db, "SubProgramUsers", id);
    await updateDoc(docRef, { ...updatedData, 팀명, 단위사업명 });
  } catch (err) {
    console.error("회원 수정 오류:", err);
    throw err;
  }
}

export async function deleteSubProgramMember(id) {
  try {
    const docRef = doc(db, "SubProgramUsers", id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error("회원 삭제 오류:", err);
    throw err;
  }
}

export async function deleteMultipleSubProgramMembers(ids) {
  try {
    const deletions = ids.map((id) => deleteDoc(doc(db, "SubProgramUsers", id)));
    await Promise.all(deletions);
  } catch (err) {
    console.error("일괄 삭제 오류:", err);
    throw err;
  }
}

export async function findMemberByNameAndPhone(name, phone) {
  try {
    if (!name || !phone) return null;

    const q = query(
      subProgramMemberCollection,
      where("이용자명", "==", name),
      where("연락처", "==", phone)
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

// 스마트 매칭 (2단계)
export async function matchMember(name, birth, phone) {
  const q = query(
    subProgramMemberCollection,
    where("이용자명", "==", name),
    where("생년월일", "==", birth),
    where("연락처", "==", phone)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.length > 0 ? { 고유아이디: snapshot.docs[0].data().고유아이디 } : null;
}