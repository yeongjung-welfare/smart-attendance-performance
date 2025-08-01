import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  and,
  or
} from "firebase/firestore";
import { db } from "../firebase";
import generateUniqueId from "../utils/generateUniqueId";
import { getAgeGroup } from "../utils/ageGroup";
import { normalizeDate, toFirebaseDate, getCurrentKoreanDate, extractDateFromFirebase } from "../utils/dateUtils";

const memberCollection = collection(db, "Members");

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
    // Firebase Timestamp 처리
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

// ✅ 전체 회원 조회
export async function getAllMembers(retries = 3) {
  try {
    console.log("🔍 회원 데이터 조회 시작");
    const snapshot = await getDocs(memberCollection);
    const members = snapshot.docs.map((doc) => {
      const data = doc.data();
      let birthdateStr = "";
      
      if (data.birthdate !== null && data.birthdate !== undefined) {
        birthdateStr = safeBirthdateExtract(data.birthdate);
      }

      let calculatedAgeGroup = "";
      if (birthdateStr && birthdateStr.length >= 4) {
        const birthYear = birthdateStr.substring(0, 4);
        calculatedAgeGroup = getAgeGroup(birthYear);
      }

      const processedData = {
        id: doc.id,
        userId: data.userId || "", // ✅ userId 보장
        ...data,
        birthdate: birthdateStr || "",
        registrationDate: safeBirthdateExtract(data.registrationDate) || "",
        ageGroup: (data.ageGroup && data.ageGroup !== "") ? data.ageGroup : calculatedAgeGroup,
        address: data.address || "",
        district: data.district || "",
        disability: data.disability || "",
        note: data.note || "",
        phone: normalizePhone(data.phone) // ✅ 전화번호 정규화 추가
      };
      
      console.log("📅 회원 데이터 처리:", {
        이름: data.name,
        원본생년월일: data.birthdate,
        변환생년월일: birthdateStr,
        기존연령대: data.ageGroup,
        계산연령대: calculatedAgeGroup,
        최종연령대: processedData.ageGroup,
        원본전화번호: data.phone,
        정규화전화번호: processedData.phone,
        주소: processedData.address,
        행정동: processedData.district
      });
      
      return processedData;
    });
    
    console.log(`✅ 총 ${members.length}명 회원 데이터 로드 완료`);
    return members;
  } catch (error) {
    if (retries > 0 && error.code === "unavailable") {
      console.warn("네트워크 문제 발생, 재시도 중...", retries);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getAllMembers(retries - 1);
    }

    console.error("❌ 회원 데이터 조회 실패:", error);
    handlePermissionError(error, "회원정보에 접근 권한이 없습니다.");
    throw error;
  }
}

// ✅ 고급 검색 함수
export async function searchMembers(searchOptions = {}) {
  try {
    const {
      searchTerm,
      gender,
      ageGroup,
      incomeType,
      disability,
      district,
      limit: searchLimit = 1000,
      offset = 0
    } = searchOptions;

    let q = memberCollection;
    const conditions = [];

    if (gender) {
      conditions.push(where("gender", "==", gender));
    }

    if (incomeType) {
      conditions.push(where("incomeType", "==", incomeType));
    }

    if (disability) {
      conditions.push(where("disability", "==", disability));
    }

    if (district) {
      conditions.push(where("district", "==", district));
    }

    if (conditions.length > 0) {
      q = query(q, and(...conditions));
    }

    q = query(q, orderBy("registrationDate", "desc"));
    if (searchLimit) {
      q = query(q, limit(searchLimit));
    }

    const snapshot = await getDocs(q);
    let results = snapshot.docs.map((doc) => {
      const data = doc.data();
      const birthdateStr = safeBirthdateExtract(data.birthdate);
      let calculatedAgeGroup = "";
      
      if (birthdateStr && birthdateStr.length >= 4) {
        calculatedAgeGroup = getAgeGroup(birthdateStr.substring(0, 4));
      }

      return {
        id: doc.id,
        ...data,
        birthdate: birthdateStr || "",
        registrationDate: safeBirthdateExtract(data.registrationDate) || "",
        ageGroup: (data.ageGroup && data.ageGroup !== "") ? data.ageGroup : calculatedAgeGroup,
        address: data.address || "",
        district: data.district || "",
        disability: data.disability || "",
        phone: normalizePhone(data.phone) // ✅ 전화번호 정규화 추가
      };
    });

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      results = results.filter(member =>
        (member.name && member.name.toLowerCase().includes(searchLower)) ||
        (member.phone && member.phone.includes(searchTerm.trim())) ||
        (member.id && member.id.toLowerCase().includes(searchLower)) ||
        (member.userId && member.userId.toLowerCase().includes(searchLower)) ||
        (member.address && member.address.toLowerCase().includes(searchLower))
      );
    }

    if (ageGroup) {
      results = results.filter(member => {
        const birth = member.birthdate;
        if (!birth) return false;
        try {
          const memberAgeGroup = getAgeGroup(birth.substring(0, 4));
          return memberAgeGroup === ageGroup;
        } catch (e) {
          return false;
        }
      });
    }

    return results;
  } catch (error) {
    console.error("검색 오류:", error);
    throw error;
  }
}

