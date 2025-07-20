import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore/lite";

// Firebase 설정
const firebaseConfig = {
  apiKey: "🔥",
  authDomain: "🔥",
  projectId: "🔥",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔥 불완전한 members 문서 삭제
async function deleteIncompleteMembers() {
  const membersRef = collection(db, "members");
  const snapshot = await getDocs(membersRef);

  let deletedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const isIncomplete =
      !data.team?.trim() || !data.unitProgram?.trim() || !data.subProgram?.trim();

    if (isIncomplete) {
      await deleteDoc(doc(db, "members", docSnap.id));
      console.log(`❌ 삭제: ${docSnap.id}`);
      deletedCount++;
    }
  }

  console.log(`✅ 총 ${deletedCount}개 문서 삭제 완료`);
}

// 실행
deleteIncompleteMembers().catch((err) => {
  console.error("🔥 삭제 중 오류:", err);
});