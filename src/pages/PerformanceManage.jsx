import React, { useState, useEffect } from "react";
import { useProgramStructure } from "../hooks/useProgramStructure";
import { fetchPerformances, savePerformance, updatePerformance, deletePerformance } from "../services/performanceAPI";
import PerformanceTable from "../components/PerformanceTable";
import PerformanceForm from "../components/PerformanceForm";
import PerformanceUploadForm from "../components/PerformanceUploadForm";
import useSnackbar from "../components/useSnackbar";

function PerformanceManage() {
  const structure = useProgramStructure();
  const [performances, setPerformances] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [filters, setFilters] = useState({ function: "", unit: "", subProgram: "" });
  const [SnackbarComp, showSnackbar] = useSnackbar();

  useEffect(() => {
    fetchPerformances()
      .then(setPerformances)
      .catch(() => showSnackbar("실적 데이터 불러오기 실패", "error"));
  }, []);

  const functionOptions = Object.keys(structure).sort();
  const unitOptions = filters.function
    ? Object.keys(structure[filters.function] || {}).sort()
    : [];
  const subProgramOptions = (filters.function && filters.unit)
    ? (structure[filters.function][filters.unit] || []).sort()
    : [];

  const filteredPerformances = performances.filter(p =>
    (!filters.function || p.function === filters.function) &&
    (!filters.unit || p.unit === filters.unit) &&
    (!filters.subProgram || p.subProgram === filters.subProgram)
  );

  // 단건 등록
  const handleSingleRegister = async (data) => {
  try {
    const saved = await savePerformance(data);
    setPerformances(prev => [...prev, saved]);
    setShowForm(false);
    showSnackbar("실적이 등록되었습니다.", "success");
  } catch (err) {
    if (err.message.includes("이미 등록된")) {
      showSnackbar("이미 등록된 실적입니다.", "error");
    } else {
      showSnackbar("실적 등록 실패", "error");
    }
  }
};

  // 수정
  const handleEdit = (row) => setEditing(row);
  const handleUpdate = async (data) => {
    try {
      const updated = await updatePerformance(data.id, data);
      setPerformances(prev => prev.map(p => p.id === data.id ? updated : p));
      setEditing(null);
      showSnackbar("실적이 수정되었습니다.", "success");
    } catch {
      showSnackbar("실적 수정 실패", "error");
    }
  };

  // 대량 업로드
  const handleUpload = async (rows) => {
    try {
      for (const row of rows) {
        await savePerformance(row);
      }
      const data = await fetchPerformances();
      setPerformances(data);
      setShowUpload(false);
      showSnackbar("대량 실적 등록이 완료되었습니다.", "success");
    } catch {
      showSnackbar("대량 등록 실패", "error");
    }
  };

  // 삭제
  const handleDelete = async (id) => {
    try {
      await deletePerformance(id);
      setPerformances(prev => prev.filter(p => p.id !== id));
      showSnackbar("실적이 삭제되었습니다.", "success");
    } catch {
      showSnackbar("실적 삭제 실패", "error");
    }
  };

  return (
    <div className="p-8">
      {SnackbarComp}
      <h2 className="text-2xl font-bold mb-4">실적 관리</h2>
      <div className="flex gap-2 mb-4">
        <button
          className="px-4 py-2 border rounded bg-blue-500 text-white"
          onClick={() => setShowForm(true)}
        >
          실적 등록
        </button>
        <button
          className="px-4 py-2 border rounded"
          onClick={() => setShowUpload(true)}
        >
          대량 실적 업로드
        </button>
      </div>
      <div className="flex gap-4 mb-4 items-center">
        <label className="font-semibold">기능:</label>
        <select
          value={filters.function}
          onChange={e => setFilters(f => ({ ...f, function: e.target.value, unit: "", subProgram: "" }))}
          className="border rounded px-2 py-1"
        >
          <option value="">전체</option>
          {functionOptions.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <label className="font-semibold">단위사업명:</label>
        <select
          value={filters.unit}
          onChange={e => setFilters(f => ({ ...f, unit: e.target.value, subProgram: "" }))}
          className="border rounded px-2 py-1"
          disabled={!filters.function}
        >
          <option value="">전체</option>
          {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <label className="font-semibold">세부사업명:</label>
        <select
          value={filters.subProgram}
          onChange={e => setFilters(f => ({ ...f, subProgram: e.target.value }))}
          className="border rounded px-2 py-1"
          disabled={!filters.unit}
        >
          <option value="">전체</option>
          {subProgramOptions.map(sp => <option key={sp} value={sp}>{sp}</option>)}
        </select>
      </div>
      <PerformanceTable
        performances={filteredPerformances}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      {showForm && (
        <PerformanceForm
          open={showForm}
          onSubmit={handleSingleRegister}
          onClose={() => setShowForm(false)}
          structure={structure}
        />
      )}
      {editing && (
        <PerformanceForm
          open={!!editing}
          initialData={editing}
          onSubmit={handleUpdate}
          onClose={() => setEditing(null)}
          structure={structure}
        />
      )}
      {showUpload && (
        <PerformanceUploadForm
          onSuccess={handleUpload}
          onClose={() => setShowUpload(false)}
          structure={structure}
        />
      )}
    </div>
  );
}

export default PerformanceManage;