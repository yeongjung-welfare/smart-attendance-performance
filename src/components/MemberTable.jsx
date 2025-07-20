import React, { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Stack, Box, Typography, useMediaQuery, Skeleton } from "@mui/material";
import ExportButton from "./ExportButton";

function MemberTable({ members, onEdit, onDeleteMultiple, loading = false, searchTerm = "" }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const isMobile = useMediaQuery("(max-width:600px)");

  // ✅ 검색어 하이라이팅 함수
  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.toString().split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} style={{ backgroundColor: '#ffeb3b', fontWeight: 'bold' }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const handleDelete = (ids) => {
    let idList;
    if (ids && typeof ids === "object" && "ids" in ids) {
      // newSelection 형식({ type: 'include', ids: Set }) 처리
      idList = Array.from(ids.ids).filter(id => typeof id === "string" && id.length > 0);
    } else {
      // 일반 배열 또는 단일 ID 처리
      idList = Array.isArray(ids)
        ? ids
            .filter(Boolean)
            .map(item => (typeof item === "object" && item !== null ? item.id : item))
            .filter(id => typeof id === "string" && id.length > 0)
        : [ids].filter(id => typeof id === "string" && id.length > 0);
    }

    console.log("삭제 요청 ID:", idList);
    if (idList.length > 0) {
      onDeleteMultiple(idList);
    }
  };

  const mobileColumns = [
    { 
      field: "name", 
      headerName: "이름", 
      width: 90,
      renderCell: (params) => (
        <span>{highlightSearchTerm(params.value, searchTerm)}</span>
      )
    },
    { field: "gender", headerName: "성별", width: 60 },
    { 
      field: "phone", 
      headerName: "연락처", 
      width: 110,
      renderCell: (params) => (
        <span>{highlightSearchTerm(params.value, searchTerm)}</span>
      )
    },
    {
      field: "actions",
      headerName: "관리",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => onEdit?.(params.row)}>수정</Button>
          <Button size="small" onClick={() => handleDelete(params.row.id)}>삭제</Button>
        </Stack>
      )
    }
  ];

  const desktopColumns = [
    { 
      field: "id", 
      headerName: "고유아이디", 
      width: 230,
      renderCell: (params) => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>
          {highlightSearchTerm(params.value, searchTerm)}
        </span>
      )
    },
    { 
      field: "name", 
      headerName: "이름", 
      width: 100,
      renderCell: (params) => (
        <span style={{ fontWeight: 500 }}>
          {highlightSearchTerm(params.value, searchTerm)}
        </span>
      )
    },
    { field: "gender", headerName: "성별", width: 80 },
    { field: "birthdate", headerName: "생년월일", width: 110 },
    {
      field: "ageGroup",
      headerName: "연령대",
      width: 80,
      valueGetter: (params) => {
        const birth = params.row?.birthdate;
        if (!birth) return "";
        try {
          const birthDate = new Date(birth);
          if (isNaN(birthDate)) return "";
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          if (age < 10) return "0~9세";
          if (age < 20) return "10대";
          if (age < 30) return "20대";
          if (age < 40) return "30대";
          if (age < 50) return "40대";
          if (age < 60) return "50대";
          if (age < 70) return "60대";
          return "70세 이상";
        } catch (e) {
          return "";
        }
      }
    },
    { 
      field: "phone", 
      headerName: "연락처", 
      width: 130,
      renderCell: (params) => (
        <span>{highlightSearchTerm(params.value, searchTerm)}</span>
      )
    },
    { 
      field: "address", 
      headerName: "주소", 
      width: 180,
      renderCell: (params) => (
        <span>{highlightSearchTerm(params.value, searchTerm)}</span>
      )
    },
    { field: "district", headerName: "행정동", width: 110 },
    { field: "incomeType", headerName: "소득구분", width: 110 },
    { field: "disability", headerName: "장애유무", width: 90 },
    {
      field: "actions",
      headerName: "관리",
      width: 160,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => onEdit?.(params.row)}>수정</Button>
          <Button size="small" onClick={() => handleDelete(params.row.id)}>삭제</Button>
        </Stack>
      )
    }
  ];

  // ✅ 로딩 상태 처리
  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          전체 회원 목록 ({members.length}명)
        </Typography>
        <Stack direction="row" spacing={2}>
          <ExportButton
            data={members}
            fileName="전체_회원_목록.xlsx"
            label="엑셀 다운로드"
            headers={[
              ["고유아이디", "id"],
              ["이름", "name"],
              ["성별", "gender"],
              ["생년월일", "birthdate"],
              ["연락처", "phone"],
              ["주소", "address"],
              ["행정동", "district"],
              ["소득구분", "incomeType"],
              ["장애유무", "disability"]
            ]}
          />
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (selectedIds.length > 0) {
                handleDelete(selectedIds);
              }
            }}
            disabled={selectedIds.length === 0}
          >
            선택 삭제 ({selectedIds.length})
          </Button>
        </Stack>
      </Box>

      <DataGrid
        rows={members}
        columns={isMobile ? mobileColumns : desktopColumns}
        getRowId={(row) => row.id}
        checkboxSelection
        onRowSelectionModelChange={(newSelection) => {
          console.log("선택된 ID:", newSelection);
          const idsArray = Array.from(newSelection.ids || []);
          setSelectedIds(idsArray);
        }}
        selectionModel={selectedIds}
        isRowSelectable={(params) => true}
        sx={{
          background: "#fff",
          fontSize: { xs: "0.92rem", sm: "1rem" },
          "& .MuiDataGrid-columnHeaders": { 
            backgroundColor: "#f5f5f5", 
            fontWeight: 700 
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "#f8f9fa"
          }
        }}
        autoHeight
        pageSizeOptions={[10, 25, 50, 100]}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 25 }
          }
        }}
      />
    </Box>
  );
}

export default MemberTable;