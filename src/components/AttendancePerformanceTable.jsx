import React, { useState } from "react";
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Checkbox, Button, Alert
} from "@mui/material";

/**
 * 통합 테이블: 출석/실적 모드에 따라 컬럼/기능 분기
 * - 출석: 체크박스, 일괄 체크/해제, 일괄 저장
 * - 실적: 수정/삭제, 일괄 삭제, 특이사항 관리
 */
function AttendancePerformanceTable({
  mode,
  userRole,
  data,
  onEdit,
  onDelete,
  onBulkDelete,
  onCheck
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteResult, setDeleteResult] = useState(null);

  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    await onBulkDelete(selectedIds);
    setSelectedIds([]);
    setDeleteResult({ deleted: selectedIds, failed: [] });
  };

  // 출석 모드: 체크박스, 일괄 체크/해제, 일괄 저장
  if (mode === "attendance") {
    return (
      <Paper className="p-4 overflow-x-auto">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold">📋 출석 목록</span>
        </div>
        <TableContainer sx={{ overflowX: "auto", maxHeight: 500 }}>
          <Table size="small" sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>이름</TableCell>
                <TableCell>성별</TableCell>
                <TableCell>세부사업명</TableCell>
                <TableCell>날짜</TableCell>
                <TableCell>출석</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={row.attended}
                      onChange={() => onCheck && onCheck({
                        ...row,
                        attended: !row.attended
                      })}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.gender}</TableCell>
                  <TableCell>{row.subProgram}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.attended ? "출석" : "결석"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  // 실적 모드: 수정/삭제/일괄 삭제/특이사항 관리
  return (
    <Paper className="p-4 overflow-x-auto">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">📋 실적 목록</span>
        <Button
          variant="contained"
          color="error"
          onClick={handleBulkDelete}
          disabled={selectedIds.length === 0}
        >
          선택 삭제 ({selectedIds.length})
        </Button>
      </div>
      {deleteResult && (
        <Alert severity="success" className="mb-2">
          ✅ 삭제 완료: {deleteResult.deleted.length}건
        </Alert>
      )}
      <TableContainer sx={{ overflowX: "auto", maxHeight: 500 }}>
        <Table size="small" sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>날짜</TableCell>
              <TableCell>세부사업명</TableCell>
              <TableCell>이용자명</TableCell>
              <TableCell>성별</TableCell>
              <TableCell>출석</TableCell>
              <TableCell>특이사항</TableCell>
              <TableCell>수정</TableCell>
              <TableCell>삭제</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.includes(row.id)}
                    onChange={() => handleSelect(row.id)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.subProgram}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.gender}</TableCell>
                <TableCell>{row.attended ? "출석" : "결석"}</TableCell>
                <TableCell>{row.note || "-"}</TableCell>
                <TableCell>
                  {userRole !== "teacher" && (
                    <Button size="small" onClick={() => onEdit(row)}>
                      수정
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  {userRole !== "teacher" && (
                    <Button size="small" color="error" onClick={() => onDelete(row.id)}>
                      삭제
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default AttendancePerformanceTable;