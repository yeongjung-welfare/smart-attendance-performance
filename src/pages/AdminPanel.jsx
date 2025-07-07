// src/pages/AdminPanel.jsx

import React, { useState, useEffect } from "react";
import PendingUserTable from "../components/PendingUserTable";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Tabs, Tab, Typography
} from "@mui/material";
import { collection, getDocs, getDoc, doc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";

// 🔖 탭별 라벨 정의
const roleLabels = {
  pending: "대기중",
  staff: "직원 승인",
  teacher: "강사 승인",
  admin: "관리자",
  rejected: "거절"
};

function AdminPanel() {
  // 전체 사용자 목록 상태
  const [users, setUsers] = useState([]);

  // 승인/거절/취소 요청 시 확인창 상태
  const [confirm, setConfirm] = useState({ open: false, userId: null, action: null, role: null });

  // 현재 선택된 탭 상태 ('pending', 'staff', 'teacher', 'admin', 'rejected')
  const [tab, setTab] = useState("pending");

  // 🔥 관리자 로그인 확인 및 전체 사용자 목록 불러오기
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.warn("로그인이 필요합니다.");
        return;
      }

      try {
        // 현재 로그인 사용자의 역할 확인
        const userRef = doc(db, "Users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          console.warn("사용자 정보가 존재하지 않습니다.");
          return;
        }

        const currentUser = userSnap.data();

        if (currentUser.role !== "admin") {
          console.warn("접근 권한이 없습니다. 관리자만 접근 가능합니다.");
          return;
        }

        // ✅ 관리자일 경우 전체 사용자 목록 조회
        const snapshot = await getDocs(collection(db, "Users"));
        const userList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setUsers(userList);
      } catch (error) {
        console.error("사용자 목록 조회 오류:", error);
      }
    });

    return () => unsubscribe(); // 컴포넌트 언마운트 시 구독 해제
  }, []);

  // 🔍 현재 탭에 해당하는 사용자만 필터링
  const filteredUsers = users.filter(u => u.role === tab);

  // 👉 승인, 거절, 취소 시 다이얼로그 열기
  const handleAction = (userId, action, role = null) => {
    setConfirm({ open: true, userId, action, role });
  };

  // ✅ '예' 클릭 시 사용자 역할 변경 및 Firestore 업데이트
  const handleConfirm = async () => {
    const { userId, action, role } = confirm;

    try {
      // Firestore 업데이트
      const userRef = doc(db, "Users", userId);

      let newRole = "pending";
      if (action === "approve") newRole = role;
      else if (action === "reject") newRole = "rejected";
      else if (action === "cancel") newRole = "pending";

      await updateDoc(userRef, { role: newRole });

      // 프론트 상태 동기화
      setUsers(prev =>
        prev.map(u =>
          u.id === userId
            ? { ...u, role: newRole }
            : u
        )
      );
    } catch (err) {
      console.error("역할 변경 실패:", err);
    }

    setConfirm({ open: false, userId: null, action: null, role: null });
  };

  // ❌ '아니오' 클릭 시 다이얼로그 닫기
  const handleCancel = () => {
    setConfirm({ open: false, userId: null, action: null, role: null });
  };

  return (
    <div className="p-8">
      <Typography variant="h4" gutterBottom>승인 대기자 관리</Typography>

      {/* 🔘 역할별 탭 */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3 }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="대기중" value="pending" />
        <Tab label="직원 승인" value="staff" />
        <Tab label="강사 승인" value="teacher" />
        <Tab label="관리자" value="admin" />
        <Tab label="거절" value="rejected" />
      </Tabs>

      {/* 📋 사용자 목록 테이블 */}
      <div className="bg-white rounded shadow p-4">
        <PendingUserTable
          users={filteredUsers}
          status={tab}
          onApprove={(userId, role) => handleAction(userId, "approve", role)}
          onReject={userId => handleAction(userId, "reject")}
          onCancel={userId => handleAction(userId, "cancel")}
        />
      </div>

      {/* ✅ 승인/거절/취소 다이얼로그 */}
      <Dialog open={confirm.open} onClose={handleCancel}>
        <DialogTitle>확인</DialogTitle>
        <DialogContent>
          {confirm.action === "approve" && (
            <Typography>
              이 사용자를 <b>{roleLabels[confirm.role]}</b>(으)로 승인하시겠습니까?
            </Typography>
          )}
          {confirm.action === "reject" && (
            <Typography>이 사용자를 <b>거절</b>하시겠습니까?</Typography>
          )}
          {confirm.action === "cancel" && (
            <Typography>이 사용자의 상태를 <b>대기중</b>으로 되돌리시겠습니까?</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>아니오</Button>
          <Button onClick={handleConfirm} color="primary" variant="contained">예</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default AdminPanel;