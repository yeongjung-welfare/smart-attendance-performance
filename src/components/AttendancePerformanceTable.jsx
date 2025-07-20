import React, { useState, useEffect, useMemo } from "react";
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, Button, Alert, Box, Typography
} from "@mui/material";
import { isPresent } from "../utils/attendanceUtils";

function AttendancePerformanceTable({
  mode, userRole, data, onEdit, onDelete, onBulkDelete, onCheck, onBulkAttendanceSave
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteResult, setDeleteResult] = useState(null);

  // ✅ useMemo로 데이터 정렬 최적화
  const sortedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    return [...data].sort((a, b) => {
      const aKey = `${a.세부사업명 || ""}_${a.이용자명 || ""}`;
      const bKey = `${b.세부사업명 || ""}_${b.이용자명 || ""}`;
      return aKey.localeCompare(bKey, "ko");
    });
  }, [data]);

  // ✅ 선택 상태 초기화
  useEffect(() => {
    setSelectedIds([]);
  }, [data]);

  // ✅ 개별 선택 처리 최적화
  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ✅ 전체 선택/해제 처리 최적화
  const handleSelectAll = () => {
    const allIds = sortedData.map(row => row.id).filter(Boolean);
    setSelectedIds(selectedIds.length === allIds.length ? [] : allIds);
  };

  // ✅ 일괄 삭제 처리 최적화
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      alert("삭제할 항목을 선택하세요.");
      return;
    }
    
    if (!window.confirm(`선택한 ${selectedIds.length}건을 정말 삭제하시겠습니까?`)) return;
    
    try {
      await onBulkDelete(selectedIds);
      setSelectedIds([]);
      setDeleteResult({ deleted: selectedIds, failed: [] });
    } catch (error) {
      console.error("일괄 삭제 오류:", error);
    }
  };

  // ✅ 일괄 출석 저장 처리 최적화
  const handleBulkAttendance = async () => {
    if (selectedIds.length === 0) {
      alert("출석 처리할 이용자를 선택하세요.");
      return;
    }

    const selectedRows = sortedData
      .filter(row => selectedIds.includes(row.id))
      .map(row => ({ ...row, 출석여부: true }));

    try {
      await onBulkAttendanceSave(selectedRows);
      setSelectedIds([]);
    } catch (error) {
      console.error("일괄 출석 저장 오류:", error);
    }
  };

  // ✅ 출석/결석 상태 표시 최적화
  const renderAttendanceStatus = (attendance) => (
    <Box 
      component="span" 
      sx={{ 
        color: isPresent(attendance) ? "#2e7d32" : "#d32f2f",
        fontWeight: 500
      }}
    >
      ● {isPresent(attendance) ? "출석" : "결석"}
    </Box>
  );

  // ✅ 출석 모드 UI 최적화
  if (mode === "attendance") {
    return (
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            📋 출석 목록 ({sortedData.length}명)
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handleSelectAll}
              size="small"
            >
              {selectedIds.length === sortedData.length && sortedData.length > 0 ? "전체 해제" : "전체 선택"}
            </Button>
            <Button
              variant="contained"
              onClick={handleBulkAttendance}
              disabled={selectedIds.length === 0}
              size="small"
            >
              일괄 출석 저장 ({selectedIds.length})
            </Button>
          </Box>
        </Box>

        <TableContainer sx={{ maxHeight: "calc(100vh - 300px)" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.length === sortedData.length && sortedData.length > 0}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < sortedData.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell><strong>이용자명</strong></TableCell>
                <TableCell><strong>성별</strong></TableCell>
                <TableCell><strong>세부사업명</strong></TableCell>
                <TableCell><strong>날짜</strong></TableCell>
                <TableCell><strong>출석여부</strong></TableCell>
                <TableCell><strong>상태</strong></TableCell>
                <TableCell><strong>고유아이디</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedIds.includes(row.id)}
                      onChange={() => handleSelect(row.id)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{row.이용자명}</TableCell>
                  <TableCell>{row.성별}</TableCell>
                  <TableCell>{row.세부사업명}</TableCell>
                  <TableCell>{row.날짜}</TableCell>
                  <TableCell>
                    <Checkbox
                      checked={isPresent(row.출석여부)}
                      onChange={() => onCheck && onCheck({
                        ...row,
                        출석여부: !isPresent(row.출석여부)
                      })}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{renderAttendanceStatus(row.출석여부)}</TableCell>
                  <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                    {row.고유아이디}
                  </TableCell>
                </TableRow>
              ))}
              {sortedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    출석 데이터가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  // ✅ 실적 모드 UI 최적화
  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          📋 실적 목록 ({sortedData.length}건)
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            color="error"
            onClick={handleBulkDelete}
            disabled={selectedIds.length === 0}
            size="small"
          >
            선택 삭제 ({selectedIds.length})
          </Button>
        </Box>
      </Box>

      {deleteResult && (
        <Alert severity="success" sx={{ mx: 2, mb: 1 }}>
          ✅ 삭제 완료: {deleteResult.deleted.length}건
        </Alert>
      )}

      <TableContainer sx={{ maxHeight: "calc(100vh - 300px)" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedIds.length === sortedData.length && sortedData.length > 0}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < sortedData.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell><strong>날짜</strong></TableCell>
              <TableCell><strong>세부사업명</strong></TableCell>
              <TableCell><strong>이용자명</strong></TableCell>
              <TableCell><strong>성별</strong></TableCell>
              <TableCell><strong>내용(특이사항)</strong></TableCell>
              <TableCell><strong>출석여부</strong></TableCell>
              <TableCell><strong>상태</strong></TableCell>
              <TableCell><strong>고유아이디</strong></TableCell>
              {userRole !== "teacher" && <TableCell><strong>작업</strong></TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.includes(row.id)}
                    onChange={() => handleSelect(row.id)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{row.날짜}</TableCell>
                <TableCell>{row.세부사업명}</TableCell>
                <TableCell>{row.이용자명}</TableCell>
                <TableCell>{row.성별}</TableCell>
                <TableCell>{row["내용(특이사항)"] || "-"}</TableCell>
                <TableCell>{isPresent(row.출석여부) ? "출석" : "결석"}</TableCell>
                <TableCell>{renderAttendanceStatus(row.출석여부)}</TableCell>
                <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                  {row.고유아이디}
                </TableCell>
                {userRole !== "teacher" && (
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => onEdit(row)}
                        sx={{ minWidth: 50, p: "2px 6px", fontSize: "0.75rem" }}
                      >
                        수정
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => onDelete(row.id)}
                        sx={{ minWidth: 50, p: "2px 6px", fontSize: "0.75rem" }}
                      >
                        삭제
                      </Button>
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {sortedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={userRole !== "teacher" ? 10 : 9} align="center" sx={{ py: 4 }}>
                  실적 데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default AttendancePerformanceTable;