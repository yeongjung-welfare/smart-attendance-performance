import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
  doc
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * 세부사업명으로 구조 자동 매핑
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
 * 구조 정보 등록 (중복 체크, 필수값 체크)
 */
export async function addTeamSubProgramMap(data) {
  if (
    !data["팀명"] || !data["기능"] || !data["단위사업명"] || !data["세부사업명"] ||
    !data["팀명"].trim() || !data["기능"].trim() ||
    !data["단위사업명"].trim() || !data["세부사업명"].trim()
  ) {
    throw new Error("모든 필드를 입력해주세요.");
  }
  // 중복 체크(세부사업명+팀명+기능+단위사업명)
  const q = query(
    collection(db, "TeamSubProgramMap"),
    where("세부사업명", "==", data["세부사업명"].trim()),
    where("팀명", "==", data["팀명"].trim()),
    where("기능", "==", data["기능"].trim()),
    where("단위사업명", "==", data["단위사업명"].trim())
  );
  const snapshot = await getDocs(q);
  if (!snapshot.empty) throw new Error("동일한 조합의 데이터가 이미 존재합니다.");
  await addDoc(collection(db, "TeamSubProgramMap"), {
    팀명: data["팀명"].trim(),
    기능: data["기능"].trim(),
    단위사업명: data["단위사업명"].trim(),
    세부사업명: data["세부사업명"].trim(),
    createdAt: new Date().toISOString()
  });
}

/**
 * 문서 ID로 매핑 삭제
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

/**
 * 전체 구조 매핑 목록 조회
 */
export async function getAllTeamSubProgramMaps() {
  try {
    const snapshot = await getDocs(collection(db, "TeamSubProgramMap"));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      functionType: doc.data().기능,
      teamName: doc.data().팀명,
      mainProgramName: doc.data().단위사업명,
      subProgramName: doc.data().세부사업명,
    }));
  } catch (err) {
    console.error("🔥 getAllTeamSubProgramMaps 오류:", err);
    return [];
  }
}