import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

/**
 * Firebase 인증된 사용자 정보 + Firestore 유저 문서 가져오기
 */
export default function useUserInfo() {
  const [userInfo, setUserInfo] = useState(null); // { role, subPrograms, name, ... }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserInfo(null);
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "Users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUserInfo(snap.data());
        } else {
          setUserInfo(null);
        }
      } catch (error) {
        console.error("사용자 정보 로딩 실패:", error);
        setUserInfo(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { userInfo, loading };
}