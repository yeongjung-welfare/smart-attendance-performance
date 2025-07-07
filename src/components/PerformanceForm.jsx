import React, { useState, useEffect } from "react";

function PerformanceForm({ open, initialData = {}, onSubmit, onClose }) {
  const [form, setForm] = useState({
    subProgram: initialData.subProgram || "",
    name: initialData.name || "",
    date: initialData.date || "",
    note: initialData.note || ""
  });

  useEffect(() => {
    setForm(prev => {
      const same =
        prev.subProgram === (initialData.subProgram || "") &&
        prev.name === (initialData.name || "") &&
        prev.date === (initialData.date || "") &&
        prev.note === (initialData.note || "");
      if (same) return prev;

      return {
        subProgram: initialData.subProgram || "",
        name: initialData.name || "",
        date: initialData.date || "",
        note: initialData.note || ""
      };
    });
  }, [initialData]);

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit({
      ...form,
      result: "출석" // ✅ 항상 "출석"으로 고정 저장
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow min-w-[350px]">
        <h3 className="text-lg font-bold mb-4">
          {initialData.id ? "실적 수정" : "실적 등록"}
        </h3>

        <div className="mb-2">
          <label>세부사업명</label>
          <input
            name="subProgram"
            value={form.subProgram}
            onChange={handleChange}
            required
            className="w-full border rounded px-2 py-1"
          />
        </div>

        <div className="mb-2">
          <label>이름</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border rounded px-2 py-1"
          />
        </div>

        <div className="mb-2">
          <label>날짜</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            className="w-full border rounded px-2 py-1"
          />
        </div>

        <div className="mb-2">
          <label>비고</label>
          <input
            name="note"
            value={form.note}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
          />
        </div>

        <div className="flex gap-2 mt-4">
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            {initialData.id ? "수정" : "등록"}
          </button>
          <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={onClose}>
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

export default PerformanceForm;