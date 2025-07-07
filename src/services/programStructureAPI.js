import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

// 🔁 Firestore의 'ProgramStructure' 컬렉션에서
//     세부사업명(subProgram)을 기준으로
//     단위사업명(unit), 기능(function)을 가져오는 함수

export async function getStructureBySubProgram(subProgramName) {
  if (!subProgramName) return null;

  try {
    const q = query(
      collection(db, "ProgramStructure"),
      where("subProgram", "==", subProgramName)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const docData = snapshot.docs[0].data();
    return {
      unit: docData.unit || "",
      function: docData.function || ""
    };
  } catch (error) {
    console.error("🔥 getStructureBySubProgram 오류:", error);
    return null;
  }
}