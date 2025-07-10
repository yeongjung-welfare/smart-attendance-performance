import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore"; // ← 여기 주의

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyBrR4exnXL0wAhudh0NoeiIgwA8H-7sWcc",
  authDomain: "smart-attendance-performance.firebaseapp.com",
  projectId: "smart-attendance-performance",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteAllFromCollection(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName));
  let deletedCount = 0;

  for (const document of snapshot.docs) {
    await deleteDoc(doc(db, collectionName, document.id));
    console.log(`❌ Deleted from ${collectionName}: ${document.id}`);
    deletedCount++;
  }

  console.log(`✅ ${collectionName}: 총 ${deletedCount}개 문서 삭제 완료`);
}

async function main() {
  try {
    await deleteAllFromCollection("members");
    await deleteAllFromCollection("Members");
  } catch (err) {
    console.error("🔥 삭제 중 오류:", err);
  }
}

main();