import React from "react";
import { Button } from "@mui/material";

function ProgramStructureTable({ structure, onEdit, onDelete }) {
  return (
    <table className="w-full border">
      <thead>
        <tr>
          <th className="border px-2 py-1">기능</th>
          <th className="border px-2 py-1">단위사업명</th>
          <th className="border px-2 py-1">세부사업명 목록</th>
          <th className="border px-2 py-1">관리</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(structure).map(([func, units]) =>
          Object.entries(units).map(([unit, subPrograms]) => (
            <tr key={func + unit}>
              <td className="border px-2 py-1">{func}</td>
              <td className="border px-2 py-1">{unit}</td>
              <td className="border px-2 py-1">{subPrograms.join(", ")}</td>
              <td className="border px-2 py-1">
                <Button size="small" onClick={() => onEdit({ function: func, unit, subPrograms })}>수정</Button>
                <Button size="small" color="error" onClick={() => onDelete(func, unit)}>삭제</Button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export default ProgramStructureTable;