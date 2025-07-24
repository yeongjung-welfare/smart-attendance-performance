import React, { useState, useCallback } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Stack, Box, Typography, useMediaQuery, Skeleton, Checkbox } from "@mui/material";
import ExportButton from "./ExportButton";
import { normalizeDate, formatDateForDisplay, extractDateFromFirebase } from "../utils/dateUtils";
import { getAgeGroup } from "../utils/ageGroup";
import MemberServiceModal from "./MemberServiceModal";

function MemberTable({ members, onEdit, onDelete, loading = false, searchTerm = "" }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const isMobile = useMediaQuery("(max-width:600px)");
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [selectedMemberForService, setSelectedMemberForService] = useState(null);

  // ✅ 개선된 안전한 날짜 처리 함수
  const safeDateFormat = (dateValue) => {
    if (!dateValue) return "";
    
    try {
      // Firebase Timestamp 객체 처리
      if (dateValue && typeof dateValue.toDate === 'function') {
        return extractDateFromFirebase(dateValue);
      }
      
      // Date 객체 처리
      if (dateValue instanceof Date) {
        return formatDateForDisplay(dateValue);
      }
      
      // 문자열 처리
      if (typeof dateValue === 'string') {
        return normalizeDate(dateValue);
      }
      
      return "";
    } catch (error) {
      console.warn("날짜 변환 오류:", error, dateValue);
      return "";
    }
  };

  // ✅ ageGroup.js와 통일된 연령대 계산 함수
  const calculateAgeGroup = (birthdateValue) => {
    const birthDateStr = safeDateFormat(birthdateValue);
    if (!birthDateStr || birthDateStr.length < 4) return "미상";
    
    try {
      const birthYear = birthDateStr.substring(0, 4);
      return getAgeGroup(birthYear);
    } catch (e) {
      console.warn("연령대 계산 오류:", e, birthdateValue);
      return "미상";
    }
  };

  // ✅ 검색어 하이라이팅 함수
  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.toString().split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} style={{ backgroundColor: "#ffeb3b", fontWeight: "bold" }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // ✅ 모두 선택/해제 함수
  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === members.length) {
      // 모두 선택된 상태 → 모두 해제
      setSelectedIds([]);
    } else {
      // 일부 또는 아무것도 선택되지 않은 상태 → 모두 선택
      setSelectedIds(members.map(member => member.id));
    }
  }, [selectedIds.length, members]);

  // ✅ 개선된 삭제 처리 함수 - onDelete prop과 연결
  const handleDelete = useCallback((ids) => {
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
      // ✅ onDelete prop을 통해 삭제 실행
      onDelete(idList);
      // 삭제 후 선택 상태 초기화
      setSelectedIds(prev => prev.filter(id => !idList.includes(id)));
    }
  }, [onDelete]);

  // ✅ 모바일 컬럼 정의 (너비 증가)
  const mobileColumns = [
  {
    field: "name",
    headerName: "이름",
    width: 100,
    renderCell: (params) => (
      <div>{highlightSearchTerm(params.value, searchTerm)}</div>
    ),
  },
  { field: "gender", headerName: "성별", width: 70 },
  { 
    field: "birthdate", 
    headerName: "생년월일", 
    width: 110,
    renderCell: (params) => {
      const birthdateValue = params.row?.birthdate;
      
      if (!birthdateValue || birthdateValue === "" || birthdateValue === null) {
        return <div style={{ color: '#999', fontStyle: 'italic' }}>미입력</div>;
      }
      
      if (typeof birthdateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(birthdateValue)) {
        return <div>{birthdateValue}</div>;
      }
      
      const formattedDate = safeDateFormat(birthdateValue);
      return (
        <div style={{ color: formattedDate ? 'inherit' : '#999', fontStyle: formattedDate ? 'normal' : 'italic' }}>
          {formattedDate || "미입력"}
        </div>
      );
    }
  },
  {
    field: "ageGroup",
    headerName: "연령대",
    width: 80,
    renderCell: (params) => {
      const ageGroupValue = params.row?.ageGroup;
      const birthdateValue = params.row?.birthdate;
      
      if (ageGroupValue && ageGroupValue !== "" && ageGroupValue !== "미상") {
        return <div>{ageGroupValue}</div>;
      }
      
      const calculatedAgeGroup = calculateAgeGroup(birthdateValue);
      
      return (
        <div style={{ color: calculatedAgeGroup ? 'inherit' : '#999', fontStyle: calculatedAgeGroup ? 'normal' : 'italic' }}>
          {calculatedAgeGroup || "미상"}
        </div>
      );
    }
  },
  {
    field: "phone",
    headerName: "연락처",
    width: 120,
    renderCell: (params) => (
      <div>{highlightSearchTerm(params.value, searchTerm)}</div>
    ),
  },
  {
    field: "address",
    headerName: "주소",
    width: 150,
    renderCell: (params) => {
      const addressValue = params.row?.address;
      const isEmpty = !addressValue || addressValue === "";
      
      return (
        <div style={{ color: isEmpty ? '#999' : 'inherit', fontStyle: isEmpty ? 'italic' : 'normal' }}>
          {isEmpty ? "미입력" : highlightSearchTerm(addressValue, searchTerm)}
        </div>
      );
    },
  },
  { 
    field: "district", 
    headerName: "행정동", 
    width: 100,
    renderCell: (params) => {
      const districtValue = params.row?.district;
      const isEmpty = !districtValue || districtValue === "";
      
      return (
        <div style={{ color: isEmpty ? '#999' : 'inherit', fontStyle: isEmpty ? 'italic' : 'normal' }}>
          {isEmpty ? "미입력" : districtValue}
        </div>
      );
    }
  },
  { field: "incomeType", headerName: "소득구분", width: 90 },
  { 
    field: "disability", 
    headerName: "장애유무", 
    width: 80,
    renderCell: (params) => {
      const disabilityValue = params.row?.disability;
      const isEmpty = !disabilityValue || disabilityValue === "";
      
      return (
        <div style={{ color: isEmpty ? '#999' : 'inherit', fontStyle: isEmpty ? 'italic' : 'normal' }}>
          {isEmpty ? "미입력" : disabilityValue}
        </div>
      );
    }
  },
  {
    field: "actions",
    headerName: "관리",
    width: 180,
    sortable: false,
    renderCell: (params) => (
      <Stack direction="row" spacing={0.5}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => onEdit?.(params.row)}
          sx={{ minWidth: 'auto', fontSize: '0.7rem' }}
        >
          수정
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="error"
          onClick={() => handleDelete(params.row.id)}
          sx={{ minWidth: 'auto', fontSize: '0.7rem' }}
        >
          삭제
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="primary"
          onClick={() => handleViewServices(params.row)}
          sx={{ minWidth: 'auto', fontSize: '0.65rem' }}
        >
          서비스
        </Button>
      </Stack>
    ),
  },
];

  const handleViewServices = useCallback((member) => {
  setSelectedMemberForService(member);
  setServiceModalOpen(true);
}, []);

