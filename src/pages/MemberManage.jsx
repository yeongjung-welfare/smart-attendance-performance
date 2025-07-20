import React, { useEffect, useState, useMemo } from "react";
import {
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  IconButton,
  Box,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  InputAdornment,
  Collapse,
  Paper
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import MemberRegisterForm from "../components/MemberRegisterForm";
import MemberUploadForm from "../components/MemberUploadForm";
import MemberTable from "../components/MemberTable";
import useSnackbar from "../components/useSnackbar";
import {
  getAllMembers,
  registerMember,
  updateMember,
  deleteMember,
  checkDuplicateMember,
  updateMemberWithNonEmptyFields,
  searchMembers
} from "../services/memberAPI";

function MemberManage() {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [SnackbarComp, showSnackbar] = useSnackbar();
  
  // ✅ 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    gender: "",
    ageGroup: "",
    incomeType: "",
    disability: "",
    district: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  // ✅ 실시간 검색 및 필터링 로직
  const filteredAndSearchedMembers = useMemo(() => {
    let result = [...members];

    // 텍스트 검색 (이름, 연락처, 고유아이디, 주소)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      result = result.filter(member =>
        (member.name && member.name.toLowerCase().includes(searchLower)) ||
        (member.phone && member.phone.includes(searchTerm.trim())) ||
        (member.id && member.id.toLowerCase().includes(searchLower)) ||
        (member.userId && member.userId.toLowerCase().includes(searchLower)) ||
        (member.address && member.address.toLowerCase().includes(searchLower))
      );
    }

    // 고급 필터 적용
    if (filters.gender) {
      result = result.filter(member => member.gender === filters.gender);
    }
    if (filters.ageGroup) {
      result = result.filter(member => {
        const birth = member.birthdate;
        if (!birth) return false;
        
        try {
          const birthDate = new Date(birth);
          if (isNaN(birthDate)) return false;
          
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }

          const ageGroup = getAgeGroupFromAge(age);
          return ageGroup === filters.ageGroup;
        } catch (e) {
          return false;
        }
      });
    }
    if (filters.incomeType) {
      result = result.filter(member => member.incomeType === filters.incomeType);
    }
    if (filters.disability) {
      result = result.filter(member => member.disability === filters.disability);
    }
    if (filters.district) {
      result = result.filter(member =>
        member.district && member.district.includes(filters.district)
      );
    }

    return result;
  }, [members, searchTerm, filters]);

  useEffect(() => {
    setFilteredMembers(filteredAndSearchedMembers);
  }, [filteredAndSearchedMembers]);

  // ✅ 연령대 계산 함수
  const getAgeGroupFromAge = (age) => {
    if (age < 10) return "0~9세";
    if (age < 20) return "10대";
    if (age < 30) return "20대";
    if (age < 40) return "30대";
    if (age < 50) return "40대";
    if (age < 60) return "50대";
    if (age < 70) return "60대";
    return "70세 이상";
  };

  const loadMembers = async () => {
    try {
      setLoading(true);
      const all = await getAllMembers();
      console.log("로드된 회원 데이터:", all);
      setMembers(all);
      setFilteredMembers(all);
    } catch (error) {
      console.error("회원 목록 불러오기 오류:", error);
      showSnackbar("회원 목록 불러오기 실패", "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 검색어 변경 처리 (디바운싱 적용)
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // ✅ 필터 변경 처리
  const handleFilterChange = (filterKey) => (event) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: event.target.value
    }));
  };

  // ✅ 모든 필터 초기화
  const handleClearFilters = () => {
    setSearchTerm("");
    setFilters({
      gender: "",
      ageGroup: "",
      incomeType: "",
      disability: "",
      district: ""
    });
  };

  // ✅ 활성 필터 개수 계산
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count++;
    Object.values(filters).forEach(value => {
      if (value) count++;
    });
    return count;
  }, [searchTerm, filters]);

  // ✅ 등록 또는 수정 처리 (onRegister 통합)
  const handleRegister = async (member) => {
    const isEdit = !!selectedMember;
    
    try {
      if (isEdit) {
        console.log("✅ 회원 수정 진행:", selectedMember.id, member);
        await updateMember(selectedMember.id, member);
        showSnackbar("회원 정보 수정 완료", "success");
      } else {
        console.log("✅ 회원 신규 등록 진행:", member);
        const result = await registerMember(member);
        if (result.success) {
          showSnackbar("회원 등록 완료", "success");
        } else if (result.reason === "duplicate") {
          // 중복인 경우 업데이트 옵션 제공
          const updateConfirm = window.confirm(
            "이미 등록된 회원입니다. 기존 회원 정보를 업데이트 하시겠습니까?"
          );
          if (updateConfirm) {
            await updateMemberWithNonEmptyFields(member);
            showSnackbar("중복 회원 정보 업데이트 완료", "info");
          } else {
            return; // 사용자가 취소한 경우 모달을 닫지 않음
          }
        }
      }
      
      await loadMembers();
      setShowRegister(false);
      setSelectedMember(null);
    } catch (error) {
      console.error("회원 처리 오류:", error);
      showSnackbar(`처리 실패: ${error.message}`, "error");
    }
  };

  // ✅ 완전히 수정된 handleEdit 함수
  const handleEdit = (member) => {
    console.log("✅ 수정할 회원 데이터:", member);
    
    // ✅ 모든 필드를 완전하게 매핑하여 전달
    setSelectedMember({
      id: member.id,
      name: member.name || "",
      gender: member.gender || "",
      birthdate: member.birthdate || "",
      phone: member.phone || "",
      address: member.address || "",
      district: member.district || "",
      incomeType: member.incomeType || "일반",
      disability: member.disability || "",
      ageGroup: member.ageGroup || "",
      userId: member.userId || "",
      registrationDate: member.registrationDate || "",
      // 기타 모든 필드 보존
      ...member
    });
    setShowRegister(true);
  };

  const handleDelete = async (ids) => {
    const idList = Array.isArray(ids)
      ? ids
          .filter(Boolean)
          .map(item => (typeof item === "object" && item !== null ? item.id : item))
          .filter(id => typeof id === "string" && id.length > 0)
      : [ids].filter(id => typeof id === "string" && id.length > 0);

    console.log("삭제 요청 ID:", idList);

    if (!window.confirm(`정말 ${idList.length}명을 삭제하시겠습니까?`)) return;

    try {
      const result = await deleteMember(idList);
      console.log("삭제 결과:", result);
      await loadMembers();
      showSnackbar(`${result.deletedCount}명 삭제 완료`, "success");
    } catch (error) {
      console.error("삭제 실패 상세:", error);
      showSnackbar(`삭제에 실패했습니다: ${error.message}`, "error");
    }
  };

  const handleUpload = async () => {
    await loadMembers();
    showSnackbar("업로드 완료", "success");
    setShowUpload(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      {SnackbarComp}
      
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: "#333" }}>
        전체 회원 관리
      </Typography>

      {/* ✅ 검색 및 필터 섹션 */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, backgroundColor: "#f8f9fa" }}>
        <Grid container spacing={2} alignItems="center">
          {/* 통합 검색창 */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="이름, 연락처, 고유아이디, 주소로 검색..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm("")}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              variant="outlined"
            />
          </Grid>

          {/* 고급 필터 토글 버튼 */}
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              startIcon={<FilterListIcon />}
              endIcon={showAdvancedFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              fullWidth
            >
              고급 필터 {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
          </Grid>

          {/* 필터 초기화 버튼 */}
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              onClick={handleClearFilters}
              disabled={activeFiltersCount === 0}
              fullWidth
              color="secondary"
            >
              필터 초기화
            </Button>
          </Grid>
        </Grid>

        {/* ✅ 고급 필터 섹션 */}
        <Collapse in={showAdvancedFilters}>
          <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: "divider" }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>성별</InputLabel>
                  <Select
                    value={filters.gender}
                    onChange={handleFilterChange("gender")}
                    label="성별"
                  >
                    <MenuItem value="">전체</MenuItem>
                    <MenuItem value="남">남</MenuItem>
                    <MenuItem value="여">여</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>연령대</InputLabel>
                  <Select
                    value={filters.ageGroup}
                    onChange={handleFilterChange("ageGroup")}
                    label="연령대"
                  >
                    <MenuItem value="">전체</MenuItem>
                    <MenuItem value="0~9세">0~9세</MenuItem>
                    <MenuItem value="10대">10대</MenuItem>
                    <MenuItem value="20대">20대</MenuItem>
                    <MenuItem value="30대">30대</MenuItem>
                    <MenuItem value="40대">40대</MenuItem>
                    <MenuItem value="50대">50대</MenuItem>
                    <MenuItem value="60대">60대</MenuItem>
                    <MenuItem value="70세 이상">70세 이상</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>소득구분</InputLabel>
                  <Select
                    value={filters.incomeType}
                    onChange={handleFilterChange("incomeType")}
                    label="소득구분"
                  >
                    <MenuItem value="">전체</MenuItem>
                    <MenuItem value="일반">일반</MenuItem>
                    <MenuItem value="기초수급">기초수급</MenuItem>
                    <MenuItem value="차상위">차상위</MenuItem>
                    <MenuItem value="국가유공자">국가유공자</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>장애유무</InputLabel>
                  <Select
                    value={filters.disability}
                    onChange={handleFilterChange("disability")}
                    label="장애유무"
                  >
                    <MenuItem value="">전체</MenuItem>
                    <MenuItem value="무">무</MenuItem>
                    <MenuItem value="유">유</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="행정동"
                  value={filters.district}
                  onChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value }))}
                  placeholder="행정동명 입력"
                />
              </Grid>
            </Grid>

            {/* ✅ 활성 필터 표시 */}
            {activeFiltersCount > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  활성 필터:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {searchTerm.trim() && (
                    <Chip
                      label={`검색: "${searchTerm}"`}
                      onDelete={() => setSearchTerm("")}
                      size="small"
                      color="primary"
                    />
                  )}
                  {filters.gender && (
                    <Chip
                      label={`성별: ${filters.gender}`}
                      onDelete={() => setFilters(prev => ({ ...prev, gender: "" }))}
                      size="small"
                    />
                  )}
                  {filters.ageGroup && (
                    <Chip
                      label={`연령대: ${filters.ageGroup}`}
                      onDelete={() => setFilters(prev => ({ ...prev, ageGroup: "" }))}
                      size="small"
                    />
                  )}
                  {filters.incomeType && (
                    <Chip
                      label={`소득구분: ${filters.incomeType}`}
                      onDelete={() => setFilters(prev => ({ ...prev, incomeType: "" }))}
                      size="small"
                    />
                  )}
                  {filters.disability && (
                    <Chip
                      label={`장애유무: ${filters.disability}`}
                      onDelete={() => setFilters(prev => ({ ...prev, disability: "" }))}
                      size="small"
                    />
                  )}
                  {filters.district && (
                    <Chip
                      label={`행정동: ${filters.district}`}
                      onDelete={() => setFilters(prev => ({ ...prev, district: "" }))}
                      size="small"
                    />
                  )}
                </Stack>
              </Box>
            )}
          </Box>
        </Collapse>
      </Paper>

      {/* ✅ 검색 결과 요약 */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" color="text.secondary">
          전체 {members.length}명 중 {filteredMembers.length}명 표시
          {activeFiltersCount > 0 && ` (필터 ${activeFiltersCount}개 적용)`}
        </Typography>
      </Box>

      {/* 액션 버튼 */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          onClick={() => {
            setSelectedMember(null);
            setShowRegister(true);
          }}
        >
          회원 등록
        </Button>
        <Button
          variant="outlined"
          onClick={() => setShowUpload(true)}
        >
          대량 회원 업로드
        </Button>
      </Stack>

      {/* ✅ 개선된 테이블 (필터링된 데이터 전달) */}
      <MemberTable
        members={filteredMembers}
        onEdit={handleEdit}
        onDeleteMultiple={handleDelete}
        loading={loading}
        searchTerm={searchTerm} // 검색어 하이라이팅용
      />

      {/* ✅ 회원 등록/수정 다이얼로그 - prop 이름 수정 */}
      <Dialog
        open={showRegister}
        onClose={() => {
          setShowRegister(false);
          setSelectedMember(null);
        }}
        maxWidth="sm"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          {selectedMember ? "회원 수정" : "회원 등록"}
          <IconButton
            onClick={() => {
              setShowRegister(false);
              setSelectedMember(null);
            }}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <MemberRegisterForm
            initialData={selectedMember} // ✅ member → initialData로 수정
            onRegister={handleRegister}  // ✅ 통합된 핸들러 사용
          />
        </DialogContent>
      </Dialog>

      {/* 대량 업로드 다이얼로그 */}
      <Dialog
        open={showUpload}
        onClose={() => setShowUpload(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          대량 회원 업로드
          <IconButton
            onClick={() => setShowUpload(false)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <MemberUploadForm
            onSuccess={handleUpload}
            onClose={() => setShowUpload(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default MemberManage;