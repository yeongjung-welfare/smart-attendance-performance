import React, { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Box } from "@mui/material";

/**
 * 세부사업 이용자 목록 테이블 + 단일 삭제 + 다중 선택 삭제
 * @param {Array} members - 이용자 목록
 * @param {Function} onDelete - 삭제 핸들러 (userId)
 * @param {Function} onBulkDelete - 일괄 삭제 핸들러 (ids 배열)
 * @param {Function} canDelete - 삭제 가능 여부 체크 함수 (row)
 * @param {string} role - 사용자 역할 (admin | manager | teacher)
 */
function SubProgramMemberTable({ members, onDelete, onBulkDelete, canDelete, role }) {
  const [selectionModel, setSelectionModel] = useState([]);

  const isDeletableRole = role === "admin" || role === "manager";

  const columns = [
    { field: "team", headerName: "팀명", width: 120 },
    { field: "unitProgram", headerName: "단위사업명", width: 180 },
    { field: "subProgram", headerName: "세부사업명", width: 180 },
    { field: "name", headerName: "이용자명", width: 140 },
    { field: "gender", headerName: "성별", width: 100 },
    { field: "phone", headerName: "연락처", width: 150 },
    { field: "birthdate", headerName: "생년월일", width: 140 },
    { field: "ageGroup", headerName: "연령대", width: 100 },
    { field: "address", headerName: "거주지", width: 180 },
    { field: "incomeType", headerName: "소득구분", width: 140 },
    { field: "disability", headerName: "장애유무", width: 120 },
    { field: "paidType", headerName: "유료/무료", width: 120 },
    { field: "status", headerName: "이용상태", width: 120 },
    {
      field: "actions",
      headerName: "삭제",
      width: 100,
      sortable: false,
      filterable: false,
      align: "center",
      renderCell: (params) => {
        const row = params.row;
        const deletable = isDeletableRole && (typeof canDelete === "function" ? canDelete(row) : true);
        return (
          <Button
            color="error"
            size="small"
            onClick={() => onDelete?.(row.id || row.userId)}
            sx={{ minWidth: 0, padding: "4px 8px" }}
            disabled={!deletable}
          >
            삭제
          </Button>
        );
      }
    }
  ];

  return (
    <Box sx={{ width: "100%", overflowX: "auto" }}>
      <Box sx={{ height: "60vh", minWidth: 1600 }}>
        <DataGrid
          rows={members}
          columns={columns}
          getRowId={(row) => row.id || row.userId || `${row.name}-${row.phone}`}
          pageSize={10}
          checkboxSelection={isDeletableRole}
          disableSelectionOnClick
          selectionModel={selectionModel}
          onSelectionModelChange={(newSelection) => setSelectionModel(newSelection)}
          sx={{
            "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f5f5f5" },
            mb: 2
          }}
        />
      </Box>

      {isDeletableRole && selectionModel.length > 0 && (
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            if (
              window.confirm(`선택한 ${selectionModel.length}명을 삭제하시겠습니까?`)
            ) {
              onBulkDelete(selectionModel);
              setSelectionModel([]);
            }
          }}
        >
          선택 삭제 ({selectionModel.length}명)
        </Button>
      )}
    </Box>
  );
}

export default SubProgramMemberTable;