const handleCloseServiceModal = useCallback(() => {
  setServiceModalOpen(false);
  setSelectedMemberForService(null);
}, []);

  // ✅ 데스크톱 컬럼 정의 - 생년월일/연령대/주소/행정동 완전 수정
  const desktopColumns = [
    {
      field: "id",
      headerName: "고유아이디",
      width: 230,
      renderCell: (params) => (
        <div>{highlightSearchTerm(params.value, searchTerm)}</div>
      ),
    },
    {
      field: "name",
      headerName: "이름",
      width: 100,
      renderCell: (params) => (
        <div>{highlightSearchTerm(params.value, searchTerm)}</div>
      ),
    },
    { field: "gender", headerName: "성별", width: 80 },
    { 
      field: "birthdate", 
      headerName: "생년월일", 
      width: 120,
      renderCell: (params) => {
        const birthdateValue = params.row?.birthdate;
        
        console.log("🔍 생년월일 렌더링:", {
          원본: birthdateValue,
          타입: typeof birthdateValue,
          값존재: !!birthdateValue,
          길이: birthdateValue ? birthdateValue.length : 0
        });
        
        // 빈값이거나 null인 경우
        if (!birthdateValue || birthdateValue === "" || birthdateValue === null) {
          return <div style={{ color: '#999', fontStyle: 'italic' }}>미입력</div>;
        }
        
        // 이미 YYYY-MM-DD 형식인 경우 그대로 표시
        if (typeof birthdateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(birthdateValue)) {
          return <div>{birthdateValue}</div>;
        }
        
        // 다른 형식 처리
        const formattedDate = safeDateFormat(birthdateValue);
        return (
          <div style={{ color: formattedDate ? 'inherit' : '#999', fontStyle: formattedDate ? 'normal' : 'italic' }}>
            {formattedDate || "미입력"}
          </div>
        );
      }
    },
    {
      field: "ageGroup",
      headerName: "연령대",
      width: 110,
      renderCell: (params) => {
        const ageGroupValue = params.row?.ageGroup;
        const birthdateValue = params.row?.birthdate;
        
        console.log("🔍 연령대 렌더링:", {
          기존연령대: ageGroupValue,
          생년월일: birthdateValue,
          연령대존재: !!ageGroupValue && ageGroupValue !== ""
        });
        
        // 기존 연령대 데이터가 있고 빈값이 아닌 경우 사용
        if (ageGroupValue && ageGroupValue !== "" && ageGroupValue !== "미상") {
          return <div>{ageGroupValue}</div>;
        }
        
        // 생년월일로 계산
        const calculatedAgeGroup = calculateAgeGroup(birthdateValue);
        
        return (
          <div style={{ color: calculatedAgeGroup ? 'inherit' : '#999', fontStyle: calculatedAgeGroup ? 'normal' : 'italic' }}>
            {calculatedAgeGroup || "미상"}
          </div>
        );
      }
    },
    {
      field: "phone",
      headerName: "연락처",
      width: 130,
      renderCell: (params) => (
        <div>{highlightSearchTerm(params.value, searchTerm)}</div>
      ),
    },
    {
      field: "address",
      headerName: "주소",
      width: 200,
      renderCell: (params) => {
        const addressValue = params.row?.address;
        
        console.log("🏠 주소 렌더링:", {
          원본: addressValue,
          타입: typeof addressValue,
          값존재: !!addressValue
        });
        
        const isEmpty = !addressValue || addressValue === "";
        
        return (
          <div style={{ color: isEmpty ? '#999' : 'inherit', fontStyle: isEmpty ? 'italic' : 'normal' }}>
            {isEmpty ? "미입력" : highlightSearchTerm(addressValue, searchTerm)}
          </div>
        );
      },
    },
    { 
      field: "district", 
      headerName: "행정동", 
      width: 120,
      renderCell: (params) => {
        const districtValue = params.row?.district;
        
        console.log("🏘️ 행정동 렌더링:", {
          원본: districtValue,
          타입: typeof districtValue,
          값존재: !!districtValue
        });
        
        const isEmpty = !districtValue || districtValue === "";
        
        return (
          <div style={{ color: isEmpty ? '#999' : 'inherit', fontStyle: isEmpty ? 'italic' : 'normal' }}>
            {isEmpty ? "미입력" : districtValue}
          </div>
        );
      }
    },
    { field: "incomeType", headerName: "소득구분", width: 110 },
    { 
      field: "disability", 
      headerName: "장애유무", 
      width: 90,
      renderCell: (params) => {
        const disabilityValue = params.row?.disability;
        const isEmpty = !disabilityValue || disabilityValue === "";
        
        return (
          <div style={{ color: isEmpty ? '#999' : 'inherit', fontStyle: isEmpty ? 'italic' : 'normal' }}>
            {isEmpty ? "미입력" : disabilityValue}
          </div>
        );
      }
    },
    {
  field: "actions",
  headerName: "관리",
  width: 200, // 폭 증가
  sortable: false,
  renderCell: (params) => (
    <Stack direction="row" spacing={1}>
      <Button
        size="small"
        variant="outlined"
        onClick={() => onEdit?.(params.row)}
      >
        수정
      </Button>
      <Button
        size="small"
        variant="outlined"
        color="error"
        onClick={() => handleDelete(params.row.id)}
      >
        삭제
      </Button>
      <Button
        size="small"
        variant="outlined"
        color="primary"
        onClick={() => handleViewServices(params.row)}
        sx={{ fontSize: '0.75rem' }}
      >
        서비스
      </Button>
    </Stack>
  ),
},
  ];

  // ✅ 모든 선택 상태 계산
  const isAllSelected = selectedIds.length === members.length && members.length > 0;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < members.length;

  // ✅ 로딩 상태 처리
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  return (
    <Box>
      {/* ✅ 헤더 섹션 */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        전체 회원 목록 ({members.length}명)
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        {/* ✅ 모두 선택/해제 버튼 */}
        <Button
          variant={isAllSelected ? "contained" : "outlined"}
          onClick={handleSelectAll}
          disabled={members.length === 0}
        >
          {isAllSelected ? "모두 해제" : "모두 선택"}
        </Button>

        {/* ✅ 선택 삭제 버튼 */}
        <Button
          variant="outlined"
          color="error"
          onClick={() => {
            if (selectedIds.length > 0) {
              const confirmMessage = `선택한 ${selectedIds.length}명의 회원을 정말 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`;
              if (window.confirm(confirmMessage)) {
                handleDelete(selectedIds);
              }
            }
          }}
          disabled={selectedIds.length === 0}
        >
          선택 삭제 ({selectedIds.length})
        </Button>

        <ExportButton data={members} fileName="회원목록" />
      </Stack>

      {/* ✅ 선택 상태 표시 */}
      {selectedIds.length > 0 && (
        <Typography variant="body2" sx={{ mb: 2, color: "primary.main" }}>
          📋 {selectedIds.length}명이 선택되었습니다.
          {selectedIds.length === members.length && " (전체 선택됨)"}
        </Typography>
      )}

      {/* ✅ DataGrid - 모바일 스크롤 문제 해결 */}
      <DataGrid
        rows={members}
        columns={isMobile ? mobileColumns : desktopColumns}
        getRowId={(row) => row.id}
        checkboxSelection
        disableRowSelectionOnClick
        onRowSelectionModelChange={(newSelection) => {
          console.log("✅ 선택 변경:", newSelection);
          setSelectedIds(newSelection);
        }}
        rowSelectionModel={selectedIds}
        isRowSelectable={(params) => true}
        sx={{
          background: "#fff",
          fontSize: { xs: "0.92rem", sm: "1rem" },
          minHeight: 400,
          // 헤더 스타일
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#f5f5f5",
            fontWeight: 700,
            borderBottom: '2px solid #e0e0e0'
          },
          // 행 호버 효과
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "#f8f9fa"
          },
          // ✅ 모바일 스크롤 핵심 설정
          "& .MuiDataGrid-virtualScroller": {
            overflowX: "auto !important",
            overflowY: "auto !important"
          },
          "& .MuiDataGrid-main": {
            overflow: "visible"
          },
          "& .MuiDataGrid-columnHeadersInner": {
            minWidth: isMobile ? "900px" : "100%"
          },
          "& .MuiDataGrid-virtualScrollerContent": {
            minWidth: isMobile ? "900px" : "100%"
          },
          // 선택된 행 스타일
          "& .Mui-selected": {
            backgroundColor: "#e3f2fd !important",
          },
          "& .Mui-selected:hover": {
            backgroundColor: "#bbdefb !important",
          },
          // 체크박스 스타일
          "& .MuiDataGrid-checkboxInput": {
            color: '#1976d2'
          }
        }}
        autoHeight
        pageSizeOptions={[10, 25, 50, 100]}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 25 }
          }
        }}
        // ✅ 추가 스크롤 설정
        scrollbarSize={17}
        disableColumnResize={false}
        disableColumnMenu={false}
      />
      {/* 서비스 조회 모달 */}
      <MemberServiceModal
        open={serviceModalOpen}
        onClose={handleCloseServiceModal}
        member={selectedMemberForService}
      />
    </Box>
  );
}

export default MemberTable;