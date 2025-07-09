import React, { useState, useEffect } from "react";
import AttendancePerformanceTable from "../components/AttendancePerformanceTable";
import AttendancePerformanceForm from "../components/AttendancePerformanceForm";
import AttendancePerformanceUploadForm from "../components/AttendancePerformanceUploadForm";
import PerformanceBulkUploadForm from "../components/PerformanceBulkUploadForm";
import PerformanceSingleRegisterForm from "../components/PerformanceSingleRegisterForm";
import { useUserRole } from "../hooks/useUserRole";
import useSnackbar from "../components/useSnackbar";
import { useProgramStructure } from "../hooks/useProgramStructure";
import {
  fetchAttendances,
  fetchPerformances,
  saveAttendanceRecords,
  updatePerformance,
  deletePerformance,
  deleteMultiplePerformances,
  uploadAttendanceData
} from "../services/attendancePerformanceAPI";

function AttendancePerformanceManage() {
  const [mode, setMode] = useState("attendance"); // "attendance" | "performance"
  const [showForm, setShowForm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showSingleRegister, setShowSingleRegister] = useState(false);
  const [editing, setEditing] = useState(null);
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({
    function: "",
    unit: "",
    subProgram: "",
    date: ""
  });
  const { role: userRole, loading: roleLoading } = useUserRole();
  const [SnackbarComp, showSnackbar] = useSnackbar();
  const structure = useProgramStructure();

  useEffect(() => {
    if (mode === "attendance") {
      fetchAttendances(filters).then(setData).catch(() => showSnackbar("출석 데이터 불러오기 실패", "error"));
    } else {
      fetchPerformances(filters).then(setData).catch(() => showSnackbar("실적 데이터 불러오기 실패", "error"));
    }
  }, [mode, filters, showForm, showUpload, showBulkUpload, showSingleRegister]);

  const functionOptions = Object.keys(structure).sort();
  const unitOptions = filters.function
    ? Object.keys(structure[filters.function] || {}).sort()
    : [];
  const subProgramOptions =
    filters.function && filters.unit
      ? structure[filters.function][filters.unit] || []
      : [];

  const handleSingleRegister = async (formData) => {
    try {
      await saveAttendanceRecords([formData]);
      showSnackbar("출석이 등록되었습니다.", "success");
      setShowForm(false);
      fetchAttendances(filters).then(setData);
    } catch (err) {
      showSnackbar(err.message || "등록 실패", "error");
    }
  };

  const handleEdit = (row) => setEditing(row);

  const handleUpdate = async (formData) => {
    try {
      await updatePerformance(formData.id, formData);
      showSnackbar("실적이 수정되었습니다.", "success");
      setEditing(null);
      fetchPerformances(filters).then(setData);
    } catch (err) {
      showSnackbar("수정 실패", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePerformance(id);
      showSnackbar("삭제되었습니다.", "success");
      fetchPerformances(filters).then(setData);
    } catch {
      showSnackbar("삭제 실패", "error");
    }
  };

  const handleBulkDelete = async (ids) => {
    try {
      await deleteMultiplePerformances(ids);
      showSnackbar(`선택된 ${ids.length}건 삭제 완료`, "success");
      fetchPerformances(filters).then(setData);
    } catch {
      showSnackbar("일괄 삭제 실패", "error");
    }
  };

  const handleUpload = async (rows) => {
    try {
      await uploadAttendanceData(rows);
      showSnackbar("대량 출석 등록이 완료되었습니다.", "success");
      setShowUpload(false);
      fetchAttendances(filters).then(setData);
    } catch {
      showSnackbar("대량 등록 실패", "error");
    }
  };

  const handleBulkUpload = async () => {
    fetchPerformances(filters).then(setData);
    setShowBulkUpload(false);
    showSnackbar("대량 실적 업로드 완료", "success");
  };

  const handleSinglePerformanceRegister = async () => {
    fetchPerformances(filters).then(setData);
    setShowSingleRegister(false);
    showSnackbar("실적 단건 등록 완료", "success");
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "function" ? { unit: "", subProgram: "" } : {}),
      ...(key === "unit" ? { subProgram: "" } : {})
    }));
  };

  if (roleLoading) return <div className="text-center py-8">권한 정보를 불러오는 중...</div>;

  return (
    <div className="p-4 max-w-screen-lg mx-auto">
      {SnackbarComp}
      <h2 className="text-2xl font-bold mb-4">출석·실적 통합 관리</h2>

      <div className="flex gap-2 mb-4">
        <button
          className={`w-full sm:w-auto px-4 py-2 rounded ${mode === "attendance" ? "bg-blue-600 text-white" : "border"}`}
          onClick={() => setMode("attendance")}
        >
          출석관리
        </button>
        <button
          className={`w-full sm:w-auto px-4 py-2 rounded ${mode === "performance" ? "bg-blue-600 text-white" : "border"}`}
          onClick={() => setMode("performance")}
        >
          실적관리
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="font-semibold block mb-1">기능</label>
          <select
            value={filters.function}
            onChange={(e) => handleFilterChange("function", e.target.value)}
            className="border rounded px-2 py-1 w-full"
          >
            <option value="">전체</option>
            {functionOptions.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-semibold block mb-1">단위사업명</label>
          <select
            value={filters.unit}
            onChange={(e) => handleFilterChange("unit", e.target.value)}
            className="border rounded px-2 py-1 w-full"
            disabled={!filters.function}
          >
            <option value="">전체</option>
            {unitOptions.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-semibold block mb-1">세부사업명</label>
          <select
            value={filters.subProgram}
            onChange={(e) => handleFilterChange("subProgram", e.target.value)}
            className="border rounded px-2 py-1 w-full"
            disabled={!filters.unit}
          >
            <option value="">전체</option>
            {subProgramOptions.map((sp) => (
              <option key={sp} value={sp}>{sp}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-semibold block mb-1">날짜</label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => handleFilterChange("date", e.target.value)}
            className="border rounded px-2 py-1 w-full"
          />
        </div>
      </div>

      {mode === "attendance" && userRole !== "teacher" && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full sm:w-auto"
            onClick={() => setShowForm(true)}
          >
            + 단건 등록
          </button>
          <button
            className="px-4 py-2 border rounded w-full sm:w-auto"
            onClick={() => setShowUpload(true)}
          >
            📥 대량 업로드
          </button>
        </div>
      )}

      {mode === "performance" && userRole !== "teacher" && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full sm:w-auto"
            onClick={() => setShowSingleRegister(true)}
          >
            + 단건 등록
          </button>
          <button
            className="px-4 py-2 border rounded w-full sm:w-auto"
            onClick={() => setShowBulkUpload(true)}
          >
            📥 대량 실적 업로드
          </button>
        </div>
      )}

      <AttendancePerformanceTable
        mode={mode}
        userRole={userRole}
        data={data}
        onEdit={mode === "performance" ? handleEdit : undefined}
        onDelete={mode === "performance" ? handleDelete : undefined}
        onBulkDelete={mode === "performance" ? handleBulkDelete : undefined}
        onCheck={mode === "attendance" ? handleSingleRegister : undefined}
      />

      {showForm && mode === "attendance" && (
        <AttendancePerformanceForm
          mode="attendance"
          initialData={{}}
          onSubmit={handleSingleRegister}
          onClose={() => setShowForm(false)}
          structure={structure}
        />
      )}

      {editing && mode === "performance" && (
        <AttendancePerformanceForm
          mode="performance"
          initialData={editing}
          onSubmit={handleUpdate}
          onClose={() => setEditing(null)}
          structure={structure}
        />
      )}

      {showUpload && mode === "attendance" && (
        <AttendancePerformanceUploadForm
          mode="attendance"
          onSuccess={handleUpload}
          onClose={() => setShowUpload(false)}
          structure={structure}
        />
      )}

      {showBulkUpload && mode === "performance" && (
        <PerformanceBulkUploadForm
          onSuccess={handleBulkUpload}
          onClose={() => setShowBulkUpload(false)}
        />
      )}

      {showSingleRegister && mode === "performance" && (
        <PerformanceSingleRegisterForm
          onSuccess={handleSinglePerformanceRegister}
          onClose={() => setShowSingleRegister(false)}
        />
      )}
    </div>
  );
}

export default AttendancePerformanceManage;