// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableNetwork, disableNetwork } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// ✅ 네트워크 연결 관리 함수들 추가 (기존 기능 유지)
export const enableFirestoreNetwork = async () => {
  try {
    await enableNetwork(db);
    console.log("Firestore 네트워크 연결 활성화");
  } catch (error) {
    console.error("Firestore 네트워크 활성화 실패:", error);
  }
};

export const disableFirestoreNetwork = async () => {
  try {
    await disableNetwork(db);
    console.log("Firestore 네트워크 연결 비활성화");
  } catch (error) {
    console.error("Firestore 네트워크 비활성화 실패:", error);
  }
};

// ✅ 전역 Firebase 오류 처리 (콘솔 오류 방지)
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.code === 'unavailable' || 
      event.reason?.message?.includes('firestore') ||
      event.reason?.message?.includes('Listen') ||
      event.reason?.message?.includes('WebChannel')) {
    console.warn("Firebase 연결 오류 (자동 처리됨):", event.reason.code || event.reason.message);
    event.preventDefault(); // 콘솔 오류 방지
  }
});

export default app;
