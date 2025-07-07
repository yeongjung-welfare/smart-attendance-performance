import React from "react";
import AttendanceForm from "../components/AttendanceForm";

function AttendanceCheck() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">출석 등록</h2>
      <AttendanceForm />
    </div>
  );
}

export default AttendanceCheck;