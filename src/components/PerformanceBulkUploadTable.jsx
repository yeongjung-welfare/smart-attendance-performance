import React, { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Stack,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Collapse,
  Avatar,
  Fade,
  Alert
} from '@mui/material';
import { 
  DataGrid, 
  GridToolbar,
  GridToolbarContainer,
  GridToolbarQuickFilter,
  useGridApiContext
} from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  People as PeopleIcon,
  Event as EventIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { 
  GetApp as DownloadIcon 
} from '@mui/icons-material';
import { exportToExcel } from '../utils/exportToExcel';

  // ✅ 커스텀 툴바 컴포넌트 추가
function CustomToolbar({ data }) {
  const handleExcelExport = () => {
    if (!data || data.length === 0) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }
    
    // ✅ 컬럼 순서를 보장하는 데이터 재구성
    const orderedData = data.map(row => ({
  '날짜': row.날짜 || '',
  '팀명': row.팀명 || '',
  '기능': row.기능 || '',
  '단위사업명': row.단위사업명 || '',
  '세부사업명': row.세부사업명 || '', 
  '등록인원': row.등록인원 || 0,
  '실인원': row.실인원 || 0, 
  '연인원': row.연인원 || 0,
  '건수': row.건수 || 0,
  '비고': row.비고 || ''
}));
    
    exportToExcel({
      data: orderedData,  // ✅ 순서가 보장된 데이터
      fileName: `대량실적_${new Date().toISOString().split('T')[0]}`,
      sheetName: '실적데이터'
    });
  };

  return (
    <GridToolbarContainer>
      {/* 검색 필터 */}
      <GridToolbarQuickFilter 
        placeholder="실적 검색..."
        debounceMs={500}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2
          }
        }}
      />
      
      {/* 엑셀 내보내기 버튼 */}
      <Button
        startIcon={<DownloadIcon />}
        onClick={handleExcelExport}
        variant="outlined"
        size="small"
        sx={{ 
          ml: 2,
          borderRadius: 2,
          '&:hover': {
            transform: 'translateY(-1px)'
          }
        }}
      >
        엑셀 다운로드
      </Button>
    </GridToolbarContainer>
  );
}

// ✅ 모바일 카드 컴포넌트 개선
function MobilePerformanceCard({ row, selected, onSelect, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Fade in timeout={300}>
      <Card 
        sx={{ 
          mb: 2, 
          border: selected ? 2 : 1,
          borderColor: selected ? 'primary.main' : 'divider',
          borderRadius: 3,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: selected ? 6 : 4,
            transform: 'translateY(-2px)'
          }
        }}
      >
        <CardContent sx={{ p: 2 }}>
          {/* 헤더 */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Checkbox
                checked={selected}
                onChange={(e) => onSelect(row.id, e.target.checked)}
                size="small"
              />
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                <EventIcon fontSize="small" />
              </Avatar>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {row.날짜 || '-'}
              </Typography>
            </Stack>
            
            <Stack direction="row" spacing={0.5}>
              <IconButton size="small" onClick={() => onEdit(row)} sx={{ color: 'primary.main' }}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => onDelete(row)} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={() => setExpanded(!expanded)}
                sx={{ 
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s'
                }}
              >
                <ExpandMoreIcon />
              </IconButton>
            </Stack>
          </Stack>

          {/* 기본 정보 */}
          <Stack spacing={1}>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {row.세부사업명}
            </Typography>
            
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                icon={<PeopleIcon />}
                label={`실인원 ${row.실인원 || 0}`}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<AssessmentIcon />}
                label={`연인원 ${row.연인원 || 0}`}
                size="small"
                color="secondary"
                variant="outlined"
              />
            </Stack>
          </Stack>

          {/* 확장 정보 */}
          <Collapse in={expanded}>
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Stack spacing={1.5}>
                {row.단위사업명 && (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <BusinessIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      단위사업: {row.단위사업명}
                    </Typography>
                  </Stack>
                )}
                
                {row.기능 && (
                  <Typography variant="body2" color="text.secondary">
                    기능: {row.기능}
                  </Typography>
                )}
                
                {row.팀명 && (
                  <Typography variant="body2" color="text.secondary">
                    팀명: {row.팀명}
                  </Typography>
                )}

                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    등록인원: {row.등록인원 || 0}명
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    건수: {row.건수 || 0}건
                  </Typography>
                </Stack>

                {row.비고 && (
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    fontStyle: 'italic',
                    p: 1,
                    bgcolor: 'grey.50',
                    borderRadius: 1
                  }}>
                    비고: {row.비고}
                  </Typography>
                )}
              </Stack>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </Fade>
  );
}

