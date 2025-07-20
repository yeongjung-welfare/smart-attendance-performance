import React from "react";
import { Button } from "@mui/material";

function TeamSubProgramMapTable({ mappings, onEdit, onDelete }) {
  return (
    <table className="w-full border mt-4">
      <thead className="bg-gray-100">
        <tr>
          <th className="border px-2 py-1">세부사업명</th>
          <th className="border px-2 py-1">팀명</th>
          <th className="border px-2 py-1">기능</th>
          <th className="border px-2 py-1">단위사업명</th>
          <th className="border px-2 py-1">관리</th>
        </tr>
      </thead>
      <tbody>
        {mappings.map((item) => (
          <tr key={item.id}>
            <td className="border px-2 py-1">{item.subProgramName || "-"}</td>
            <td className="border px-2 py-1">{item.teamName || "-"}</td>
            <td className="border px-2 py-1">{item.functionType || "-"}</td>
            <td className="border px-2 py-1">{item.mainProgramName || "-"}</td>
            <td className="border px-2 py-1 flex gap-2">
              <Button size="small" onClick={() => onEdit(item)}>수정</Button>
              <Button size="small" color="error" onClick={() => onDelete(item.id)}>삭제</Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default TeamSubProgramMapTable;