// src/services/subProgramMemberAPI.js

import {
  collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, and
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

// ✅ 완전 수정된 등록 함수 - 문자열로 저장하도록 변경
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
    const normalizedPhone = normalizePhone(member.연락처);
    const normalizedBirthdate = normalizeDate(member.생년월일);
    
    const existingMember = allMembers.find(
      m => m.name === member.이용자명.trim() &&
        normalizeDate(m.birthdate) === normalizedBirthdate &&
        normalizePhone(m.phone) === normalizedPhone
    );

    if (existingMember) {
      member.고유아이디 = existingMember.userId || existingMember.고유아이디 || generateUniqueId();
    } else {
      member.고유아이디 = generateUniqueId();
    }

    // ✅ 핵심 수정: 문자열로 저장하여 시간대 문제 완전 해결
    const 생년월일Str = normalizeDate(member.생년월일);
    let ageGroup = "";
    if (생년월일Str && 생년월일Str.length >= 4) {
      ageGroup = getAgeGroup(생년월일Str.substring(0, 4));
    } else {
      ageGroup = "미상";
    }
    
    const fullMember = {
      ...member,
      팀명,
      단위사업명,
      생년월일: 생년월일Str, // ✅ 문자열로 저장 (Date 객체 제거)
      연락처: normalizedPhone, // ✅ 전화번호 정규화
      연령대: member.연령대 || ageGroup, // 기존 연령대 우선, 없으면 계산값
      유료무료: member.유료무료 || "무료",
      이용상태: member.이용상태 || "이용",
      createdAt: getCurrentKoreanDate() // ✅ 문자열로 저장
    };

    console.log("📝 세부사업 회원 등록 데이터:", {
      이용자명: fullMember.이용자명,
      원본생년월일: member.생년월일,
      정규화생년월일: 생년월일Str,
      연령대: fullMember.연령대,
      원본연락처: member.연락처,
      정규화연락처: normalizedPhone
    });

    const docRef = await addDoc(subProgramMemberCollection, fullMember);
    return docRef.id;
  } catch (err) {
    console.error("회원 등록 오류:", err);
    throw err;
  }
}

// ✅ 수정된 업데이트 함수
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

    const processedData = { ...updatedData, 팀명, 단위사업명 };
    
    // ✅ 날짜 필드 문자열로 처리
    if (processedData.생년월일) {
      processedData.생년월일 = normalizeDate(processedData.생년월일);
    }

    if (processedData.createdAt) {
      processedData.createdAt = normalizeDate(processedData.createdAt);
    }

    // ✅ 전화번호 정규화
    if (processedData.연락처) {
      processedData.연락처 = normalizePhone(processedData.연락처);
    }

    const docRef = doc(db, "SubProgramUsers", id);
    await updateDoc(docRef, processedData);
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
    
    const normalizedPhone = normalizePhone(phone);
    const q = query(
      subProgramMemberCollection,
      where("이용자명", "==", name),
      where("연락처", "==", normalizedPhone)
    );

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