function PerformanceBulkUploadTable({
  data = [],
  selected = [],
  onEdit,
  onDelete,
  onSelect,
  onSelectAll,
  onDeleteSelected,
  onAdd,
  loading = false
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const allChecked = data.length > 0 && selected.length === data.length;
  const someChecked = selected.length > 0 && !allChecked;

  // ✅ 데스크톱 테이블 컬럼 정의 개선
  const columns = [
    {
      field: 'actions',
      headerName: '작업',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="수정">
            <IconButton
              size="small"
              onClick={() => onEdit(params.row)}
              sx={{ color: 'primary.main' }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="삭제">
            <IconButton
              size="small"
              onClick={() => onDelete(params.row)}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
    {
      field: '날짜',
      headerName: '날짜',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: '세부사업명',
      headerName: '세부사업명',
      width: 200,
      flex: 1,
      renderCell: (params) => (
        <Tooltip title={params.value} placement="top-start">
          <Typography variant="body2" sx={{ 
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: 'primary.dark'
          }}>
            {params.value}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: '단위사업명',
      headerName: '단위사업명',
      width: 150,
      renderCell: (params) => (
        <Tooltip title={params.value || '미입력'}>
          <Typography variant="body2" color={params.value ? 'inherit' : 'text.disabled'}>
            {params.value || '-'}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: '기능',
      headerName: '기능',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value || '미지정'}
          size="small"
          color={params.value ? 'primary' : 'default'}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        />
      ),
    },
    {
      field: '팀명',
      headerName: '팀명',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: '등록인원',
      headerName: '등록인원',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip
          label={`${params.value || 0}명`}
          size="small"
          color="info"
          variant="filled"
          sx={{ borderRadius: 2, minWidth: 60 }}
        />
      ),
    },
    {
      field: '실인원',
      headerName: '실인원',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip
          label={`${params.value || 0}명`}
          size="small"
          color="primary"
          variant="filled"
          sx={{ borderRadius: 2, minWidth: 60 }}
        />
      ),
    },
    {
      field: '연인원',
      headerName: '연인원',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip
          label={`${params.value || 0}명`}
          size="small"
          color="secondary"
          variant="filled"
          sx={{ borderRadius: 2, minWidth: 60 }}
        />
      ),
    },
    {
      field: '건수',
      headerName: '건수',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {params.value || 0}건
        </Typography>
      ),
    },
    {
      field: '비고',
      headerName: '비고',
      width: 200,
      renderCell: (params) => (
        <Tooltip title={params.value || '비고 없음'}>
          <Typography 
            variant="body2" 
            color={params.value ? 'inherit' : 'text.disabled'}
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {params.value || '-'}
          </Typography>
        </Tooltip>
      ),
    },
  ];

  // ✅ 로딩 상태 개선
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: 300,
        gap: 3,
        p: 4
      }}>
        <CircularProgress size={60} thickness={4} />
        <Stack alignItems="center" spacing={1}>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
            대량실적을 불러오는 중...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            잠시만 기다려 주세요
          </Typography>
        </Stack>
      </Box>
    );
  }

  // ✅ 모바일 뷰 개선
  if (isMobile) {
    return (
      <Box sx={{ p: 3 }}>
        {/* 모바일 헤더 */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Stack>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              총 {data.length}건
            </Typography>
            {selected.length > 0 && (
              <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                선택됨 {selected.length}건
              </Typography>
            )}
          </Stack>
          
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={onAdd}
              size="small"
              sx={{ borderRadius: 2 }}
            >
              추가
            </Button>
            {selected.length > 0 && (
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={onDeleteSelected}
                size="small"
                sx={{ borderRadius: 2 }}
              >
                삭제
              </Button>
            )}
          </Stack>
        </Stack>

        {/* 전체 선택 */}
        <Stack direction="row" alignItems="center" sx={{ mb: 2, p: 1 }}>
          <Checkbox
            checked={allChecked}
            indeterminate={someChecked}
            onChange={(e) => onSelectAll(e.target.checked)}
          />
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            전체 선택
          </Typography>
        </Stack>

        {/* ✅ 모바일 카드 리스트 - 데이터 없을 때 처리 개선 */}
        {data.length > 0 ? (
          data.map((row) => (
            <MobilePerformanceCard
              key={row.id}
              row={row}
              selected={selected.includes(row.id)}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        ) : (
          <Card sx={{ borderRadius: 3, border: 1, borderColor: 'warning.main', borderStyle: 'dashed' }}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <WarningIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'warning.main' }}>
                업로드된 실적이 없습니다
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                상단의 "대량 실적 업로드" 버튼을 클릭하여 실적 파일을 업로드해보세요.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onAdd}
                sx={{ borderRadius: 2 }}
              >
                실적 직접 추가
              </Button>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  }

  // ✅ 데스크톱 뷰 완전 개선
  return (
    <Box sx={{ width: '100%' }}>
      {/* 데스크톱 헤더 */}
      <Stack 
        direction="row" 
        justifyContent="space-between" 
        alignItems="center" 
        sx={{ p: 3, pb: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={3}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            총 {data.length}건
          </Typography>
          {selected.length > 0 && (
            <Chip
              label={`선택됨 ${selected.length}건`}
              color="primary"
              size="small"
              sx={{ borderRadius: 2, fontWeight: 600 }}
            />
          )}
        </Stack>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={onAdd}
            sx={{ 
              borderRadius: 2,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
                transform: 'translateY(-1px)'
              }
            }}
          >
            실적 직접 추가
          </Button>
          {selected.length > 0 && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={onDeleteSelected}
              sx={{ 
                borderRadius: 2,
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 12px rgba(244,67,54,0.3)'
                }
              }}
            >
              선택 삭제 ({selected.length})
            </Button>
          )}
        </Stack>
      </Stack>

      {/* ✅ DataGrid - 데이터 표시 문제 완전 해결 */}
      <Box sx={{ 
  // height 제거 또는 minHeight로 변경
  minHeight: 300,
  maxHeight: 600, // 최대 높이 제한
  p: 3,
  pt: 1
}}>
  <DataGrid
  rows={data}
  columns={columns}
  getRowId={(row) => row.id}
  checkboxSelection
  autoHeight={false} // ✅ 변경: 고정 높이 사용
  height={600}       // ✅ 추가: 고정 높이 설정
  // ✅ 한국어 텍스트 추가
          localeText={{
            // 툴바
            toolbarColumns: '컬럼',
            toolbarFilters: '필터',
            toolbarDensity: '밀도',
            toolbarExport: '내보내기',
            
            // 필터
            filterPanelColumns: '컬럼',
            filterPanelOperator: '연산자',
            filterPanelValue: '값',
            filterOperatorContains: '포함',
            filterOperatorEquals: '같음',
            filterOperatorStartsWith: '시작',
            filterOperatorEndsWith: '끝',
            filterOperatorIsEmpty: '비어있음',
            filterOperatorIsNotEmpty: '비어있지않음',
            
            // 기타
            noRowsLabel: '데이터가 없습니다',
            footerRowSelected: (count) => `${count}개 행 선택됨`,
            footerTotalRows: '전체 행:',
            columnMenuLabel: '메뉴',
            columnMenuShowColumns: '컬럼 표시',
            columnMenuFilter: '필터',
            columnMenuHideColumn: '숨기기',
            columnMenuUnsort: '정렬 해제',
            columnMenuSortAsc: '오름차순',
            columnMenuSortDesc: '내림차순',
          }}
    onRowSelectionModelChange={(newSelection) => {
            const newSelectedIds = Array.from(newSelection);
            console.log("📊 DataGrid 선택 변경:", newSelectedIds); // 디버깅용
            
            if (newSelectedIds.length !== selected.length) {
              // 전체 선택/해제 처리
              if (newSelectedIds.length === data.length) {
                onSelectAll(true);
              } else if (newSelectedIds.length === 0) {
                onSelectAll(false);
              } else {
                // 개별 선택/해제 처리
                const added = newSelectedIds.filter(id => !selected.includes(id));
                const removed = selected.filter(id => !newSelectedIds.includes(id));
                
                added.forEach(id => onSelect(id, true));
                removed.forEach(id => onSelect(id, false));
              }
            }
          }}
          rowSelectionModel={selected}
          slots={{ 
            toolbar: () => <CustomToolbar data={data} />,
  noRowsOverlay: () => (
              <Stack height="100%" alignItems="center" justifyContent="center" spacing={3} sx={{ p: 4 }}>
                <WarningIcon sx={{ fontSize: 80, color: 'warning.main' }} />
                <Stack alignItems="center" spacing={2}>
                  <Typography variant="h5" color="warning.main" sx={{ fontWeight: 600 }}>
                    업로드된 실적이 없습니다
                  </Typography>
                  <Typography variant="body1" color="text.secondary" textAlign="center">
                    상단의 "대량 실적 업로드" 버튼을 클릭하여<br />
                    실적 파일을 업로드해보세요.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onAdd}
                    size="large"
                    sx={{ 
                      mt: 2,
                      borderRadius: 2,
                      px: 4,
                      py: 1.5
                    }}
                  >
                    실적 직접 추가
                  </Button>
                </Stack>
              </Stack>
            )
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: { sortModel: [{ field: '날짜', sort: 'desc' }] }
          }}
          sx={{
  border: 'none',
  borderRadius: 2,
  // ✅ 추가: 스크롤 관련 스타일
  height: 600,              // 고정 높이
  width: '100%',            // 전체 너비
  minWidth: 1200,           // 최소 너비 (가로 스크롤 활성화)
  '& .MuiDataGrid-root': {
    overflow: 'auto',       // 스크롤 활성화
  },
  '& .MuiDataGrid-virtualScrollerContent': {
    minWidth: 1200,         // 컨텐츠 최소 너비
  },
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: 'primary.50',
    color: 'primary.dark',
    fontWeight: 700,
    fontSize: '0.9rem',
    borderRadius: '8px 8px 0 0',
    position: 'sticky',     // ✅ 헤더 고정
    top: 0,
    zIndex: 1,
  },
  '& .MuiDataGrid-row': {
    '&:hover': {
      backgroundColor: 'action.hover',
      transform: 'scale(1.01)',
      transition: 'all 0.2s ease-in-out'
    },
    '&.Mui-selected': {
      backgroundColor: 'primary.50',
      '&:hover': {
        backgroundColor: 'primary.100'
      }
    }
  },
  '& .MuiDataGrid-cell': {
    borderColor: 'grey.200',
    fontSize: '0.9rem',
    whiteSpace: 'nowrap',   // ✅ 텍스트 줄바꿈 방지
  },
  '& .MuiDataGrid-columnSeparator': {
    display: 'none',
  },
  '& .MuiDataGrid-toolbarContainer': {
    padding: 3,
    paddingBottom: 2,
    borderBottom: 1,
    borderColor: 'grey.200',
    backgroundColor: 'grey.25',
    borderRadius: '8px 8px 0 0'
  },
  '& .MuiDataGrid-footerContainer': {
    borderTop: 1,
    borderColor: 'grey.200',
    backgroundColor: 'grey.25',
    borderRadius: '0 0 8px 8px'
  }
}}
          disableRowSelectionOnClick={false}
          density="comfortable"
          // ✅ 추가 성능 최적화 옵션
          disableColumnFilter={false}
          disableColumnSelector={false}
          disableDensitySelector={false}
          rowHeight={56}
        />
      </Box>
    </Box>
  );
}

export default PerformanceBulkUploadTable;