// ✅ 검색 통계 함수
export async function getMemberStats() {
  try {
    const snapshot = await getDocs(memberCollection);
    const members = snapshot.docs.map((doc) => {
      const data = doc.data();
      const birthdateStr = safeBirthdateExtract(data.birthdate);
      let calculatedAgeGroup = "";
      
      if (birthdateStr && birthdateStr.length >= 4) {
        calculatedAgeGroup = getAgeGroup(birthdateStr.substring(0, 4));
      }

      return {
        id: doc.id,
        ...data,
        birthdate: birthdateStr || "",
        ageGroup: (data.ageGroup && data.ageGroup !== "") ? data.ageGroup : calculatedAgeGroup
      };
    });

    const stats = {
      total: members.length,
      byGender: {
        남: members.filter(m => m.gender === "남").length,
        여: members.filter(m => m.gender === "여").length
      },
      byIncomeType: {},
      byDisability: {
        유: members.filter(m => m.disability === "유").length,
        무: members.filter(m => m.disability === "무").length
      },
      byAgeGroup: {}
    };

    ["일반", "기초수급", "차상위", "국가유공자"].forEach(type => {
      stats.byIncomeType[type] = members.filter(m => m.incomeType === type).length;
    });

    members.forEach(member => {
      if (member.birthdate) {
        const ageGroup = getAgeGroup(member.birthdate.substring(0, 4));
        stats.byAgeGroup[ageGroup] = (stats.byAgeGroup[ageGroup] || 0) + 1;
      }
    });

    return stats;
  } catch (error) {
    console.error("통계 조회 오류:", error);
    throw error;
  }
}

// 세부사업별 회원 조회
export async function getMembersBySubProgram(subProgramName) {
  try {
    const q = query(memberCollection, where("subProgram", "==", subProgramName));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      const birthdateStr = safeBirthdateExtract(data.birthdate);
      let calculatedAgeGroup = "";
      
      if (birthdateStr && birthdateStr.length >= 4) {
        calculatedAgeGroup = getAgeGroup(birthdateStr.substring(0, 4));
      }

      return {
        id: doc.id,
        ...data,
        birthdate: birthdateStr || "",
        ageGroup: (data.ageGroup && data.ageGroup !== "") ? data.ageGroup : calculatedAgeGroup,
        phone: normalizePhone(data.phone) // ✅ 전화번호 정규화 추가
      };
    });
  } catch (error) {
    handlePermissionError(error, "세부사업별 회원 조회 오류");
    throw error;
  }
}

