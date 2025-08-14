// src/services/subProgramMemberAPI.js

import {
  collection, addDoc, getDoc, getDocs, updateDoc, deleteDoc, doc, query, where, and
} from "firebase/firestore";
import { db } from "../firebase";
import generateUniqueId from "../utils/generateUniqueId";
import { getStructureBySubProgram } from "./teamSubProgramMapAPI";
import { getAllMembers } from "./memberAPI";
import { getAgeGroup } from "../utils/ageGroup";
import { normalizeDate, getCurrentKoreanDate } from "../utils/dateUtils";

const subProgramMemberCollection = collection(db, "SubProgramUsers");

// ✅ 전화번호 정규화 함수 추가
function normalizePhone(phone) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

// ✅ 안전한 날짜 처리 함수 (시간대 문제 완전 해결)
function safeBirthdateExtract(birthdate) {
  if (!birthdate) return "";
  
  try {
    // Firebase Timestamp 객체 처리
    if (birthdate && typeof birthdate.toDate === 'function') {
      const jsDate = birthdate.toDate();
      // 로컬 시간으로 변환하여 날짜 추출
      const year = jsDate.getFullYear();
      const month = String(jsDate.getMonth() + 1).padStart(2, '0');
      const day = String(jsDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Date 객체 처리
    if (birthdate instanceof Date) {
      const year = birthdate.getFullYear();
      const month = String(birthdate.getMonth() + 1).padStart(2, '0');
      const day = String(birthdate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // 문자열 처리
    if (typeof birthdate === 'string') {
      return normalizeDate(birthdate);
    }

    return "";
  } catch (error) {
    console.warn("생년월일 추출 오류:", error, birthdate);
    return "";
  }
}

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
          단위사업명: data["단위사업명"] || "",
          // ✅ 안전한 날짜 변환
          생년월일: safeBirthdateExtract(data.생년월일),
          연락처: normalizePhone(data.연락처), // ✅ 전화번호 정규화 추가
          createdAt: safeBirthdateExtract(data.createdAt)
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
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // ✅ 안전한 날짜 변환
        생년월일: safeBirthdateExtract(data.생년월일),
        연락처: normalizePhone(data.연락처), // ✅ 전화번호 정규화 추가
        createdAt: safeBirthdateExtract(data.createdAt)
      };
    });
  } catch (err) {
    console.error("이용자 조회 오류:", err);
    throw err;
  }
}

// ✅ 세부사업 회원 등록
export async function registerSubProgramMember(member) {
  try {
    if (!member.이용자명 || !member.이용자명.trim()) {
      throw new Error("⚠️ 이용자명은 필수 입력입니다.");
    }

    // 🔹 기능/단위 매핑
    let 팀명 = member.팀명;
    let 단위사업명 = member.단위사업명;
    if ((!팀명 || !단위사업명) && member.세부사업명) {
      const map = await getStructureBySubProgram(member.세부사업명);
      if (map) {
        팀명 = map.team;
        단위사업명 = map.unit;
      }
    }

    // 🔹 전체회원관리 확인
    const allMembers = await getAllMembers();
    const normalizedPhone = normalizePhone(member.연락처);
    const normalizedBirthdate = normalizeDate(member.생년월일);

    const baseMember = allMembers.find(
      m =>
        m.name === member.이용자명.trim() &&
        normalizeDate(m.birthdate) === normalizedBirthdate &&
        normalizePhone(m.phone) === normalizedPhone
    );

    if (!baseMember) {
      throw new Error("⚠️ 전체회원관리에 등록되지 않은 회원은 세부사업 등록이 불가합니다.");
    }

    const 고유아이디 = baseMember.userId || baseMember.고유아이디;

    // 🔹 동일 세부사업 중복 검사
    const q = query(
      subProgramMemberCollection,
      where("고유아이디", "==", 고유아이디),
      where("세부사업명", "==", member.세부사업명)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      throw new Error("⚠️ 이미 해당 세부사업에 등록된 회원입니다.");
    }

    // 🔹 연령대 계산
    const 생년월일Str = normalizedBirthdate;
    const ageGroup =
      생년월일Str && 생년월일Str.length >= 4
        ? getAgeGroup(생년월일Str.substring(0, 4))
        : "미상";

    // 🔹 최종 등록 데이터
    const fullMember = {
      ...member,
      팀명,
      단위사업명,
      생년월일: 생년월일Str,
      연락처: normalizedPhone,
      연령대: member.연령대 || ageGroup,
      유료무료: member.유료무료 || "무료",
      이용상태: member.이용상태 || "이용",
      고유아이디,
      createdAt: getCurrentKoreanDate()
    };

    const docRef = await addDoc(subProgramMemberCollection, fullMember);
    console.log("✅ 세부사업 회원 등록 완료:", docRef.id);
    return docRef.id;
  } catch (err) {
    console.error("회원 등록 오류:", err);
    throw err;
  }
}

