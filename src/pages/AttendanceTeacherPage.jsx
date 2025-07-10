// pages/AttendanceTeacherPage.jsx
import React, { useEffect, useState } from "react";
import { Typography, Paper } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import TeacherAttendanceForm from "../components/TeacherAttendanceForm";
import { getMySubPrograms } from "../services/teamSubProgramMapAPI";

function AttendanceTeacherPage() {
  const { currentUser } = useAuth();
  const [mySubPrograms, setMySubPrograms] = useState([]);

  useEffect(() => {
    if (currentUser?.uid) {
      getMySubPrograms(currentUser.uid).then(setMySubPrograms);
    }
  }, [currentUser]);

  return (
    <Paper className="p-4 max-w-screen-lg mx-auto mt-4">
      <Typography variant="h5" gutterBottom>
        출석 등록/관리 (강사 전용)
      </Typography>
      {mySubPrograms.length === 0 ? (
        <Typography color="text.secondary">담당 세부사업이 없습니다.</Typography>
      ) : (
        <TeacherAttendanceForm subPrograms={mySubPrograms} />
      )}
    </Paper>
  );
}

export default AttendanceTeacherPage;