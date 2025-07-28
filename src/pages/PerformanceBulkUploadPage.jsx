import React, { useEffect, useState } from "react";
import PerformanceBulkUploadForm from "../components/PerformanceBulkUploadForm";
import PerformanceBulkUploadTable from "../components/PerformanceBulkUploadTable";
import {
  Box,
  Typography,
  Stack,
  Button,
  Alert,
  Card,
  CardContent,
  Chip,
  Container,
  Fade,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Grid,
  useMediaQuery,
  useTheme,
  LinearProgress,
  Breadcrumbs,
  Link,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Autocomplete
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Analytics as StatsIcon,
  GetApp as DownloadIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Info as InfoIcon,
  Home as HomeIcon,
  Assessment as AssessmentIcon,
  Close as CloseIcon
} from "@mui/icons-material";
import { fetchPerformanceStats } from "../services/performanceStatsAPI";
import {
  fetchBulkPerformances,
  deletePerformance,
  deleteMultiplePerformances,
  savePerformance,
  updatePerformance
} from "../services/attendancePerformanceAPI";
import { getAllTeamSubProgramMaps } from "../services/teamSubProgramMapAPI";
import { useStats } from "../contexts/StatsContext";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import useSnackbar from "../components/useSnackbar";

// ✅ 완전히 개선된 모달 컴포넌트 - 드롭다운 UI 개선 및 기능 완벽 보존
function PerformanceEditModal({ open, onClose, onSave, initialData }) {
  const [form, setForm] = React.useState({
    날짜: "",
    세부사업명: "",
    단위사업명: "",
    기능: "",
    팀명: "",
    등록인원: 0,
    실인원: 0,
    연인원: 0,
    건수: 0,
    비고: ""
  });

  const [errors, setErrors] = React.useState({});
  const [mappingData, setMappingData] = React.useState([]);
  const [filteredOptions, setFilteredOptions] = React.useState({
    teams: [],
    units: [],
    subPrograms: [],
    functions: []
  });
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // 매핑 데이터 로드
  React.useEffect(() => {
    const loadMappingData = async () => {
      try {
        const data = await getAllTeamSubProgramMaps();
        setMappingData(data);
        
        const uniqueTeams = [...new Set(data.map(item => item.teamName))].filter(Boolean);
        setFilteredOptions(prev => ({ ...prev, teams: uniqueTeams }));
      } catch (error) {
        console.error("매핑 데이터 로드 오류:", error);
      }
    };
    
    if (open) {
      loadMappingData();
    }
  }, [open]);

  // 초기 데이터 설정
  React.useEffect(() => {
    if (initialData) {
      setForm({
        ...initialData,
        등록인원: initialData.등록인원 || 0,
        실인원: initialData.실인원 || 0,
        연인원: initialData.연인원 || 0,
        건수: initialData.건수 || 0
      });
    } else {
      setForm({
        날짜: "",
        세부사업명: "",
        단위사업명: "",
        기능: "",
        팀명: "",
        등록인원: 0,
        실인원: 0,
        연인원: 0,
        건수: 0,
        비고: ""
      });
    }
  }, [initialData, open]);

  // 팀명 변경 시 단위사업명 옵션 업데이트
  React.useEffect(() => {
    if (form.팀명) {
      const teamMappings = mappingData.filter(item => item.teamName === form.팀명);
      const uniqueUnits = [...new Set(teamMappings.map(item => item.mainProgramName))].filter(Boolean);
      setFilteredOptions(prev => ({ ...prev, units: uniqueUnits }));
      
      if (form.단위사업명 && !uniqueUnits.includes(form.단위사업명)) {
        setForm(prev => ({ ...prev, 단위사업명: "", 세부사업명: "", 기능: "" }));
      }
    } else {
      setFilteredOptions(prev => ({ ...prev, units: [], subPrograms: [], functions: [] }));
    }
  }, [form.팀명, mappingData]);

  // 단위사업명 변경 시 세부사업명 옵션 업데이트
  React.useEffect(() => {
    if (form.팀명 && form.단위사업명) {
      const unitMappings = mappingData.filter(
        item => item.teamName === form.팀명 && item.mainProgramName === form.단위사업명
      );
      const uniqueSubPrograms = [...new Set(unitMappings.map(item => item.subProgramName))].filter(Boolean);
      setFilteredOptions(prev => ({ ...prev, subPrograms: uniqueSubPrograms }));
      
      if (form.세부사업명 && !uniqueSubPrograms.includes(form.세부사업명)) {
        setForm(prev => ({ ...prev, 세부사업명: "", 기능: "" }));
      }
    } else {
      setFilteredOptions(prev => ({ ...prev, subPrograms: [], functions: [] }));
    }
  }, [form.팀명, form.단위사업명, mappingData]);

  // 세부사업명 변경 시 기능 옵션 업데이트
  React.useEffect(() => {
    if (form.팀명 && form.단위사업명 && form.세부사업명) {
      const subProgramMappings = mappingData.filter(
        item => 
          item.teamName === form.팀명 && 
          item.mainProgramName === form.단위사업명 && 
          item.subProgramName === form.세부사업명
      );
      const uniqueFunctions = [...new Set(subProgramMappings.map(item => item.functionType))].filter(Boolean);
      setFilteredOptions(prev => ({ ...prev, functions: uniqueFunctions }));
      
      if (form.기능 && !uniqueFunctions.includes(form.기능)) {
        setForm(prev => ({ ...prev, 기능: "" }));
      }
    } else {
      setFilteredOptions(prev => ({ ...prev, functions: [] }));
    }
  }, [form.팀명, form.단위사업명, form.세부사업명, mappingData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleAutocompleteChange = (name) => (event, newValue) => {
    setForm(prev => ({ ...prev, [name]: newValue || "" }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.세부사업명) newErrors.세부사업명 = "세부사업명은 필수입니다.";
    if (!form.날짜) newErrors.날짜 = "날짜는 필수입니다.";
    if (form.등록인원 < 0) newErrors.등록인원 = "등록인원은 0 이상이어야 합니다.";
    if (form.실인원 < 0) newErrors.실인원 = "실인원은 0 이상이어야 합니다.";
    if (form.연인원 < 0) newErrors.연인원 = "연인원은 0 이상이어야 합니다.";
    if (form.건수 < 0) newErrors.건수 = "건수는 0 이상이어야 합니다.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    onSave({ ...form, 실적유형: "대량" });
  };

  const handleClose = React.useCallback(() => {
    if (typeof onClose === 'function') {
      onClose();
    }
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      disableEscapeKeyDown={false}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          minHeight: isMobile ? '100vh' : '600px',
          maxHeight: isMobile ? '100vh' : '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <AddIcon />
            <Typography variant="h6" component="div">
              {initialData ? "실적 수정" : "실적 직접 추가"}
            </Typography>
          </Stack>
          
          <Button
            onClick={handleClose}
            sx={{ 
              minWidth: 'auto',
              color: 'white',
              p: 1,
              borderRadius: 2,
              '&:hover': { 
                backgroundColor: 'rgba(255,255,255,0.1)',
                transform: 'scale(1.05)'
              }
            }}
          >
            <CloseIcon />
          </Button>
        </Stack>
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2, px: 3 }}>
        <Grid container spacing={3}>
          {/* 날짜 필드 개선 */}
<Grid item xs={12} sm={6}>
  <TextField
    name="날짜"
    label="날짜"
    type="date"
    value={form.날짜}
    onChange={handleChange}
    fullWidth
    size="medium"
    error={!!errors.날짜}
    helperText={errors.날짜}
    InputLabelProps={{
      shrink: true,
      sx: { fontSize: '1rem', fontWeight: 500 }
    }}
    InputProps={{
      sx: {
        fontSize: '1rem',
        '& input': {
          padding: '12px 14px', // 패딩 증가로 클릭 영역 확대
          fontSize: '1rem',
          minWidth: '140px' // 최소 너비 보장
        }
      }
    }}
    sx={{
      '& .MuiFormLabel-root': {
        fontSize: '1rem'
      },
      '& .MuiInputBase-root': {
        minHeight: 56 // 높이 보장
      }
    }}
  />
</Grid>

          {/* ✅ 완전히 수정된 팀명 드롭다운 */}
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={filteredOptions.teams}
              value={form.팀명 || null}
              onChange={handleAutocompleteChange("팀명")}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="팀명"
                  error={!!errors.팀명}
                  helperText={errors.팀명}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              )}
              // ✅ PaperProps 제거하고 slotProps 사용
              slotProps={{
                paper: {
                  sx: {
                    borderRadius: 2,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    border: '1px solid',
                    borderColor: 'divider',
                    maxHeight: 300, // 최대 높이 제한
                    '& .MuiAutocomplete-listbox': {
                      maxHeight: 250, // 리스트박스 높이 제한
                      '& .MuiAutocomplete-option': {
                        minHeight: 48,
                        fontSize: '0.95rem',
                        padding: '8px 16px',
                        '&[aria-selected="true"]': {
                          backgroundColor: 'primary.light',
                          color: 'primary.contrastText'
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'action.hover'
                        }
                      }
                    }
                  }
                },
                popper: {
                  placement: 'bottom-start',
                  sx: {
                    zIndex: 1300 // 모달보다 위에 표시
                  }
                }
              }}
              size="medium"
              freeSolo
              clearOnEscape
              disablePortal={false}
            />
          </Grid>

          {/* ✅ 완전히 수정된 단위사업명 드롭다운 */}
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={filteredOptions.units}
              value={form.단위사업명 || null}
              onChange={handleAutocompleteChange("단위사업명")}
              disabled={!form.팀명}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="단위사업명"
                  error={!!errors.단위사업명}
                  helperText={errors.단위사업명 || (form.팀명 ? "" : "팀명을 먼저 선택하세요")}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              )}
              slotProps={{
                paper: {
                  sx: {
                    borderRadius: 2,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    border: '1px solid',
                    borderColor: 'divider',
                    maxHeight: 300,
                    '& .MuiAutocomplete-listbox': {
                      maxHeight: 250,
                      '& .MuiAutocomplete-option': {
                        minHeight: 48,
                        fontSize: '0.95rem',
                        padding: '8px 16px',
                        '&[aria-selected="true"]': {
                          backgroundColor: 'primary.light',
                          color: 'primary.contrastText'
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'action.hover'
                        }
                      }
                    }
                  }
                },
                popper: {
                  placement: 'bottom-start',
                  sx: {
                    zIndex: 1300
                  }
                }
              }}
              size="medium"
              freeSolo
              clearOnEscape
              disablePortal={false}
            />
          </Grid>

          {/* ✅ 완전히 수정된 세부사업명 드롭다운 */}
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={filteredOptions.subPrograms}
              value={form.세부사업명 || null}
              onChange={handleAutocompleteChange("세부사업명")}
              disabled={!form.단위사업명}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="세부사업명"
                  error={!!errors.세부사업명}
                  helperText={errors.세부사업명 || (form.단위사업명 ? "" : "단위사업명을 먼저 선택하세요")}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              )}
              slotProps={{
                paper: {
                  sx: {
                    borderRadius: 2,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    border: '1px solid',
                    borderColor: 'divider',
                    maxHeight: 300,
                    '& .MuiAutocomplete-listbox': {
                      maxHeight: 250,
                      '& .MuiAutocomplete-option': {
                        minHeight: 48,
                        fontSize: '0.95rem',
                        padding: '8px 16px',
                        '&[aria-selected="true"]': {
                          backgroundColor: 'primary.light',
                          color: 'primary.contrastText'
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'action.hover'
                        }
                      }
                    }
                  }
                },
                popper: {
                  placement: 'bottom-start',
                  sx: {
                    zIndex: 1300
                  }
                }
              }}
              size="medium"
              freeSolo
              clearOnEscape
              disablePortal={false}
            />
          </Grid>

          {/* ✅ 완전히 수정된 기능 드롭다운 */}
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={filteredOptions.functions}
              value={form.기능 || null}
              onChange={handleAutocompleteChange("기능")}
              disabled={!form.세부사업명}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="기능"
                  error={!!errors.기능}
                  helperText={errors.기능 || (form.세부사업명 ? "" : "세부사업명을 먼저 선택하세요")}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              )}
              slotProps={{
                paper: {
                  sx: {
                    borderRadius: 2,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    border: '1px solid',
                    borderColor: 'divider',
                    maxHeight: 300,
                    '& .MuiAutocomplete-listbox': {
                      maxHeight: 250,
                      '& .MuiAutocomplete-option': {
                        minHeight: 48,
                        fontSize: '0.95rem',
                        padding: '8px 16px',
                        '&[aria-selected="true"]': {
                          backgroundColor: 'primary.light',
                          color: 'primary.contrastText'
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'action.hover'
                        }
                      }
                    }
                  }
                },
                popper: {
                  placement: 'bottom-start',
                  sx: {
                    zIndex: 1300
                  }
                }
              }}
              size="medium"
              freeSolo
              clearOnEscape
              disablePortal={false}
            />
          </Grid>

          {/* 수치 입력 필드들 */}
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              label="등록인원"
              name="등록인원"
              type="number"
              value={form.등록인원}
              onChange={handleChange}
              error={!!errors.등록인원}
              helperText={errors.등록인원}
              inputProps={{ min: 0 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>

          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              label="실인원"
              name="실인원"
              type="number"
              value={form.실인원}
              onChange={handleChange}
              error={!!errors.실인원}
              helperText={errors.실인원}
              inputProps={{ min: 0 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>

          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              label="연인원"
              name="연인원"
              type="number"
              value={form.연인원}
              onChange={handleChange}
              error={!!errors.연인원}
              helperText={errors.연인원}
              inputProps={{ min: 0 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>

          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              label="건수"
              name="건수"
              type="number"
              value={form.건수}
              onChange={handleChange}
              error={!!errors.건수}
              helperText={errors.건수}
              inputProps={{ min: 0 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>

          {/* 비고 */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="비고"
              name="비고"
              value={form.비고}
              onChange={handleChange}
              multiline
              rows={3}
              placeholder="추가 정보를 입력하세요..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button 
          onClick={handleClose}
          variant="outlined"
          size="large"
          sx={{ 
            flex: isMobile ? 1 : 'auto',
            borderRadius: 2,
            minWidth: 120
          }}
        >
          취소
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          size="large"
          sx={{ 
            flex: isMobile ? 1 : 'auto',
            borderRadius: 2,
            minWidth: 120,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
            }
          }}
        >
          {initialData ? "수정" : "추가"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function PerformanceBulkUploadPage() {
  const { stats, setStats, filters, setFilters } = useStats();
  const [performances, setPerformances] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editRow, setEditRow] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [showUploadResult, setShowUploadResult] = useState(false);
  const navigate = useNavigate();
  const [SnackbarComp, showSnackbar] = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // ✅ 오류 수정: 데이터 표시 문제 완전 해결 - 필터링 로직 수정
  const bulkPerformances = React.useMemo(() => {
    console.log("📊 전체 performances 데이터:", performances);
    
    // ✅ 수정된 필터링 로직 - 변수명 오류 해결
    const filtered = performances.filter(p => {
      const isBulkType = p.실적유형 === "대량" || 
                         p.performanceType === "대량" || 
                         (p.실적유형 !== "개별" && 
                          p.performanceType !== "개별" && 
                          !p.이용자명 && 
                          !p.고유아이디); // 이용자명이 없는 것도 대량실적으로 간주
      
      console.log("📊 실적 항목:", {
        id: p.id,
        실적유형: p.실적유형,
        performanceType: p.performanceType,
        세부사업명: p.세부사업명,
        이용자명: p.이용자명,
        isBulkType: isBulkType // ✅ 변수명 수정
      });
      
      return isBulkType; // ✅ 올바른 변수명 사용
    });
    
    console.log("📊 필터링된 대량실적:", filtered);
    return filtered;
  }, [performances]);

  const steps = [
    { label: '파일 준비', description: '업로드할 실적 파일을 준비합니다.' },
    { label: '파일 업로드', description: '실적 데이터를 시스템에 업로드합니다.' },
    { label: '데이터 검증', description: '업로드된 데이터를 검증합니다.' },
    { label: '결과 확인', description: '업로드 결과를 확인하고 관리합니다.' }
  ];

  // ✅ 대량실적 로드 함수 개선 - 더 안전한 데이터 처리
  const loadBulkPerformances = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("📊 대량실적 조회 시작...");
      const list = await fetchBulkPerformances();
      console.log("📊 API 응답 데이터:", list);
      
      // 데이터가 없는 경우 빈 배열로 설정
      const safeList = Array.isArray(list) ? list : [];
      setPerformances(safeList);
      
      console.log("📊 설정된 performances:", safeList);
      
      if (safeList.length > 0) {
        setActiveStep(3); // 결과 확인 단계로 이동
      } else {
        setActiveStep(0); // 파일 준비 단계로 이동
      }
    } catch (err) {
      console.error("📊 대량실적 조회 오류:", err);
      setError("대량실적 조회 실패: " + err.message);
      setPerformances([]); // 오류 시 빈 배열로 설정
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBulkPerformances();
  }, []);

  const handleSyncStats = async () => {
    try {
      const updatedStats = await fetchPerformanceStats(filters);
      setStats(updatedStats);
      showSnackbar("통계가 동기화되었습니다.", "success");
    } catch (err) {
      showSnackbar("통계 동기화 실패: " + err.message, "error");
    }
  };

  const handleDeleteAllUploadedPerformances = async () => {
    if (!window.confirm("정말로 업로드된 대량실적을 모두 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) return;
    
    setLoading(true);
    try {
      const bulkIds = bulkPerformances.map(p => p.id);
      if (bulkIds.length === 0) {
        showSnackbar("삭제할 대량실적이 없습니다.", "info");
        setLoading(false);
        return;
      }
      
      const result = await deleteMultiplePerformances(bulkIds);
      if (result.failed.length === 0) {
        showSnackbar("✅ 삭제 완료: 업로드된 대량실적이 모두 삭제되었습니다.", "success");
        await loadBulkPerformances();
        await handleSyncStats();
        setActiveStep(0); // 파일 준비 단계로 돌아가기
      } else {
        showSnackbar("❌ 일부 삭제 실패: " + result.failed.map(f => f.error).join(", "), "error");
      }
    } catch (err) {
      showSnackbar("⚠️ 오류 발생: " + err.message, "error");
    }
    setLoading(false);
  };

  const handleEdit = (row) => {
    console.log("📊 수정할 데이터:", row);
    setEditRow(row);
  };

  const handleDelete = async (row) => {
    if (!window.confirm("정말로 삭제하시겠습니까?")) return;
    try {
      await deletePerformance(row.id);
      await loadBulkPerformances();
      showSnackbar("삭제 완료", "success");
    } catch (err) {
      showSnackbar("삭제 실패: " + err.message, "error");
    }
  };

  const handleSelect = (id, checked) => {
    setSelectedIds(prev =>
      checked ? [...prev, id] : prev.filter(_id => _id !== id)
    );
  };

  const handleSelectAll = (checked) => {
    const bulkIds = bulkPerformances.map(p => p.id);
    setSelectedIds(checked ? bulkIds : []);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`정말로 선택된 ${selectedIds.length}건을 삭제하시겠습니까?`)) return;

    try {
      await deleteMultiplePerformances(selectedIds);
      setSelectedIds([]);
      await loadBulkPerformances();
      showSnackbar(`${selectedIds.length}건 삭제 완료`, "success");
    } catch (err) {
      showSnackbar("일괄 삭제 실패: " + err.message, "error");
    }
  };

  const handleAddSave = async (data) => {
    try {
      console.log("📊 추가할 데이터:", data);
      await savePerformance({ ...data, 실적유형: "대량" });
      setAddOpen(false);
      await loadBulkPerformances();
      showSnackbar("대량실적 추가 완료", "success");
    } catch (err) {
      console.error("📊 추가 오류:", err);
      showSnackbar("추가 실패: " + err.message, "error");
    }
  };

  const handleEditSave = async (data) => {
    try {
      console.log("📊 수정할 데이터:", data);
      await updatePerformance(data.id, { ...data, 실적유형: "대량" });
      setEditRow(null);
      await loadBulkPerformances();
      showSnackbar("대량실적 수정 완료", "success");
    } catch (err) {
      console.error("📊 수정 오류:", err);
      showSnackbar("수정 실패: " + err.message, "error");
    }
  };

  const handleUploadSuccess = async (uploadedData, result) => {
  console.log("📥 업로드 완료, 데이터 갱신 시작...", uploadedData, result);
  
  // ✅ 성공/실패 결과 모두 표시
  const isSuccess = result?.added > 0;
  const message = result 
    ? `✅ 성공: ${result.added}건 / ❌ 실패: ${result.failed}건`
    : `${uploadedData?.length || 0}건의 대량실적이 업로드되었습니다.`;
  
  setUploadResult({
    success: isSuccess,
    total: (result?.added || 0) + (result?.failed || 0),
    added: result?.added || 0,
    failed: result?.failed || 0,
    message: message
  });
  setShowUploadResult(true);
  
  await loadBulkPerformances();
  await handleSyncStats();
  setUploadOpen(false);
  setActiveStep(3);
  showSnackbar(message, isSuccess ? "success" : "warning");
};

  const getStepIcon = (stepIndex) => {
    switch (stepIndex) {
      case 0: return <InfoIcon />;
      case 1: return <UploadIcon />;
      case 2: return <WarningIcon />;
      case 3: return <SuccessIcon />;
      default: return <InfoIcon />;
    }
  };

  // ✅ 업로드 모달 닫기 함수 완전 수정
  const handleUploadClose = React.useCallback(() => {
    setUploadOpen(false);
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {SnackbarComp}
      
      {/* 브레드크럼 네비게이션 */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link 
          underline="hover" 
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          홈
        </Link>
        
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <UploadIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          대량 실적 업로드
        </Typography>
      </Breadcrumbs>

      {/* 헤더 섹션 */}
      <Paper 
        elevation={0} 
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          p: 4,
          mb: 4,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ 
          position: 'absolute', 
          top: -50, 
          right: -50, 
          width: 200, 
          height: 200, 
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          display: { xs: 'none', md: 'block' }
        }} />
        
        <Stack direction={isMobile ? "column" : "row"} alignItems="center" spacing={3}>
          <Box sx={{ 
            p: 2, 
            borderRadius: 2, 
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <UploadIcon sx={{ fontSize: 40 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h3" component="h1" sx={{ 
              fontWeight: 700, 
              mb: 1,
              fontSize: { xs: '1.75rem', sm: '2.5rem' }
            }}>
              대량 실적 업로드
            </Typography>
            <Typography variant="h6" sx={{ 
              opacity: 0.9,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}>
              엑셀 파일을 통해 실적 데이터를 일괄 등록하고 관리할 수 있습니다
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Chip 
              icon={<InfoIcon />}
              label={`총 ${bulkPerformances.length}건`}
              sx={{ 
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 600
              }}
            />
            {selectedIds.length > 0 && (
              <Chip 
                icon={<SuccessIcon />}
                label={`선택 ${selectedIds.length}건`}
                sx={{ 
                  background: 'rgba(76, 175, 80, 0.8)',
                  color: 'white',
                  fontWeight: 600
                }}
              />
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* 에러 알림 */}
      {error && (
        <Fade in={!!error}>
          <Alert 
            severity="error" 
            sx={{ mb: 3, borderRadius: 2 }}
            action={
              <Button color="inherit" size="small" onClick={() => setError("")}>
                닫기
              </Button>
            }
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              오류가 발생했습니다
            </Typography>
            {error}
          </Alert>
        </Fade>
      )}

      {/* 로딩 표시 */}
      {loading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress 
            sx={{ 
              borderRadius: 1,
              height: 6,
              background: 'rgba(0,0,0,0.1)'
            }} 
          />
        </Box>
      )}

      {/* 메인 컨텐츠 */}
      <Grid container spacing={3}>
        {/* 좌측: 진행 단계 */}
        {!isMobile && (
          <Grid item xs={12} md={4}>
            <Card sx={{ height: 'fit-content', borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  업로드 진행 단계
                </Typography>
                <Stepper activeStep={activeStep} orientation="vertical">
                  {steps.map((step, index) => (
                    <Step key={step.label}>
                      <StepLabel 
                        icon={getStepIcon(index)}
                        sx={{ 
                          '& .MuiStepLabel-label': { 
                            fontWeight: index === activeStep ? 600 : 400 
                          }
                        }}
                      >
                        {step.label}
                      </StepLabel>
                      <StepContent>
                        <Typography variant="body2" color="text.secondary">
                          {step.description}
                        </Typography>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* 우측: 컨텐츠 영역 */}
        <Grid item xs={12} md={isMobile ? 12 : 8}>
          <Stack spacing={3}>
            {/* 액션 버튼 그룹 */}
            <Card sx={{ borderRadius: 2, overflow: 'visible' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  작업 메뉴
                </Typography>
                <Stack 
                  direction={isMobile ? "column" : "row"} 
                  spacing={2} 
                  sx={{ flexWrap: 'wrap' }}
                >
                  <Button
                    variant="contained"
                    startIcon={<UploadIcon />}
                    onClick={() => {
                      setUploadOpen(true);
                      setActiveStep(1);
                    }}
                    disabled={loading}
                    size="large"
                    sx={{ 
                      flex: isMobile ? 1 : 'auto',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: 2,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 16px rgba(102,126,234,0.3)'
                      }
                    }}
                  >
                    대량 실적 업로드
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setAddOpen(true)}
                    disabled={loading}
                    size="large"
                    sx={{ 
                      flex: isMobile ? 1 : 'auto',
                      borderRadius: 2,
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    실적 직접 추가
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteAllUploadedPerformances}
                    disabled={loading || bulkPerformances.length === 0}
                    color="error"
                    size="large"
                    sx={{ 
                      flex: isMobile ? 1 : 'auto',
                      borderRadius: 2,
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(244,67,54,0.2)'
                      }
                    }}
                  >
                    전체 삭제
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<StatsIcon />}
                    onClick={handleSyncStats}
                    disabled={loading}
                    size="large"
                    sx={{ 
                      flex: isMobile ? 1 : 'auto',
                      borderRadius: 2,
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    통계 동기화
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* ✅ 업로드 결과 표시 영역 추가 */}
{showUploadResult && uploadResult && (
  <Fade in={showUploadResult}>
    <Alert 
      severity={uploadResult.success ? "success" : "error"}
      sx={{ 
        mb: 2,
        borderRadius: 2,
        '& .MuiAlert-action': {
          alignItems: 'flex-start'
        }
      }}
      action={
        <Button 
          color="inherit" 
          size="small" 
          onClick={() => setShowUploadResult(false)}
          sx={{ mt: -0.5 }}
        >
          닫기
        </Button>
      }
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
        {uploadResult.success ? '✅ 업로드 완료' : '❌ 업로드 실패'}
      </Typography>
      <Typography variant="body2">
        {uploadResult.message}
      </Typography>
    </Alert>
  </Fade>
)}

{/* 업로드 결과 테이블 */}
<Card sx={{ borderRadius: 2 }}>
  <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                  <Stack 
                    direction={isMobile ? "column" : "row"} 
                    justifyContent="space-between" 
                    alignItems={isMobile ? "flex-start" : "center"}
                    spacing={2}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      업로드 결과 ({bulkPerformances.length}건)
                    </Typography>
                    {selectedIds.length > 0 && (
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleDeleteSelected}
                        size="small"
                        sx={{ borderRadius: 2 }}
                      >
                        선택 삭제 ({selectedIds.length})
                      </Button>
                    )}
                  </Stack>
                </Box>
{/* ✅ 스크롤 가능한 테이블 컨테이너 */}
    <Box sx={{ 
      width: '100%', 
      overflowX: 'auto',  // 가로 스크롤
      overflowY: 'auto',  // 세로 스크롤
      maxHeight: 600,     // 최대 높이
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2
    }}>
      <PerformanceBulkUploadTable
        data={bulkPerformances}
        selected={selectedIds}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSelect={handleSelect}
        onSelectAll={handleSelectAll}
        onDeleteSelected={handleDeleteSelected}
        onAdd={() => setAddOpen(true)}
        loading={loading}
      />
    </Box>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* ✅ 업로드 폼 모달 - 닫기 버튼 완전 수정 */}
      <Dialog 
        open={uploadOpen}
        onClose={handleUploadClose}
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
        disableEscapeKeyDown={false}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            minHeight: isMobile ? '100vh' : 'auto'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 1000
        }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <UploadIcon />
              <Typography variant="h6">대량 실적 업로드</Typography>
            </Stack>
            
            <Button
              onClick={handleUploadClose}
              sx={{ 
                minWidth: 'auto',
                color: 'white',
                p: 1,
                borderRadius: 2,
                '&:hover': { 
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  transform: 'scale(1.05)'
                }
              }}
            >
              <CloseIcon />
            </Button>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <PerformanceBulkUploadForm
            onSuccess={handleUploadSuccess}
            onCancel={handleUploadClose}
          />
        </DialogContent>
      </Dialog>

      {/* 실적 직접 추가 모달 */}
      <PerformanceEditModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleAddSave}
      />

      {/* 실적 수정 모달 */}
      <PerformanceEditModal
        open={!!editRow}
        onClose={() => setEditRow(null)}
        onSave={handleEditSave}
        initialData={editRow}
      />
    </Container>
  );
}

export default PerformanceBulkUploadPage;