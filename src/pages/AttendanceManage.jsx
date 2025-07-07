import React, { useState, useEffect } from "react";
import AttendanceTable from "../components/AttendanceTable";
import useSnackbar from "../components/useSnackbar";
import { teamSubProgramMap } from "../data/teamSubProgramMap";
import {
  saveAttendanceRecords,
  getAttendanceRecordsByDateAndProgram
} from "../services/attendanceAPI";
import { getUsersBySubProgram } from "../services/userAPI";
import { getStructureBySubProgram } from "../services/programStructureAPI";
import { useUser } from "../hooks/useUser";

function AttendanceManage() {
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedSubProgram, setSelectedSubProgram] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [SnackbarComp, showSnackbar] = useSnackbar();

  const { user } = useUser();
  const role = user?.role;
  const allowedSubPrograms = user?.subPrograms || [];

  // ✅ 강사인 경우: 첫 진입 시 세부사업 자동 설정
  useEffect(() => {
    if (role === "teacher" && allowedSubPrograms.length > 0) {
      setSelectedSubProgram(allowedSubPrograms[0]);
    }
  }, [role, allowedSubPrograms]);

  // ✅ 세부사업명으로 팀 자동 유추 (출석 저장 시에도 필요)
  useEffect(() => {
    if (selectedSubProgram) {
      const foundTeam = Object.entries(teamSubProgramMap).find(([team, subs]) =>
        subs.includes(selectedSubProgram)
      );
      if (foundTeam) setSelectedTeam(foundTeam[0]);
    }
  }, [selectedSubProgram]);

  // ✅ 세부사업 이용자 불러오기
  useEffect(() => {
    if (!selectedSubProgram) return;
    getUsersBySubProgram(selectedSubProgram)
      .then(setMembers)
      .catch(() => showSnackbar("이용자 목록 로딩 실패", "error"));
  }, [selectedSubProgram]);

  // ✅ 개별 출석 체크
  const handleCheck = (userId, checked) => {
    setAttendance(prev => ({ ...prev, [userId]: checked }));
  };

  // ✅ 전체 출석 체크
  const handleCheckAll = (checked) => {
    setAttendance(
      checked ? Object.fromEntries(members.map(m => [m.userId, true])) : {}
    );
  };

  // ✅ 출석 저장
  const handleSave = async () => {
    if (!selectedDate || !selectedSubProgram) {
      showSnackbar("날짜와 세부사업명을 선택하세요.", "error");
      return;
    }

    let mappedFunction = "";
    let mappedUnit = "";
    try {
      const structure = await getStructureBySubProgram(selectedSubProgram);
      if (!structure) {
        showSnackbar("세부사업명 매핑 실패", "error");
        return;
      }
      mappedFunction = structure.function;
      mappedUnit = structure.unit;
    } catch (err) {
      console.error("매핑 오류", err);
      showSnackbar("기능/단위사업 매핑 실패", "error");
      return;
    }

    const records = members.map(m => ({
      id: `${m.userId}_${selectedDate}_${selectedSubProgram}`,
      date: selectedDate,
      subProgram: selectedSubProgram,
      function: mappedFunction,
      unit: mappedUnit,
      name: m.name,
      gender: m.gender,
      phone: m.phone || "",
      paidType: m.paidType || "",
      userId: m.userId,
      attended: attendance[m.userId] || false,
      note: ""
    }));

    try {
      await saveAttendanceRecords(records);
      showSnackbar("출석 저장 완료", "success");
    } catch (err) {
      console.error("저장 오류", err);
      showSnackbar("출석 저장 중 오류 발생", "error");
    }
  };

  // ✅ 기존 출석 불러오기
  useEffect(() => {
    if (!selectedDate || !selectedSubProgram) return;

    getAttendanceRecordsByDateAndProgram(selectedDate, selectedSubProgram)
      .then((data) => {
        const result = {};
        data.forEach(r => {
          result[r.userId] = r.attended;
        });
        setAttendance(result);
      })
      .catch(() => showSnackbar("출석 불러오기 실패", "error"));
  }, [selectedDate, selectedSubProgram]);

  const isTeacher = role === "teacher";

  return (
    <div className="p-8">
      {SnackbarComp}
      <h2 className="text-2xl font-bold mb-4">출석 관리</h2>

      {/* 🔍 강사는 필터 숨김, 관리자만 선택 가능 */}
      {!isTeacher && (
        <div className="flex gap-4 mb-4 items-center">
          <label>팀:</label>
          <select
            value={selectedTeam}
            onChange={e => {
              setSelectedTeam(e.target.value);
              setSelectedSubProgram("");
              setMembers([]);
              setAttendance({});
            }}
          >
            <option value="">팀 선택</option>
            {Object.keys(teamSubProgramMap).map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>

          <label>세부사업명:</label>
          <select
            value={selectedSubProgram}
            onChange={e => setSelectedSubProgram(e.target.value)}
            disabled={!selectedTeam}
          >
            <option value="">세부사업 선택</option>
            {(teamSubProgramMap[selectedTeam] || []).map(sp => (
              <option key={sp} value={sp}>{sp}</option>
            ))}
          </select>
        </div>
      )}

      {/* 날짜 선택 */}
      <div className="mb-4">
        <label className="font-semibold mr-2">날짜:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="border px-2 py-1 rounded"
        />
      </div>

      {/* 출석 테이블 */}
      {selectedSubProgram ? (
        <AttendanceTable
          members={members.map(m => ({ ...m, id: m.userId }))}
          attendance={attendance}
          date={selectedDate}
          onCheck={handleCheck}
          onCheckAll={handleCheckAll}
          onSave={handleSave}
        />
      ) : (
        <div className="text-gray-500 mt-8">세부사업을 선택하세요.</div>
      )}
    </div>
  );
}

export default AttendanceManage;