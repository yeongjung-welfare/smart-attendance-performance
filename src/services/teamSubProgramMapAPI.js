import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * 세부사업명으로 구조 자동 매핑 (기존 로직 완전 유지)
 */
export async function getStructureBySubProgram(subProgramName) {
  if (!subProgramName || typeof subProgramName !== "string") return null;

  try {
    const q = query(
      collection(db, "TeamSubProgramMap"),
      where("세부사업명", "==", subProgramName)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const data = snapshot.docs[0].data();
    return {
      team: data["팀명"] || "",
      function: data["기능"] || "",
      unit: data["단위사업명"] || ""
    };
  } catch (err) {
    console.error("🔥 getStructureBySubProgram 오류:", err);
    return null;
  }
}

/**
 * 구조 정보 등록/업데이트 (필드 매핑 문제 완전 해결)
 */
export async function addTeamSubProgramMap(data, overwrite = false) {
  console.log("✅ addTeamSubProgramMap 호출 데이터:", data);

  // ✅ 모든 가능한 필드명 매핑 처리
  const subProgramName = data.subProgramName || data["세부사업명"] || data.세부사업명;
  const teamName = data.teamName || data["팀명"] || data.팀명;
  const functionType = data.functionType || data["기능"] || data.기능;
  const mainProgramName = data.mainProgramName || data["단위사업명"] || data.단위사업명;

  console.log("✅ 매핑된 필드값들:", {
    subProgramName,
    teamName,
    functionType,
    mainProgramName
  });

  // ✅ 강화된 유효성 검사
  if (!subProgramName || !teamName || !functionType || !mainProgramName) {
    const missingFields = [];
    if (!subProgramName) missingFields.push("세부사업명");
    if (!teamName) missingFields.push("팀명");
    if (!functionType) missingFields.push("기능");
    if (!mainProgramName) missingFields.push("단위사업명");
    
    console.error("❌ 필수 필드 누락:", missingFields);
    throw new Error(`다음 필드가 누락되었습니다: ${missingFields.join(", ")}`);
  }

  // ✅ 공백 문자열 체크 강화
  const trimmedSubProgram = String(subProgramName).trim();
  const trimmedTeam = String(teamName).trim();
  const trimmedFunction = String(functionType).trim();
  const trimmedMainProgram = String(mainProgramName).trim();

  if (!trimmedSubProgram || !trimmedTeam || !trimmedFunction || !trimmedMainProgram) {
    console.error("❌ 공백 필드 감지");
    throw new Error("공백만으로는 입력할 수 없습니다. 유효한 값을 입력해주세요.");
  }

  const trimmedData = {
    세부사업명: trimmedSubProgram,
    팀명: trimmedTeam,
    기능: trimmedFunction,
    단위사업명: trimmedMainProgram
  };

  console.log("✅ 최종 저장 데이터:", trimmedData);

  // ✅ 기존 중복 체크 로직 완전 유지
  const q = query(
    collection(db, "TeamSubProgramMap"),
    where("세부사업명", "==", trimmedData.세부사업명),
    where("팀명", "==", trimmedData.팀명),
    where("기능", "==", trimmedData.기능),
    where("단위사업명", "==", trimmedData.단위사업명)
  );

  try {
    const snapshot = await getDocs(q);

    if (!snapshot.empty && !overwrite) {
      console.warn("⚠️ 중복 데이터 감지:", trimmedData);
      throw new Error("동일한 조합의 데이터가 이미 존재합니다.");
    } else if (!snapshot.empty && overwrite) {
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, { 
        ...trimmedData, 
        updatedAt: new Date().toISOString() 
      });
      console.log("✅ 데이터 업데이트 성공, 문서 ID:", docRef.id);
      return docRef.id;
    } else {
      const docRef = await addDoc(collection(db, "TeamSubProgramMap"), {
        ...trimmedData,
        createdAt: new Date().toISOString()
      });
      console.log("✅ 데이터 추가 성공, 문서 ID:", docRef.id);
      return docRef.id;
    }
  } catch (err) {
    console.error("🔥 데이터 처리 실패:", err);
    throw new Error(`데이터 처리 실패: ${err.message}`);
  }
}

/**
 * 나머지 함수들 기존 로직 완전 유지
 */
export async function deleteTeamSubProgramMap(docId) {
  if (!docId || typeof docId !== "string") {
    throw new Error("유효한 문서 ID가 필요합니다.");
  }

  try {
    await deleteDoc(doc(db, "TeamSubProgramMap", docId));
    console.log("✅ 삭제 완료:", docId);
  } catch (error) {
    console.error("❌ 삭제 실패:", error);
    throw error;
  }
}

export async function getMySubPrograms(email) {
  if (!email) throw new Error("이메일이 필요합니다.");
  
  const q = query(
    collection(db, "TeacherSubProgramMap"),
    where("이메일", "==", email)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data().세부사업명);
}

export async function getAllTeamSubProgramMaps() {
  try {
    const snapshot = await getDocs(collection(db, "TeamSubProgramMap"));
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      functionType: doc.data().기능,
      teamName: doc.data().팀명,
      mainProgramName: doc.data().단위사업명,
      subProgramName: doc.data().세부사업명,
    }));
    console.log("getAllTeamSubProgramMaps 반환:", data);
    return data;
  } catch (err) {
    console.error("🔥 getAllTeamSubProgramMaps 오류:", err);
    return [];
  }
}