// src/components/TeamSubProgramMapForm.jsx
import React, { useState, useEffect } from "react";
import { Autocomplete, TextField, Button } from "@mui/material";

const functionOptions = ["서비스제공기능", "사례관리기능", "지역조직화기능"];
const teamOptions = ["서비스제공연계팀", "마을협력팀", "마을돌봄팀", "사례관리팀", "운영지원팀"];

function TeamSubProgramMapForm({ editing = null, onSave, onCancel }) {
  const [functionType, setFunctionType] = useState("");
  const [team, setTeam] = useState("");
  const [mainProgram, setMainProgram] = useState("");
  const [subProgramText, setSubProgramText] = useState("");

  useEffect(() => {
    if (editing) {
      setFunctionType(editing.functionType);
      setTeam(editing.teamName);
      setMainProgram(editing.mainProgramName);
      setSubProgramText((editing.subPrograms || []).join(", "));
    } else {
      setFunctionType(""); setTeam(""); setMainProgram(""); setSubProgramText("");
    }
  }, [editing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanSubs = Array.from(
      new Set(subProgramText.split(",").map(s => s.trim()).filter(Boolean))
    );
    if (functionType && team && mainProgram && cleanSubs.length > 0) {
      onSave({
        functionType,
        teamName: team,
        mainProgramName: mainProgram,
        subPrograms: cleanSubs,
      });
      setSubProgramText("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="my-4 grid gap-3 grid-cols-1 sm:grid-cols-2">
      <Autocomplete
        options={functionOptions}
        value={functionType}
        onChange={(_, v) => setFunctionType(v)}
        renderInput={params => <TextField {...params} label="기능" required />}
      />
      <Autocomplete
        options={teamOptions}
        value={team}
        onChange={(_, v) => setTeam(v)}
        renderInput={params => <TextField {...params} label="팀명" required />}
      />
      <TextField
        label="단위사업명 (직접입력)"
        value={mainProgram}
        onChange={(e) => setMainProgram(e.target.value)}
        required
      />
      <TextField
        label="세부사업명 (쉼표로 구분)"
        value={subProgramText}
        onChange={(e) => setSubProgramText(e.target.value)}
        required
      />
      <div className="col-span-2 flex gap-2">
        <Button type="submit" variant="contained" color="primary">저장</Button>
        {onCancel && <Button onClick={onCancel}>취소</Button>}
      </div>
    </form>
  );
}

export default TeamSubProgramMapForm;