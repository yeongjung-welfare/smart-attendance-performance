import React, { useEffect, useState } from "react";
import {
  getAllProgramStructures,
  addProgramStructure,
  deleteProgramStructure,
} from "../services/programStructureAPI";
import useSnackbar from "../components/useSnackbar";
import ProgramStructureForm from "../components/ProgramStructureForm";
import ProgramStructureTable from "../components/ProgramStructureTable";
import { Button, TextField } from "@mui/material";
import { exportToExcel } from "../utils/exportToExcel";

function ProgramStructureManage() {
  const [structures, setStructures] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [SnackbarComp, showSnackbar] = useSnackbar();

  const loadStructures = async () => {
    try {
      const data = await getAllProgramStructures();
      setStructures(data);
    } catch (err) {
      showSnackbar("사업구조 불러오기 실패", "error");
    }
  };

  useEffect(() => {
    loadStructures();
  }, []);

  const handleSave = async (form) => {
    try {
      await addProgramStructure(form);
      showSnackbar("저장 완료", "success");
      setEditing(null);
      loadStructures();
    } catch (err) {
      showSnackbar("저장 실패: " + err.message, "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteProgramStructure(id);
      showSnackbar("삭제 완료", "success");
      loadStructures();
    } catch (err) {
      showSnackbar("삭제 실패: " + err.message, "error");
    }
  };

  const handleExport = () => {
    const formatted = filteredStructures.map((item) => ({
      기능: item.functionType,
      단위사업명: item.mainProgramName,
      세부사업명: item.subProgramName,
    }));
    exportToExcel({
      data: formatted,
      fileName: "사업구조",
      sheetName: "ProgramStructure",
    });
  };

  const filteredStructures = structures.filter((s) =>
    `${s.functionType}${s.mainProgramName}${s.subProgramName}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      {SnackbarComp}
      <h2 className="text-2xl font-bold mb-4">사업 구조 관리</h2>

      <TextField
        label="검색 (기능/단위사업명/세부사업명)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        className="mb-4"
      />

      <ProgramStructureForm onSave={handleSave} editing={editing} setEditing={setEditing} structures={structures} />

      <div className="flex justify-end mb-4">
        <Button variant="outlined" onClick={handleExport}>
          엑셀 다운로드
        </Button>
      </div>

      <ProgramStructureTable
        structures={filteredStructures}
        onEdit={setEditing}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default ProgramStructureManage;