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

const memberCollection = collection(db, "Members");

// 전체 회원 조회 (재시도 로직 추가)
export async function getAllMembers(retries = 3) {
  try {
    const snapshot = await getDocs(memberCollection);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    if (retries > 0 && error.code === "unavailable") {
      console.warn("네트워크 문제 발생, 재시도 중...", retries);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
      return getAllMembers(retries - 1);
    }
    handlePermissionError(error, "회원정보에 접근 권한이 없습니다.");
    throw error;
  }
}

// ✅ 새로운 고급 검색 함수
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

    // 성별 필터
    if (gender) {
      conditions.push(where("gender", "==", gender));
    }

    // 소득구분 필터
    if (incomeType) {
      conditions.push(where("incomeType", "==", incomeType));
    }

    // 장애유무 필터
    if (disability) {
      conditions.push(where("disability", "==", disability));
    }

    // 행정동 필터 (부분 일치는 클라이언트에서 처리)
    if (district) {
      conditions.push(where("district", "==", district));
    }

    // 조건들을 AND로 결합
    if (conditions.length > 0) {
      q = query(q, and(...conditions));
    }

    // 정렬 및 페이지네이션
    q = query(q, orderBy("registrationDate", "desc"));
    
    if (searchLimit) {
      q = query(q, limit(searchLimit));
    }

    const snapshot = await getDocs(q);
    let results = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // 클라이언트 측 텍스트 검색 (이름, 연락처, 주소 등)
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

    // 연령대 필터 (클라이언트 측 처리)
    if (ageGroup) {
      results = results.filter(member => {
        const birth = member.birthdate;
        if (!birth) return false;
        
        try {
          const birthDate = new Date(birth);
          if (isNaN(birthDate)) return false;
          
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }

          const memberAgeGroup = getAgeGroupFromAge(age);
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

// ✅ 연령대 계산 헬퍼 함수
function getAgeGroupFromAge(age) {
  if (age < 10) return "0~9세";
  if (age < 20) return "10대";
  if (age < 30) return "20대";
  if (age < 40) return "30대";
  if (age < 50) return "40대";
  if (age < 60) return "50대";
  if (age < 70) return "60대";
  return "70세 이상";
}

// ✅ 검색 통계 함수
export async function getMemberStats() {
  try {
    const snapshot = await getDocs(memberCollection);
    const members = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    
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

    // 소득구분별 통계
    ["일반", "기초수급", "차상위", "국가유공자"].forEach(type => {
      stats.byIncomeType[type] = members.filter(m => m.incomeType === type).length;
    });

    // 연령대별 통계
    members.forEach(member => {
      if (member.birthdate) {
        try {
          const birthDate = new Date(member.birthdate);
          if (!isNaN(birthDate)) {
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
            const ageGroup = getAgeGroupFromAge(age);
            stats.byAgeGroup[ageGroup] = (stats.byAgeGroup[ageGroup] || 0) + 1;
          }
        } catch (e) {
          // 날짜 파싱 오류 무시
        }
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
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handlePermissionError(error, "세부사업별 회원 조회 오류");
    throw error;
  }
}

// 중복 회원 체크
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

// 빈값이 아닌 필드만 기존 데이터에 덮어씌우는 업데이트 함수
export async function updateMemberWithNonEmptyFields(member) {
  try {
    const q = query(
      memberCollection,
      where("name", "==", member.name),
      where("birthdate", "==", member.birthdate),
      where("phone", "==", member.phone)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return false;

    const docSnap = snapshot.docs[0];
    const existing = docSnap.data();
    const updatedData = { ...existing };

    Object.keys(member).forEach((key) => {
      if (member[key] !== "" && member[key] !== undefined) {
        updatedData[key] = member[key];
      }
    });

    await updateDoc(doc(db, "Members", docSnap.id), updatedData);
    return true;
  } catch (error) {
    console.error("빈값 제외 업데이트 오류:", error);
    return false;
  }
}

// 회원 등록
export async function registerMember(member) {
  try {
    const isDuplicate = await checkDuplicateMember(member);
    if (isDuplicate) {
      return { success: false, reason: "duplicate" };
    }

    const ageGroup = member.birthdate ? getAgeGroup(member.birthdate.substring(0, 4)) : "";
    const fullMember = {
      userId: generateUniqueId(),
      name: member.name || "",
      gender: member.gender || "",
      birthdate: member.birthdate || "",
      ageGroup: ageGroup,
      phone: member.phone || "",
      address: member.address || "",
      district: member.district || "",
      incomeType: member.incomeType || "",
      disability: member.disability || "",
      note: member.note || "",
      registrationDate: member.registrationDate || new Date().toISOString().split("T")[0]
    };

    await addDoc(memberCollection, fullMember);
    return { success: true };
  } catch (error) {
    console.error("회원 등록 오류:", error);
    throw error;
  }
}

// 회원 정보 수정
export async function updateMember(id, updatedData) {
  try {
    const docRef = doc(db, "Members", id);
    await updateDoc(docRef, updatedData);
  } catch (error) {
    console.error("회원 수정 오류:", error);
    throw error;
  }
}

// 회원 삭제 (단일/다중 모두 지원, id만 추출)
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