// ✅ 수정된 중복 회원 체크 함수
export async function checkDuplicateMember({ name, birthdate, phone }) {
  try {
    const normalizedBirthdate = normalizeDate(birthdate);
    const normalizedPhone = normalizePhone(phone);
    
    console.log("🔍 중복 체크:", {
      name,
      originalBirthdate: birthdate,
      normalizedBirthdate,
      originalPhone: phone,
      normalizedPhone
    });

    const q = query(
      memberCollection,
      where("name", "==", name),
      where("phone", "==", normalizedPhone)
    );

    const snapshot = await getDocs(q);
    
    for (const docSnap of snapshot.docs) {
      const existingData = docSnap.data();
      const existingBirthdate = safeBirthdateExtract(existingData.birthdate);
      
      console.log("🔍 기존 데이터 비교:", {
        existingBirthdate,
        normalizedBirthdate,
        match: existingBirthdate === normalizedBirthdate
      });
      
      if (existingBirthdate === normalizedBirthdate) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("중복 체크 오류:", error);
    return false;
  }
}

// ✅ 빈값 제외 업데이트 (생년월일 변경 시 연령대 재계산 포함)
export async function updateMemberWithNonEmptyFields(member) {
  try {
    const normalizedBirthdate = normalizeDate(member.birthdate);
    const normalizedPhone = normalizePhone(member.phone);

    const q = query(
      memberCollection,
      where("name", "==", member.name),
      where("phone", "==", normalizedPhone)
    );

    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
      const existing = docSnap.data();
      const existingBirthdate = safeBirthdateExtract(existing.birthdate);

      if (existingBirthdate === normalizedBirthdate) {
        const updatedData = { ...existing };

        Object.keys(member).forEach((key) => {
          if (member[key] !== "" && member[key] !== undefined) {
            if (key === "birthdate") {
              updatedData.birthdate = normalizeDate(member.birthdate);
              const birthdateStr = updatedData.birthdate;
              updatedData.ageGroup =
                birthdateStr && birthdateStr.length >= 4
                  ? getAgeGroup(birthdateStr.substring(0, 4))
                  : "미상"; // ✅ 연령대 재계산
            } else if (key === "registrationDate") {
              updatedData.registrationDate = normalizeDate(member[key]);
            } else if (key === "phone") {
              updatedData.phone = normalizePhone(member[key]);
            } else {
              updatedData[key] = member[key];
            }
          }
        });

        await updateDoc(doc(db, "Members", docSnap.id), updatedData);
        console.log("✅ 빈값 제외 업데이트 완료:", updatedData);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("빈값 제외 업데이트 오류:", error);
    return false;
  }
}

// ✅ 수정된 회원 등록 함수
export async function registerMember(member) {
  try {
    const duplicateCheck = await checkDuplicateMemberAdvanced(member);

    if (duplicateCheck.isDuplicate) {
      // block → 차단, warn → 관리자 확인 후 진행 가능
      return { 
        success: false, 
        reason: duplicateCheck.action, 
        details: duplicateCheck 
      };
    }

    const birthdateStr = normalizeDate(member.birthdate);
    const normalizedPhone = normalizePhone(member.phone);
    const registrationDate = member.registrationDate || getCurrentKoreanDate();

    let ageGroup = "미상";
    if (birthdateStr && birthdateStr.length >= 4) {
      ageGroup = getAgeGroup(birthdateStr.substring(0, 4));
    }

    const fullMember = {
      userId: generateUniqueId(),
      name: member.name || "",
      gender: member.gender || "",
      birthdate: birthdateStr,
      ageGroup,
      phone: normalizedPhone,
      address: member.address || "",
      district: member.district || "",
      incomeType: member.incomeType || "",
      disability: member.disability || "무",
      note: member.note || "",
      registrationDate
    };

    if (process.env.NODE_ENV === "development") {
      console.log("📝 등록 데이터:", fullMember);
    }

    const docRef = await addDoc(memberCollection, fullMember);
    return { success: true, userId: fullMember.userId, docId: docRef.id };
  } catch (error) {
    console.error("회원 등록 오류:", error);
    throw error;
  }
}

// ✅ 최종 보완된 회원 정보 수정 함수
export async function updateMember(id, updatedData) {
  try {
    const processedData = { ...updatedData };

    // ✅ 생년월일 변경 시 정규화 및 연령대 재계산
    if (processedData.birthdate) {
      processedData.birthdate = normalizeDate(processedData.birthdate);
      const birthdateStr = processedData.birthdate;
      processedData.ageGroup =
        birthdateStr && birthdateStr.length >= 4
          ? getAgeGroup(birthdateStr.substring(0, 4))
          : "미상"; // fallback 처리
    }

    // ✅ 등록일 정규화
    if (processedData.registrationDate) {
      processedData.registrationDate = normalizeDate(processedData.registrationDate);
    }

    // ✅ 전화번호 정규화
    if (processedData.phone) {
      processedData.phone = normalizePhone(processedData.phone);
    }

    const docRef = doc(db, "Members", id);
    await updateDoc(docRef, processedData);

    console.log("✅ 회원 수정 완료:", { id, ...processedData });
    return { success: true, id, ...processedData };
  } catch (error) {
    console.error("회원 수정 오류:", error);
    return { success: false, message: `회원 수정 중 오류 발생: ${error.message}` };
  }
}

// ✅ 최종 보완된 고급 중복 체크 함수
export async function checkDuplicateMemberAdvanced({ name, birthdate, phone }) {
  try {
    const normalizedBirthdate = normalizeDate(birthdate);
    const normalizedPhone = normalizePhone(phone);

    // 1️⃣ 완전 일치 확인
    const exactResult = await checkDuplicateMember({ name, birthdate, phone });
    if (exactResult) {
      return {
        isDuplicate: true,
        confidence: 'high',
        action: 'block',
        message: '동일한 이름, 생년월일, 연락처의 회원이 이미 존재합니다.',
        matches: []
      };
    }

    // 2️⃣ 이름 동일 회원 검색
    const nameQuery = query(memberCollection, where("name", "==", name));
    const snapshot = await getDocs(nameQuery);
    const similarMatches = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const existingBirthdate = safeBirthdateExtract(data.birthdate);
      const existingPhone = normalizePhone(data.phone);

      // 이름+생년월일 동일, 연락처 다름
      if (existingBirthdate === normalizedBirthdate && existingPhone !== normalizedPhone) {
        similarMatches.push({
          type: "birthdateMatch",
          id: docSnap.id,
          name: data.name,
          birthdate: existingBirthdate,
          phone: existingPhone,
          address: data.address || "",
          district: data.district || ""
        });
      }

      // 이름+연락처 동일, 생년월일 다름
      if (existingPhone === normalizedPhone && existingBirthdate !== normalizedBirthdate) {
        similarMatches.push({
          type: "phoneMatch",
          id: docSnap.id,
          name: data.name,
          birthdate: existingBirthdate,
          phone: existingPhone,
          address: data.address || "",
          district: data.district || ""
        });
      }
    }

    if (similarMatches.length > 0) {
      return {
        isDuplicate: true,
        confidence: 'medium',
        action: 'warn',
        message: '유사 회원이 존재합니다. (이름+생년월일 또는 이름+연락처)',
        matches: similarMatches
      };
    }

    return {
      isDuplicate: false,
      confidence: 'low',
      action: 'proceed',
      message: '',
      matches: []
    };
  } catch (error) {
    console.error("고급 중복 체크 오류:", error);
    return {
      isDuplicate: false,
      confidence: 'unknown',
      action: 'proceed',
      message: '',
      matches: []
    };
  }
}

// 회원 삭제
export async function deleteMember(ids) {
  const idList = Array.isArray(ids)
    ? ids
      .filter(Boolean)
      .map(item => (typeof item === "object" && item !== null ? item.id : item))
      .filter(id => typeof id === "string" && id.length > 0)
    : [ids];

  try {
    let deletedCount = 0;
    
    for (const id of idList) {
      if (!id || typeof id !== "string") {
        console.warn(`유효하지 않은 ID 무시: ${id}`);
        continue;
      }

      const docRef = doc(db, "Members", id);
      await deleteDoc(docRef);
      deletedCount++;
    }

    if (deletedCount === 0) {
      throw new Error("삭제할 회원이 없습니다.");
    }

    return { success: true, deletedCount };
  } catch (error) {
    console.error("회원 삭제 오류:", error);
    throw new Error(`삭제 실패: ${error.message}`);
  }
}

// 권한 오류 핸들러
function handlePermissionError(error, customMsg) {
  if (error.code === "permission-denied") {
    alert(customMsg + "\n접근 권한이 없습니다.");
  } else {
    alert(customMsg + "\n" + error.message);
  }
  console.error(customMsg, error);
}
