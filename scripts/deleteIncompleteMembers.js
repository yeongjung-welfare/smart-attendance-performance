import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore/lite";

// 🔐 Firebase 프로젝트 설정값 (Firebase 콘솔에서 복사)
const firebaseConfig = {
  apiKey: "AIzaSyBrR4exnXL0wAhudh0NoeiIgwA8H-7sWcc",
  authDomain: "smart-attendance-performance.firebaseapp.com",
  projectId: "smart-attendance-performance",
  storageBucket: "smart-attendance-performance.firebasestorage.app",
  messagingSenderId: "749694599146",
  appId: "1:749694599146:web:881507430160dca47e3c93"
};

// 🔧 Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🧹 members 컬렉션 중 team/unitProgram/subProgram 비어있는 문서 삭제
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

  console.log(`\\n✅ 총 \${deletedCount}개 문서 삭제 완료`);
}

// 🔃 실행
deleteIncompleteMembers().catch((err) => {
  console.error("🔥 삭제 중 오류:", err);
});
