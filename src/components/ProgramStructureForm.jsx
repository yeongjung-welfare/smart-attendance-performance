import React, { useState } from "react";
import { TextField, Button, Autocomplete } from "@mui/material";

const functionOptions = ["서비스제공기능", "사례관리기능", "지역조직화기능"];

function ProgramStructureForm({ onSave, editing }) {
  const [func, setFunc] = useState(editing?.function || "");
  const [unit, setUnit] = useState(editing?.unit || "");
  const [subPrograms, setSubPrograms] = useState(editing?.subPrograms || []);

  const handleSubmit = e => {
    e.preventDefault();
    if (func && unit && subPrograms.length > 0) {
      onSave({ function: func, unit, subPrograms });
      setFunc(""); setUnit(""); setSubPrograms([]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center mb-4">
      <Autocomplete
        options={functionOptions}
        value={func}
        onChange={(_, v) => setFunc(v)}
        renderInput={params => <TextField {...params} label="기능" required />}
        sx={{ minWidth: 160 }}
      />
      <TextField
        label="단위사업명"
        value={unit}
        onChange={e => setUnit(e.target.value)}
        required
        sx={{ minWidth: 160 }}
      />
      <Autocomplete
        multiple
        freeSolo
        options={[]} // 기존 세부사업명 목록을 넣을 수도 있음
        value={subPrograms}
        onChange={(_, v) => setSubPrograms(v)}
        renderInput={params => <TextField {...params} label="세부사업명(여러개)" required />}
        sx={{ minWidth: 240 }}
      />
      <Button type="submit" variant="contained" color="primary">저장</Button>
    </form>
  );
}

export default ProgramStructureForm;