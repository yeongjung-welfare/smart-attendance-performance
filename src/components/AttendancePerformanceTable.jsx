import React, { useState, useEffect, useMemo } from "react";
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, Button, Alert, Box, Typography, TableSortLabel, TextField, 
  MenuItem, FormControl, InputLabel, Select, Chip
} from "@mui/material";
import { isPresent } from "../utils/attendanceUtils";

function AttendancePerformanceTable({
  mode, userRole, data, onEdit, onDelete, onBulkDelete, onCheck, onBulkAttendanceSave
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteResult, setDeleteResult] = useState(null);
  // ✅ 정렬/필터 상태 추가
  const [sortConfig, setSortConfig] = useState({ 
    key: null, 
    direction: 'asc' 
  });
  const [filterConfig, setFilterConfig] = useState({
    세부사업명: '',
    출석여부: '',
    이용자명: ''
  });

    // ✅ 정렬 및 필터링된 데이터 처리
  const sortedAndFilteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    let filteredData = [...data];
    
    // 필터링 적용
    if (filterConfig.세부사업명) {
      filteredData = filteredData.filter(item => 
        item.세부사업명?.includes(filterConfig.세부사업명)
      );
    }
    
    if (filterConfig.출석여부) {
      filteredData = filteredData.filter(item => {
        const isAttended = isPresent(item.출석여부);
        return filterConfig.출석여부 === 'attended' ? isAttended : !isAttended;
      });
    }
    
    if (filterConfig.이용자명) {
      filteredData = filteredData.filter(item =>
        item.이용자명?.includes(filterConfig.이용자명)
      );
    }
    
    // 정렬 적용
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // 날짜 정렬 처리
        if (sortConfig.key === '날짜') {
          aValue = new Date(aValue || '1900-01-01');
          bValue = new Date(bValue || '1900-01-01');
          return sortConfig.direction === 'asc' 
            ? aValue - bValue 
            : bValue - aValue;
        }
        
        // 문자열 정렬 (한글 지원)
        aValue = String(aValue || '');
        bValue = String(bValue || '');
        
        const comparison = aValue.localeCompare(bValue, 'ko');
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    } else {
      // 기본 정렬 (기존 로직 유지)
      filteredData.sort((a, b) => {
        const aKey = `${a.세부사업명 || ""}_${a.이용자명 || ""}`;
        const bKey = `${b.세부사업명 || ""}_${b.이용자명 || ""}`;
        return aKey.localeCompare(bKey, "ko");
      });
    }
    
    return filteredData;
  }, [data, sortConfig, filterConfig]);

  // ✅ 선택 상태 초기화
  useEffect(() => {
    setSelectedIds([]);
  }, [data]);

  // ✅ 여기에 추가할 함수들
  // 정렬 처리 함수 추가
  const handleSort = (columnKey) => {
    setSortConfig(prevConfig => ({
      key: columnKey,
      direction: prevConfig.key === columnKey && prevConfig.direction === 'asc' 
        ? 'desc' 
        : 'asc'
    }));
  };

  // 필터 처리 함수 추가
  const handleFilterChange = (filterKey, value) => {
    setFilterConfig(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  // 필터 초기화 함수 추가
  const clearFilters = () => {
    setFilterConfig({
      세부사업명: '',
      출석여부: '',
      이용자명: ''
    });
    setSortConfig({ key: null, direction: 'asc' });
  };

  // 정렬 가능한 컬럼 헤더 컴포넌트
  const SortableTableCell = ({ children, sortKey, align = "left" }) => (
    <TableCell align={align}>
      <TableSortLabel
        active={sortConfig.key === sortKey}
        direction={sortConfig.key === sortKey ? sortConfig.direction : 'asc'}
        onClick={() => handleSort(sortKey)}
        sx={{ fontWeight: 'bold' }}
      >
        {children}
      </TableSortLabel>
    </TableCell>
  );

  // 유니크한 세부사업명 목록 생성
  const uniqueSubPrograms = useMemo(() => {
    const programs = new Set(data?.map(item => item.세부사업명).filter(Boolean));
    return Array.from(programs).sort((a, b) => a.localeCompare(b, 'ko'));
  }, [data]);

  // ✅ 개별 선택 처리 최적화
  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

    // ✅ 전체 선택/해제 처리 최적화
  const handleSelectAll = () => {
    const allIds = sortedAndFilteredData.map(row => row.id).filter(Boolean);
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

        const selectedRows = sortedAndFilteredData
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
            📋 출석 목록 ({sortedAndFilteredData.length}명)
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handleSelectAll}
              size="small"
            >
              {selectedIds.length === sortedAndFilteredData.length && sortedAndFilteredData.length > 0 ? "전체 해제" : "전체 선택"}
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

        {/* ✅ 필터 섹션 추가 */}
        <Box sx={{ p: 2, pt: 0, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            label="이용자명 검색"
            size="small"
            value={filterConfig.이용자명}
            onChange={(e) => handleFilterChange('이용자명', e.target.value)}
            sx={{ minWidth: 150 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>세부사업명</InputLabel>
            <Select
              value={filterConfig.세부사업명}
              label="세부사업명"
              onChange={(e) => handleFilterChange('세부사업명', e.target.value)}
            >
              <MenuItem value="">전체</MenuItem>
              {uniqueSubPrograms.map(program => (
                <MenuItem key={program} value={program}>{program}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>출석여부</InputLabel>
            <Select
              value={filterConfig.출석여부}
              label="출석여부"
              onChange={(e) => handleFilterChange('출석여부', e.target.value)}
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="attended">출석</MenuItem>
              <MenuItem value="absent">결석</MenuItem>
            </Select>
          </FormControl>
          
          <Button 
            variant="outlined" 
            size="small" 
            onClick={clearFilters}
            sx={{ height: 40 }}
          >
            필터 초기화
          </Button>
          
          {/* 활성 필터 표시 */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {filterConfig.이용자명 && (
              <Chip 
                label={`이름: ${filterConfig.이용자명}`} 
                size="small" 
                onDelete={() => handleFilterChange('이용자명', '')}
              />
            )}
            {filterConfig.세부사업명 && (
              <Chip 
                label={`사업: ${filterConfig.세부사업명}`} 
                size="small" 
                onDelete={() => handleFilterChange('세부사업명', '')}
              />
            )}
            {filterConfig.출석여부 && (
              <Chip 
                label={`출석: ${filterConfig.출석여부 === 'attended' ? '출석' : '결석'}`} 
                size="small" 
                onDelete={() => handleFilterChange('출석여부', '')}
              />
            )}
          </Box>
        </Box>

        <TableContainer sx={{ maxHeight: "calc(100vh - 400px)" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.length === sortedAndFilteredData.length && sortedAndFilteredData.length > 0}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < sortedAndFilteredData.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <SortableTableCell sortKey="이용자명">이용자명</SortableTableCell>
                <TableCell><strong>성별</strong></TableCell>
                <SortableTableCell sortKey="세부사업명">세부사업명</SortableTableCell>
                <SortableTableCell sortKey="날짜">날짜</SortableTableCell>
                <TableCell><strong>출석여부</strong></TableCell>
                <TableCell><strong>상태</strong></TableCell>
                <TableCell><strong>고유아이디</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedAndFilteredData.map((row) => (
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
              {sortedAndFilteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    {Object.values(filterConfig).some(v => v) ? "필터 조건에 맞는 데이터가 없습니다." : "출석 데이터가 없습니다."}
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
          📋 실적 목록 ({sortedAndFilteredData.length}건)
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

      {/* ✅ 실적 모드에도 필터 섹션 추가 */}
      <Box sx={{ p: 2, pt: 0, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          label="이용자명 검색"
          size="small"
          value={filterConfig.이용자명}
          onChange={(e) => handleFilterChange('이용자명', e.target.value)}
          sx={{ minWidth: 150 }}
        />
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>세부사업명</InputLabel>
          <Select
            value={filterConfig.세부사업명}
            label="세부사업명"
            onChange={(e) => handleFilterChange('세부사업명', e.target.value)}
          >
            <MenuItem value="">전체</MenuItem>
            {uniqueSubPrograms.map(program => (
              <MenuItem key={program} value={program}>{program}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>출석여부</InputLabel>
          <Select
            value={filterConfig.출석여부}
            label="출석여부"
            onChange={(e) => handleFilterChange('출석여부', e.target.value)}
          >
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="attended">출석</MenuItem>
            <MenuItem value="absent">결석</MenuItem>
          </Select>
        </FormControl>
        
        <Button 
          variant="outlined" 
          size="small" 
          onClick={clearFilters}
          sx={{ height: 40 }}
        >
          필터 초기화
        </Button>
        
        {/* 활성 필터 표시 */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {filterConfig.이용자명 && (
            <Chip 
              label={`이름: ${filterConfig.이용자명}`} 
              size="small" 
              onDelete={() => handleFilterChange('이용자명', '')}
            />
          )}
          {filterConfig.세부사업명 && (
            <Chip 
              label={`사업: ${filterConfig.세부사업명}`} 
              size="small" 
              onDelete={() => handleFilterChange('세부사업명', '')}
            />
          )}
          {filterConfig.출석여부 && (
            <Chip 
              label={`출석: ${filterConfig.출석여부 === 'attended' ? '출석' : '결석'}`} 
              size="small" 
              onDelete={() => handleFilterChange('출석여부', '')}
            />
          )}
        </Box>
      </Box>

      <TableContainer sx={{ maxHeight: "calc(100vh - 400px)" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedIds.length === sortedAndFilteredData.length && sortedAndFilteredData.length > 0}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < sortedAndFilteredData.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <SortableTableCell sortKey="날짜">날짜</SortableTableCell>
              <SortableTableCell sortKey="세부사업명">세부사업명</SortableTableCell>
              <SortableTableCell sortKey="이용자명">이용자명</SortableTableCell>
              <TableCell><strong>성별</strong></TableCell>
              <TableCell><strong>내용(특이사항)</strong></TableCell>
              <TableCell><strong>출석여부</strong></TableCell>
              <TableCell><strong>상태</strong></TableCell>
              <TableCell><strong>고유아이디</strong></TableCell>
              {userRole !== "teacher" && <TableCell><strong>작업</strong></TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedAndFilteredData.map((row) => (
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
            {sortedAndFilteredData.length === 0 && (
              <TableRow>
                <TableCell colSpan={userRole !== "teacher" ? 10 : 9} align="center" sx={{ py: 4 }}>
                  {Object.values(filterConfig).some(v => v) ? "필터 조건에 맞는 데이터가 없습니다." : "실적 데이터가 없습니다."}
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