// ✅ 세부사업 회원 수정 (createdAt 보존 + updatedAt 기록 + 연령대 재계산)
export async function updateSubProgramMember(id, updatedData) {
  try {
    const allMembers = await getAllMembers();
    const normalizedPhone = normalizePhone(updatedData.연락처);
    const normalizedBirthdate = normalizeDate(updatedData.생년월일);

    const baseMember = allMembers.find(
      m =>
        m.name === updatedData.이용자명.trim() &&
        normalizeDate(m.birthdate) === normalizedBirthdate &&
        normalizePhone(m.phone) === normalizedPhone
    );

    if (!baseMember) {
      return { success: false, message: "⚠️ 전체회원관리에 없는 회원은 수정할 수 없습니다." };
    }

    const 고유아이디 = baseMember.userId || baseMember.고유아이디;

    const q = query(
      subProgramMemberCollection,
      where("고유아이디", "==", 고유아이디),
      where("세부사업명", "==", updatedData.세부사업명)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty && snapshot.docs[0].id !== id) {
      return { success: false, message: "⚠️ 동일 세부사업에 이미 등록된 다른 회원이 존재합니다." };
    }

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
    const oldDocSnap = await getDoc(docRef);
    let oldCreatedAt = getCurrentKoreanDate();
    if (oldDocSnap.exists()) {
      const oldData = oldDocSnap.data();
      oldCreatedAt = oldData.createdAt || getCurrentKoreanDate();
    }

    const ageGroup =
      normalizedBirthdate && normalizedBirthdate.length >= 4
        ? getAgeGroup(normalizedBirthdate.substring(0, 4))
        : "미상";

    const processedData = {
      ...updatedData,
      팀명,
      단위사업명,
      생년월일: normalizedBirthdate,
      연락처: normalizedPhone,
      연령대: ageGroup,
      고유아이디,
      createdAt: oldCreatedAt,
      updatedAt: getCurrentKoreanDate()
    };

    await updateDoc(docRef, processedData);

    console.log("✅ 세부사업 회원 수정 완료:", { id, ...processedData });
    return { success: true, id, ...processedData };
  } catch (err) {
    console.error("회원 수정 오류:", err);
    return { success: false, message: `회원 수정 중 오류 발생: ${err.message}` };
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

export async function findMemberByNameAndPhone(name, phone, subProgramName) {
  try {
    if (!name || !phone) return null;
    
    const normalizedPhone = normalizePhone(phone);
    const conds = [
     where("이용자명", "==", name),
     where("연락처", "==", normalizedPhone)
   ];
   if (subProgramName) conds.push(where("세부사업명", "==", subProgramName));
   const q = query(subProgramMemberCollection, ...conds);

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    
    return {
      id: docSnap.id,
      ...data,
      // ✅ 안전한 날짜 변환
      생년월일: safeBirthdateExtract(data.생년월일),
      연락처: normalizePhone(data.연락처)
    };
  } catch (err) {
    console.error("중복 멤버 조회 오류:", err);
    return null;
  }
}

// 스마트 매칭 (2단계) - 안전한 날짜 비교
export async function matchMember(name, birth, phone) {
  try {
    const normalizedBirth = normalizeDate(birth);
    const normalizedPhone = normalizePhone(phone);
    
    const q = query(
      subProgramMemberCollection,
      where("이용자명", "==", name),
      where("연락처", "==", normalizedPhone)
    );

    const snapshot = await getDocs(q);
    
    // 클라이언트에서 생년월일 비교 (Firebase Timestamp 고려)
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const existingBirth = safeBirthdateExtract(data.생년월일);
      
      if (existingBirth === normalizedBirth) {
        return { 고유아이디: data.고유아이디 };
      }
    }

    return null;
  } catch (err) {
    console.error("매칭 오류:", err);
    return null;
  }
}
