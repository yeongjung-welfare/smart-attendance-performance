// ✅ src/hooks/useUserRole.js
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

/**
 * 🔐 로그인한 사용자의 Firestore role 정보를 가져오는 hook
 * @returns {{ role: string|null, loading: boolean }}
 */
export function useUserRole() {
  const [role, setRole] = useState(null); // admin, teacher, staff 등
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "Users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          setRole(userData.role || null);
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error("유저 role 가져오기 실패:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { role, loading };
}