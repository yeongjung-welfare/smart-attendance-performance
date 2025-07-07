// ✅ services/authAPI.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "firebase/firestore";
import { auth, db } from "../firebase";

/**
 * ✨ 회원가입: Firebase 인증 + Firestore에 사용자 정보 저장
 * @param {string} email
 * @param {string} password
 * @param {string} name
 * @returns {Promise<User>} Firebase User 객체
 */
export async function signupWithFirebase(email, password, name) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await setDoc(doc(db, "Users", user.uid), {
    email: user.email,
    name,
    role: "pending", // ✅ 가입 직후에는 'pending'
    createdAt: serverTimestamp()
  });

  return user;
}

/**
 * 👉 로그인: 인증 후 Firestore에서 사용자 정보 조회
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: User, userData: Object|null }>}
 */
export async function loginWithFirebase(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const docRef = doc(db, "Users", user.uid);
  const docSnap = await getDoc(docRef);
  const userData = docSnap.exists() ? docSnap.data() : null;

  return { user, userData };
}