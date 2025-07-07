import React, { useState, useEffect } from "react";
import { TextField, MenuItem, Button } from "@mui/material";
import { useProgramStructure } from "../hooks/useProgramStructure";
import { getAllMembers } from "../services/memberAPI";
import { saveAttendanceRecords } from "../services/attendanceAPI";
import AttendanceTable from "./AttendanceTable";
import { format } from "date-fns";

function AttendanceForm() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [subProgram, setSubProgram] = useState("");
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState([]);
  const structure = useProgramStructure();

  const allSubs = [];
  Object.values(structure).forEach(units =>
    Object.values(units).forEach(subs => allSubs.push(...subs))
  );
  const subPrograms = Array.from(new Set(allSubs)).sort();

  useEffect(() => {
    getAllMembers().then(setMembers);
  }, []);

  const handleSubmit = async () => {
    const records = selected.map(user => ({
      id: `${user.userId}_${date}_${subProgram}`,
      userId: user.userId,
      name: user.name,
      subProgram,
      date,
      attended: true
    }));
    await saveAttendanceRecords(records);
    alert(`${records.length}명 출석 등록 완료`);
  };

  const filtered = members.filter(m => m.subProgram === subProgram);

  return (
    <>
      <div className="flex gap-4 mb-4">
        <TextField
          select label="세부사업명" value={subProgram} onChange={e => setSubProgram(e.target.value)} required
        >
          {subPrograms.map(sp => (
            <MenuItem key={sp} value={sp}>{sp}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="날짜" type="date" value={date}
          onChange={e => setDate(e.target.value)} InputLabelProps={{ shrink: true }}
        />
        <Button variant="contained" onClick={handleSubmit}>출석 저장</Button>
      </div>
      <AttendanceTable members={filtered} selected={selected} onChange={setSelected} />
    </>
  );
}

export default AttendanceForm;