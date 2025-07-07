import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Stack, Box } from "@mui/material";

function MemberTable({ members, onEdit, onDelete }) {
  const columns = [
  { field: "id", headerName: "고유아이디", width: 230 },
  { field: "name", headerName: "이름", width: 100 },
  { field: "gender", headerName: "성별", width: 80 },
  { field: "birthdate", headerName: "생년월일", width: 110 },
  {
  field: "ageGroup",
  headerName: "나이",
  width: 80,
  valueGetter: (params) => {
    const birth = params.row?.birthdate;
    if (!birth) return ""; // 필드가 없으면 빈 문자열 반환

    try {
      const birthDate = new Date(birth);
      if (isNaN(birthDate)) return "";

      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return `${age}세`;
    } catch (e) {
      return "";
    }
  }
},
  { field: "phone", headerName: "연락처", width: 130 },
  { field: "address", headerName: "주소", width: 180 },
  { field: "district", headerName: "행정동", width: 110 },
  { field: "incomeType", headerName: "소득구분", width: 110 },
  {
    field: "actions",
    headerName: "관리",
    width: 160,
    renderCell: (params) => (
      <Stack direction="row" spacing={1}>
        <Button
          size="small"
          color="primary"
          onClick={() => onEdit?.(params.row)}
        >
          수정
        </Button>
        <Button
          size="small"
          color="error"
          onClick={() => onDelete(params.row.id)}
        >
          삭제
        </Button>
      </Stack>
    )
  }
];

  return (
    <Box sx={{ width: "100%", overflowX: "auto" }}>
      <Box sx={{ minWidth: 1200 }}> {/* 스크롤 유도 */}
        <DataGrid
          rows={members}
          columns={columns}
          pageSize={10}
          autoHeight
          getRowId={(row) => row.id}
          disableRowSelectionOnClick
        />
      </Box>
    </Box>
  );
}

export default MemberTable;