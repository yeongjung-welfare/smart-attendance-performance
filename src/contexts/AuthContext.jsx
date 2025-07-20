// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ 로그아웃 함수 추가
  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setError(null);
    } catch (err) {
      console.error("로그아웃 오류:", err);
      setError("로그아웃 중 문제가 발생했습니다.");
      throw err;
    }
  };

  // ✅ 사용자 정보 새로고침 함수 추가
  const refreshUserInfo = async () => {
    if (currentUser?.uid) {
      try {
        const userDoc = await getDoc(doc(db, "Users", currentUser.uid));
        if (userDoc.exists()) {
          setCurrentUser(prev => ({ ...prev, ...userDoc.data() }));
        }
      } catch (err) {
        console.error("사용자 정보 새로고침 오류:", err);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setError(null);
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "Users", user.uid));
          if (userDoc.exists()) {
            const userData = { uid: user.uid, ...userDoc.data() };
            setCurrentUser(userData);
          } else {
            console.warn("사용자 문서를 찾을 수 없습니다:", user.uid);
            setCurrentUser({ uid: user.uid, role: null });
          }
        } catch (err) {
          console.error("사용자 정보 로드 오류:", err);
          setError("사용자 정보를 불러오는데 실패했습니다.");
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    loading,
    error,
    logout,
    refreshUserInfo
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useUser must be used within an AuthProvider");
  }
  return context;
};

export const useAuth = useUser; // 별칭처럼 처리
