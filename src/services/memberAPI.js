// 🔧 src/services/memberAPI.js
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  query,
  where
} from "firebase/firestore";
import { db } from "../firebase";
import generateUniqueId from "../utils/generateUniqueId"; // 🔧 UUID 생성기

const memberCollection = collection(db, "Members");

export async function getAllMembers() {
  try {
    const snapshot = await getDocs(memberCollection);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handlePermissionError(error, "회원정보에 접근 권한이 없습니다.");
    throw error;
  }
}

export async function getMembersBySubProgram(subProgramName) {
  try {
    const q = query(memberCollection, where("subProgram", "==", subProgramName));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handlePermissionError(error, "세부사업별 회원 조회 오류");
    throw error;
  }
}

export async function checkDuplicateMember({ name, birthdate, phone }) {
  try {
    const q = query(
      memberCollection,
      where("name", "==", name),
      where("birthdate", "==", birthdate),
      where("phone", "==", phone)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error("중복 체크 오류:", error);
    return false;
  }
}

export async function registerMember(member) {
  try {
    const isDuplicate = await checkDuplicateMember(member);
    if (isDuplicate) {
      console.warn("중복 회원:", member.name, member.birthdate, member.phone);
      return { success: false, reason: "duplicate" };
    }

    const fullMember = {
      team: member.team || "",
      unitProgram: member.unitProgram || "",
      subProgram: member.subProgram || "",
      name: member.name || "",
      gender: member.gender || "",
      phone: member.phone || "",
      birthdate: member.birthdate || "",
      ageGroup: member.ageGroup || "",
      address: member.address || "",
      district: member.district || "",
      incomeType: member.incomeType || "",
      disability: member.disability || "",
      paidType: member.paidType || "",
      status: member.status || "이용",
      userId: generateUniqueId(),
      note: member.note || "",
      registrationDate:
        member.registrationDate || new Date().toISOString().split("T")[0]
    };

    await addDoc(memberCollection, fullMember);
    return { success: true };
  } catch (error) {
    console.error("회원 등록 오류:", error);
    throw error;
  }
}

export async function updateMember(id, updatedData) {
  try {
    const docRef = doc(db, "Members", id);
    await updateDoc(docRef, updatedData);
  } catch (error) {
    console.error("회원 수정 오류:", error);
    throw error;
  }
}

export async function deleteMember(id) {
  try {
    const docRef = doc(db, "Members", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("회원 삭제 오류:", error);
    throw error;
  }
}

function handlePermissionError(error, customMsg) {
  if (error.code === "permission-denied") {
    alert(customMsg + "\n접근 권한이 없습니다.");
  } else {
    alert(customMsg + "\n" + error.message);
  }
  console.error(customMsg, error);
}