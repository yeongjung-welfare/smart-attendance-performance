// src/components/SubProgramMemberTable.jsx
import React, { useMemo, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Checkbox, Button, Box, useMediaQuery, Typography, CircularProgress, Chip } from "@mui/material";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import SelectAllIcon from "@mui/icons-material/SelectAll";
import ClearAllIcon from "@mui/icons-material/ClearAll";

function SubProgramMemberTable({
  members = [],
  onDelete,
  onBulkDelete,
  onBulkEdit,
  canDelete,
  role,
  onEdit,
  selectedIds = [],
  onSelectAll,
  onSelectRow,
  loading = false
}) {
  const isDeletableRole = role === "admin" || role === "manager";
  const isMobile = useMediaQuery("(max-width:600px)");

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });

  // 안전한 데이터 처리
  const rows = useMemo(() => {
    if (!Array.isArray(members)) {
      console.warn("⚠️ members가 배열이 아닙니다:", members);
      return [];
    }

    return members.map((m, index) => ({
      ...m,
      id: String(m.id || m.고유아이디 || `member-${index}`)
    }));
  }, [members]);

  // ✅ 정확한 선택 상태 계산 - 중복 제거
  const selectionStats = useMemo(() => {
    const totalRows = rows.length;
    // 실제 존재하는 ID만 카운트
    const validSelectedIds = selectedIds.filter(id => 
      rows.some(row => String(row.id) === String(id))
    );
    const selectedCount = validSelectedIds.length;
    const isAllSelected = selectedCount === totalRows && totalRows > 0;
    const isPartialSelected = selectedCount > 0 && selectedCount < totalRows;
    
    return {
      totalRows,
      selectedCount,
      isAllSelected,
      isPartialSelected
    };
  }, [rows, selectedIds]);

  // 7열 컬럼 구성
  const columns = [
    {
      field: "checkbox",
      headerName: "",
      width: 50,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderHeader: () => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Checkbox
            checked={selectionStats.isAllSelected}
            indeterminate={selectionStats.isPartialSelected}
            onChange={(e) => {
              const newChecked = e.target.checked;
              onSelectAll?.(newChecked);
            }}
            disabled={!isDeletableRole || rows.length === 0}
            size="small"
            sx={{
              color: selectionStats.isPartialSelected ? '#ff9800' : undefined,
              '&.Mui-checked': {
                color: '#1976d2'
              }
            }}
          />
        </Box>
      ),
      renderCell: (params) => (
        <Checkbox
          checked={selectedIds.includes(String(params.row.id))}
          onChange={(e) => onSelectRow?.(String(params.row.id), e.target.checked)}
          disabled={!isDeletableRole || !canDelete?.(params.row)}
          size="small"
        />
      ),
    },
    { field: "이용자명", headerName: "이용자명", width: 120 },
    { field: "세부사업명", headerName: "세부사업명", width: 150 },
    { field: "성별", headerName: "성별", width: 80 },
    { field: "연락처", headerName: "연락처", width: 130 },
    { field: "연령대", headerName: "연령대", width: 90 },
    { field: "이용상태", headerName: "이용상태", width: 90 },
    {
      field: "actions",
      headerName: "작업",
      width: 140,
      sortable: false,
      filterable: false,
      align: "center",
      disableColumnMenu: true,
      renderCell: (params) => {
        const row = params.row;
        const deletable = isDeletableRole && (typeof canDelete === "function" ? canDelete(row) : true);

        return (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => onEdit?.(row)}
              sx={{ minWidth: 50, p: "2px 6px", fontSize: "0.75rem" }}
              disabled={!deletable || !onEdit}
            >
              수정
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => onDelete?.(String(row.id))}
              sx={{ minWidth: 50, p: "2px 6px", fontSize: "0.75rem" }}
              disabled={!deletable || !onDelete}
            >
              삭제
            </Button>
          </Box>
        );
      },
    }
  ];

  const handlePaginationModelChange = (newModel) => {
    if (
      newModel &&
      typeof newModel.page === "number" &&
      typeof newModel.pageSize === "number" &&
      newModel.page >= 0 &&
      newModel.pageSize > 0
    ) {
      setPaginationModel(newModel);
    }
  };

  // ✅ 완전히 개선된 모두선택/해제 토글 기능
  const handleSelectAllClick = () => {
    if (!Array.isArray(rows) || rows.length === 0) return;
    
    const shouldSelectAll = !selectionStats.isAllSelected;
    onSelectAll?.(shouldSelectAll);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          이용자 목록을 불러오는 중...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* ✅ 개선된 헤더 - 선택 상태 정확한 표시 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">
            📋 이용자 목록 ({rows.length}명)
          </Typography>
          {selectionStats.selectedCount > 0 && (
            <Chip 
              label={`${selectionStats.selectedCount}명 선택됨`}
              color="primary"
              size="small"
            />
          )}
        </Box>

        {/* ✅ 모두 선택/해제 버튼 - 항상 표시되도록 수정 */}
        {isDeletableRole && rows.length > 0 && (
          <Button
            variant={selectionStats.selectedCount > 0 ? "contained" : "outlined"}
            color={selectionStats.isAllSelected ? "secondary" : "primary"}
            onClick={handleSelectAllClick}
            startIcon={
              selectionStats.isAllSelected ? <ClearAllIcon /> : 
              selectionStats.isPartialSelected ? <CheckBoxIcon /> : 
              <SelectAllIcon />
            }
            sx={{ 
              minWidth: 150,
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            {selectionStats.isAllSelected 
              ? "모두 해제" 
              : selectionStats.isPartialSelected 
                ? `모두 선택 (${selectionStats.selectedCount}/${selectionStats.totalRows})`
                : "모두 선택"
            }
          </Button>
        )}
      </Box>

      {/* DataGrid - rowSelectionModel 완전 제거 */}
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => String(row.id)}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 25 }
          }
        }}
        paginationModel={paginationModel}
        onPaginationModelChange={handlePaginationModelChange}
        pageSizeOptions={[10, 25, 50, 100]}
        paginationMode="client"
        checkboxSelection={false}
        disableRowSelectionOnClick={true}
        hideFooterSelectedRowCount={true}
        hideFooter={rows.length === 0}
        slots={{
          noRowsOverlay: () => (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography>이용자 데이터가 없습니다.</Typography>
            </Box>
          ),
        }}
        disableColumnMenu={false}
        sx={{
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#f8f9fa",
            fontWeight: 600,
            fontSize: "0.9rem"
          },
          "& .MuiDataGrid-cell": {
            fontSize: { xs: "0.85rem", sm: "0.9rem" }
          },
          "& .MuiDataGrid-row": {
            "&:hover": { backgroundColor: "#f5f5f5" }
          }
        }}
      />

      {/* ✅ 개선된 액션 버튼들 - 선택 상태에 따른 활성화 */}
      {isDeletableRole && (
        <Box sx={{ display: "flex", gap: 2, mt: 2, flexWrap: "wrap", alignItems: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => onBulkEdit?.(selectedIds)}
            disabled={selectedIds.length === 0}
            sx={{ minWidth: 140, fontWeight: 600 }}
          >
            선택 수정 ({selectionStats.selectedCount}명)
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => onBulkDelete?.(selectedIds)}
            disabled={selectedIds.length === 0}
            sx={{ minWidth: 140, fontWeight: 600 }}
          >
            선택 삭제 ({selectionStats.selectedCount}명)
          </Button>

          {/* 선택 상태 요약 정보 */}
          {selectionStats.selectedCount > 0 && (
            <Typography variant="body2" color="textSecondary">
              전체 {selectionStats.totalRows}명 중 {selectionStats.selectedCount}명 선택
              {selectionStats.isAllSelected && " (전체 선택됨)"}
              {selectionStats.isPartialSelected && " (부분 선택됨)"}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

export default SubProgramMemberTable;