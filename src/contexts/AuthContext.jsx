import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";


export const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userSubPrograms, setUserSubPrograms] = useState([]);


  // ✅ 강사 세부사업 정보 로드 함수
  const loadTeacherSubPrograms = async (userEmail, userRole) => {
    if (userRole !== "teacher" || !userEmail) return [];
    
    try {
      const teacherMapQuery = query(
        collection(db, "TeacherSubProgramMap"),
        where("이메일", "==", userEmail)
      );
      const teacherMapSnapshot = await getDocs(teacherMapQuery);
      const subPrograms = [];
      
      teacherMapSnapshot.forEach((doc) => {
        const data = doc.data();
        subPrograms.push({
          id: doc.id,
          subProgramName: data.세부사업명,
          teacherName: data.강사명
        });
      });
      
      console.log("✅ 강사 세부사업 정보 로드:", subPrograms);
      return subPrograms;
    } catch (error) {
      console.error("강사 세부사업 정보 로드 오류:", error);
      return [];
    }
  };


  // ✅ 기존 로그아웃 함수 완전 유지
  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserSubPrograms([]);
      setError(null);
    } catch (err) {
      console.error("로그아웃 오류:", err);
      setError("로그아웃 중 문제가 발생했습니다.");
      throw err;
    }
  };


  // ✅ 기존 사용자 정보 새로고침 함수 완전 유지 + 세부사업 정보 추가
  const refreshUserInfo = async () => {
    if (currentUser?.uid) {
      try {
        const userDoc = await getDoc(doc(db, "Users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser(prev => ({ ...prev, ...userData }));
          
          // ✅ 강사인 경우 세부사업 정보 새로고침
          if (userData.role === "teacher" && currentUser.email) {
            const subPrograms = await loadTeacherSubPrograms(currentUser.email, userData.role);
            setUserSubPrograms(subPrograms);
          } else {
            setUserSubPrograms([]);
          }
        }
      } catch (err) {
        console.error("사용자 정보 새로고침 오류:", err);
      }
    }
  };


  useEffect(() => {
    let unsubscribe;
    let retryTimeout;


    const initAuth = async () => {
      try {
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          // 재시도 타임아웃 클리어
          if (retryTimeout) {
            clearTimeout(retryTimeout);
            retryTimeout = null;
          }


          setError(null);
          if (user) {
            try {
              // ✅ 기존 사용자 데이터 로드 로직 완전 유지 + 타임아웃 추가
              const userDocPromise = getDoc(doc(db, "Users", user.uid));
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Network timeout')), 8000)
              );


              const userDoc = await Promise.race([userDocPromise, timeoutPromise]);
              
              if (userDoc.exists()) {
                const userData = { uid: user.uid, email: user.email, ...userDoc.data() };
                setCurrentUser(userData);
                
                // ✅ 강사인 경우 세부사업 정보 로드
                if (userData.role === "teacher" && user.email) {
                  const subPrograms = await loadTeacherSubPrograms(user.email, userData.role);
                  setUserSubPrograms(subPrograms);
                } else {
                  setUserSubPrograms([]);
                }
              } else {
                console.warn("사용자 문서를 찾을 수 없습니다:", user.uid);
                setCurrentUser({ uid: user.uid, email: user.email, role: null });
                setUserSubPrograms([]);
              }
            } catch (err) {
              console.error("사용자 정보 로드 오류:", err);
              
              // ✅ 네트워크 오류 시 기본 사용자 정보 설정 (기능 중단 방지)
              if (err.code === 'unavailable' || 
                  err.message === 'Network timeout' ||
                  err.code === 'deadline-exceeded') {
                console.warn("네트워크 연결 불안정, 기본 정보로 진행합니다.");
                setCurrentUser({ uid: user.uid, email: user.email, role: 'admin' }); // 임시 권한으로 기능 유지
                setError("네트워크 연결이 불안정합니다. 일부 기능이 제한될 수 있습니다.");
                
                // ✅ 5초 후 재시도
                retryTimeout = setTimeout(async () => {
                  try {
                    await refreshUserInfo();
                    setError(null);
                  } catch (retryErr) {
                    console.warn("재시도 실패:", retryErr);
                  }
                }, 5000);
              } else {
                setError("사용자 정보를 불러오는데 실패했습니다.");
                setCurrentUser(null);
                setUserSubPrograms([]);
              }
            }
          } else {
            setCurrentUser(null);
            setUserSubPrograms([]);
          }
          setLoading(false);
        }, (authError) => {
          // ✅ 인증 오류 처리 (기존 기능 유지)
          console.error("인증 상태 변경 오류:", authError);
          if (authError.code !== 'unavailable') {
            setError("인증 처리 중 오류가 발생했습니다.");
          }
          setLoading(false);
        });
      } catch (err) {
        console.error("인증 초기화 오류:", err);
        setError("인증 시스템 초기화에 실패했습니다.");
        setLoading(false);
      }
    };


    initAuth();


    // ✅ cleanup 함수 (기존 로직 유지)
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (err) {
          console.error("인증 리스너 정리 오류:", err);
        }
      }
    };
  }, []);


  // ✅ 기존 value 객체 완전 유지 + 세부사업 정보 추가
  const value = {
    currentUser,
    user: currentUser,
    userRole: currentUser?.role || null,
    userSubPrograms, // ✅ 추가
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


// ✅ 기존 훅들 완전 유지
export const useUser = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useUser must be used within an AuthProvider");
  }
  return context;
};


export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};


export const useAuth = useUser;
