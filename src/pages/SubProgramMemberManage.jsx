// src/pages/SubProgramMemberManage.jsx

import React, { useEffect, useState } from "react";
import {
  FormControl, InputLabel, MenuItem, Select, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Box, Typography, Alert, CircularProgress,
  Chip, Switch, FormControlLabel
} from "@mui/material";
import SubProgramMemberRegisterForm from "../components/SubProgramMemberRegisterForm";
import SubProgramMemberUploadForm from "../components/SubProgramMemberUploadForm";
import SubProgramMemberTable from "../components/SubProgramMemberTable";
import SubProgramMemberEditModal from "../components/SubProgramMemberEditModal";
import SubProgramMemberBulkEditModal from "../components/SubProgramMemberBulkEditModal";
import MemberSelectModal from "../components/MemberSelectModal";
import ErrorBoundary from "../components/ErrorBoundary";
import ExportButton from "../components/ExportButton";
import useSnackbar from "../components/useSnackbar";
import { useProgramStructure } from "../hooks/useProgramStructure";
import useUserInfo from "../hooks/useUserInfo";
import { getAllTeamSubProgramMaps } from "../services/teamSubProgramMapAPI";
import { getAllMembers, checkDuplicateMember } from "../services/memberAPI";
import {
  getSubProgramMembers, registerSubProgramMember, deleteSubProgramMember,
  deleteMultipleSubProgramMembers, findMemberByNameAndPhone, updateSubProgramMember
} from "../services/subProgramMemberAPI";

function SubProgramMemberManage() {
  const [members, setMembers] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [bulkEditingIds, setBulkEditingIds] = useState([]);
  const [filters, setFilters] = useState({
    팀명: "",
    단위사업명: "",
    세부사업명: ""
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [SnackbarComp, showSnackbar] = useSnackbar();

  // 기존 상태 완전 유지
  const structure = useProgramStructure();
  const { userInfo: user, loading } = useUserInfo();
  const [showMemberSelect, setShowMemberSelect] = useState(false);
  const [pendingMember, setPendingMember] = useState(null);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [allSubPrograms, setAllSubPrograms] = useState([]);
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const role = user?.role;

  // ✅ 모바일 대응 개선된 드롭다운 공통 스타일
  const dropdownCommonStyles = {
    minHeight: 56,
    backgroundColor: '#fff',
    '& .MuiInputLabel-root': { 
      fontSize: '1rem',
      fontWeight: 500,
      color: '#1976d2',
      zIndex: 1
    },
    '& .MuiSelect-select': { 
      fontSize: '1rem',
      minHeight: '1.4375em',
      display: 'flex',
      alignItems: 'center',
      color: '#000 !important', // ✅ 강제 색상 적용
      backgroundColor: '#fff !important' // ✅ 강제 배경색 적용
    },
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#fff',
      '& fieldset': {
        borderColor: '#d1d5db'
      },
      '&:hover fieldset': {
        borderColor: '#1976d2'
      },
      '&.Mui-focused fieldset': {
        borderColor: '#1976d2'
      }
    }
  };

  // ✅ 모바일 대응 MenuProps 설정
  const getMenuProps = () => ({
    PaperProps: {
      sx: {
        maxHeight: 300,
        backgroundColor: '#fff', // ✅ 메뉴 배경색 명시
        '& .MuiList-root': {
          backgroundColor: '#fff', // ✅ 리스트 배경색 명시
          padding: 0
        },
        '& .MuiMenuItem-root': {
          fontSize: '1rem',
          minHeight: 48,
          padding: '12px 16px',
          color: '#000 !important', // ✅ 모바일에서 텍스트 색상 강제 적용
          backgroundColor: '#fff !important', // ✅ 모바일에서 배경색 강제 적용
          borderBottom: '1px solid #f0f0f0', // ✅ 구분선 추가
          '&:hover': {
            backgroundColor: '#f5f5f5 !important', // ✅ 호버 효과
            color: '#000 !important'
          },
          '&.Mui-selected': {
            backgroundColor: '#e3f2fd !important', // ✅ 선택된 항목 배경색
            color: '#1976d2 !important', // ✅ 선택된 항목 텍스트 색상
            '&:hover': {
              backgroundColor: '#bbdefb !important'
            }
          },
          // ✅ 모바일 터치 대응
          '@media (max-width: 600px)': {
            fontSize: '1.1rem',
            minHeight: 52,
            padding: '14px 16px'
          }
        }
      }
    },
    // ✅ 모바일에서 메뉴 위치 조정
    anchorOrigin: {
      vertical: 'bottom',
      horizontal: 'left'
    },
    transformOrigin: {
      vertical: 'top',
      horizontal: 'left'
    },
    // ✅ 모바일에서 전체 화면 너비 사용
    sx: {
      '& .MuiPaper-root': {
        '@media (max-width: 600px)': {
          maxWidth: '100vw',
          left: '0 !important',
          right: '0 !important'
        }
      }
    }
  });

  // 전체 세부사업명 목록 로드
  useEffect(() => {
    async function loadAllSubPrograms() {
      try {
        const teamMaps = await getAllTeamSubProgramMaps();
        const allSubs = teamMaps.map(m => m.subProgramName).filter(Boolean);
        setAllSubPrograms([...new Set(allSubs)].sort());
      } catch (error) {
        console.error("세부사업명 목록 로드 실패:", error);
      }
    }
    loadAllSubPrograms();
  }, []);

  // ✅ 개선된 드릴다운 옵션 - 필터 없이도 전체 세부사업 표시
  const teamOptions = Object.keys(structure).sort();
  const unitOptions = filters.팀명 ? Object.keys(structure[filters.팀명] || {}).sort() : [];
  const subProgramOptions = filters.팀명 && filters.단위사업명 
    ? structure[filters.팀명][filters.단위사업명] || [] 
    : allSubPrograms; // ✅ 필터가 없을 때는 전체 세부사업 목록 사용

  // 초기 전체 이용자 로드
  useEffect(() => {
    async function loadAllMembers() {
      setIsLoading(true);
      try {
        const data = await getSubProgramMembers({});
        setMembers(Array.isArray(data) ? data : []);
        // 선택 상태 초기화
        setSelectedIds([]);
        showSnackbar(`전체 ${data?.length || 0}명의 이용자를 불러왔습니다.`, "info");
      } catch (e) {
        console.error("전체 이용자 로드 실패:", e);
        setMembers([]);
        setSelectedIds([]);
        showSnackbar("이용자 목록 로드 실패", "error");
      } finally {
        setIsLoading(false);
      }
    }
    loadAllMembers();
  }, []);

  // 개선된 조회 로직 - AND 조건으로 수정
  const handleSearch = async () => {
    setIsLoading(true);
    // 조회할 때마다 선택 상태 초기화
    setSelectedIds([]);
    try {
      // 필터가 비어있을 때는 전체 조회
      if (!filters.팀명 && !filters.단위사업명 && !filters.세부사업명) {
        const data = await getSubProgramMembers({});
        setMembers(Array.isArray(data) ? data : []);
        showSnackbar(`전체 ${data?.length || 0}명의 이용자를 조회했습니다.`, "success");
      } else {
        // 필터 조건에 맞는 데이터만 조회 (AND 조건 적용)
        const queryFilters = {};
        if (filters.팀명) queryFilters.팀명 = filters.팀명;
        if (filters.단위사업명) queryFilters.단위사업명 = filters.단위사업명;
        if (filters.세부사업명) queryFilters.세부사업명 = filters.세부사업명;

        const data = await getSubProgramMembers(queryFilters);
        setMembers(Array.isArray(data) ? data : []);
        showSnackbar(`조건에 맞는 ${data?.length || 0}명의 이용자를 조회했습니다.`, "success");
      }
    } catch (e) {
      console.error("이용자 조회 실패:", e);
      setMembers([]);
      setSelectedIds([]);
      showSnackbar("이용자 조회 실패: " + e.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 출석관리용 활성 이용자만 필터링하는 함수
  const getActiveMembers = () => {
    if (!Array.isArray(members)) return [];
    if (!showOnlyActive) return members;
    return members.filter(member => member.이용상태 !== "종결");
  };

  // 기존 모든 핸들러 함수들 완전 유지
  const reloadAfterChange = async () => {
    // 데이터 새로고침 시 선택 상태 초기화
    setSelectedIds([]);
    if (filters.팀명 || filters.단위사업명 || filters.세부사업명) {
      await handleSearch();
    } else {
      setIsLoading(true);
      try {
        const data = await getSubProgramMembers({});
        setMembers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("데이터 새로고침 실패:", error);
        setMembers([]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRegister = async (member) => {
    try {
      // ✅ 🔥 전체회원 존재 여부 검증 추가
      if (member.연락처) {
        
        const memberExists = await checkDuplicateMember({
          name: member.이용자명.trim(),
          birthdate: member.생년월일,
          phone: member.연락처.trim()
        });

        if (!memberExists) {
          showSnackbar(`'${member.이용자명}' 이용자가 전체회원 관리에 등록되어 있지 않습니다. 전체회원으로 먼저 등록해주세요.`, "error");
          return;
        }

        const exist = await findMemberByNameAndPhone(member.이용자명.trim(), member.연락처.trim());
        if (exist) {
          await updateSubProgramMember(exist.id, {
            ...member,
            세부사업명: member.세부사업명,
            팀명: filters.팀명,
            단위사업명: filters.단위사업명
          });
          showSnackbar(`동일인 정보 업데이트 완료 (ID: ${exist.고유아이디})`, "info");
          await reloadAfterChange();
          return;
        }
      }

      const newId = await registerSubProgramMember({
        ...member,
        팀명: filters.팀명 || member.팀명,
        단위사업명: filters.단위사업명 || member.단위사업명
      });

      if (newId) {
        showSnackbar(`이용자 등록 완료 (ID: ${newId})`, "success");
        await reloadAfterChange();
      }
    } catch (e) {
      showSnackbar("등록 실패: " + e.message, "error");
    }
  };

  const handleUpload = async () => {
    await reloadAfterChange();
    setShowUpload(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteSubProgramMember(id);
      await reloadAfterChange();
      showSnackbar("삭제 완료", "info");
    } catch (e) {
      showSnackbar("삭제 실패: " + e.message, "error");
    }
  };

  const handleBulkDelete = async (ids) => {
    if (!ids || ids.length === 0) {
      showSnackbar("삭제할 이용자를 선택하세요.", "warning");
      return;
    }

    if (!window.confirm(`선택한 ${ids.length}명을 정말 삭제하시겠습니까?`)) return;

    try {
      await deleteMultipleSubProgramMembers(ids);
      await reloadAfterChange();
      showSnackbar(`${ids.length}명 삭제 완료`, "success");
    } catch (e) {
      showSnackbar("일괄 삭제 실패: " + e.message, "error");
    }
  };

  // 안전한 모두선택 핸들러 - 중복 방지
  const handleSelectAll = (checked) => {
    const targetMembers = getActiveMembers();
    if (!Array.isArray(targetMembers)) {
      console.warn("⚠️ targetMembers가 배열이 아닙니다:", targetMembers);
      return;
    }

    if (checked) {
      // 모두 선택 - 중복 제거
      const allIds = targetMembers.map((m) => String(m.id || m.고유아이디)).filter(Boolean);
      const uniqueIds = [...new Set(allIds)];
      setSelectedIds(uniqueIds);
    } else {
      // 모두 해제
      setSelectedIds([]);
    }
  };

  // 개별 선택 핸들러 - 중복 방지
  const handleSelectRow = (id, checked) => {
    const stringId = String(id);
    setSelectedIds((prev) => {
      if (checked) {
        // 선택 - 이미 있으면 추가하지 않음
        return prev.includes(stringId) ? prev : [...prev, stringId];
      } else {
        // 해제 - 해당 ID만 제거
        return prev.filter((v) => v !== stringId);
      }
    });
  };

  const handleEdit = (member) => {
    setEditingMember(member);
  };

  const handleBulkEdit = (ids) => {
    setBulkEditingIds(ids);
  };

  const handleBulkEditSave = async (updatedData) => {
    try {
      for (const id of bulkEditingIds) {
        const updateFields = {};
        if (updatedData.세부사업명) updateFields.세부사업명 = updatedData.세부사업명;
        if (updatedData.소득구분) updateFields.소득구분 = updatedData.소득구분;
        if (updatedData.유료무료) updateFields.유료무료 = updatedData.유료무료;
        if (updatedData.이용상태) updateFields.이용상태 = updatedData.이용상태;

        await updateSubProgramMember(id, updateFields);
      }

      showSnackbar(`선택된 ${bulkEditingIds.length}명 수정 완료`, "success");
      setBulkEditingIds([]);
      await reloadAfterChange();
    } catch (e) {
      showSnackbar("일괄 수정 실패: " + e.message, "error");
    }
  };

  const handleEditSave = async (updatedMember) => {
    try {
      await updateSubProgramMember(updatedMember.id, updatedMember);
      showSnackbar("수정되었습니다.", "success");
      setEditingMember(null);
      await reloadAfterChange();
    } catch (e) {
      showSnackbar("수정 실패: " + e.message, "error");
    }
  };

  const canDelete = (member) => {
    if (role === "admin") return true;
    if (role === "manager" && member.createdBy === user?.email) return true;
    return false;
  };

  // 회원 선택 후 등록폼 다이얼로그 열기
  useEffect(() => {
    if (pendingMember) setShowRegisterDialog(true);
  }, [pendingMember]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>데이터를 불러오는 중...</Typography>
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          세부사업별 이용자 관리
        </Typography>

        {/* ✅ 모바일 대응 개선된 드롭다운 */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="medium" sx={dropdownCommonStyles}>
              <InputLabel>팀명</InputLabel>
              <Select
                value={filters.팀명}
                onChange={(e) => setFilters({ ...filters, 팀명: e.target.value, 단위사업명: "", 세부사업명: "" })}
                label="팀명"
                MenuProps={getMenuProps()}
              >
                <MenuItem value="">전체</MenuItem>
                {teamOptions.map((team) => (
                  <MenuItem key={team} value={team}>{team}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="medium" sx={dropdownCommonStyles}>
              <InputLabel>단위사업명</InputLabel>
              <Select
                value={filters.단위사업명}
                onChange={(e) => setFilters({ ...filters, 단위사업명: e.target.value, 세부사업명: "" })}
                label="단위사업명"
                disabled={!filters.팀명}
                MenuProps={getMenuProps()}
              >
                <MenuItem value="">전체</MenuItem>
                {unitOptions.map((unit) => (
                  <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="medium" sx={dropdownCommonStyles}>
              <InputLabel>세부사업명</InputLabel>
              <Select
                value={filters.세부사업명}
                onChange={(e) => setFilters({ ...filters, 세부사업명: e.target.value })}
                label="세부사업명"
                disabled={!filters.단위사업명}
                MenuProps={getMenuProps()}
              >
                <MenuItem value="">전체</MenuItem>
                {subProgramOptions.map((sub) => (
                  <MenuItem key={sub} value={sub}>{sub}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={isLoading}
              fullWidth
              size="large"
              sx={{ 
                height: 56, 
                fontSize: '1.1rem', 
                fontWeight: 600,
                borderRadius: 2
              }}
            >
              {isLoading ? "조회 중..." : "조회"}
            </Button>
          </Grid>
        </Grid>

        {/* 활성 이용자 필터링 토글 */}
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={showOnlyActive}
                onChange={(e) => setShowOnlyActive(e.target.checked)}
                color="primary"
              />
            }
            label="활성 이용자만 표시"
            sx={{ fontSize: '1rem' }}
          />
        </Box>

        {/* 액션 버튼 그룹 - 크기 개선 */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Button
              variant="contained"
              onClick={(e) => {
                e.currentTarget.blur();
                setShowMemberSelect(true);
              }}
              fullWidth
              size="large"
              sx={{ height: 56, fontSize: '1rem', fontWeight: 600 }}
            >
              이용자 등록
            </Button>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Button
              variant="outlined"
              onClick={(e) => {
                e.currentTarget.blur();
                setShowUpload(true);
              }}
              fullWidth
              size="large"
              sx={{ height: 56, fontSize: '1rem', fontWeight: 600 }}
            >
              대량 업로드
            </Button>
          </Grid>

          {selectedIds.length > 0 && (
            <>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => handleBulkEdit(selectedIds)}
                  fullWidth
                  size="large"
                  sx={{ height: 56, fontSize: '1rem', fontWeight: 600 }}
                >
                  선택 수정 ({selectedIds.length})
                </Button>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleBulkDelete(selectedIds)}
                  fullWidth
                  size="large"
                  sx={{ height: 56, fontSize: '1rem', fontWeight: 600 }}
                >
                  선택 삭제 ({selectedIds.length})
                </Button>
              </Grid>
            </>
          )}
        </Grid>

        {/* 데이터 테이블 */}
        <SubProgramMemberTable
          members={getActiveMembers()}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
          onBulkEdit={handleBulkEdit}
          canDelete={canDelete}
          role={role}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          loading={isLoading}
        />

        {/* 모든 모달 및 다이얼로그들 유지 */}
        <Dialog
          open={showUpload}
          onClose={() => setShowUpload(false)}
          maxWidth="md"
          fullWidth
          fullScreen={window.innerWidth < 600}
          disableAutoFocus={false}
          disableEnforceFocus={false}
          disableRestoreFocus={true}
          keepMounted={false}
          aria-labelledby="upload-dialog-title"
        >
          <DialogTitle id="upload-dialog-title">이용자 대량 업로드</DialogTitle>
          <DialogContent>
            <SubProgramMemberUploadForm
              onSuccess={handleUpload}
              onClose={() => setShowUpload(false)}
              teamName={filters.팀명}
              unitName={filters.단위사업명}
              subProgramName={filters.세부사업명}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowUpload(false)}>취소</Button>
          </DialogActions>
        </Dialog>

        {editingMember && (
          <SubProgramMemberEditModal
            member={editingMember}
            open={!!editingMember}
            onClose={() => setEditingMember(null)}
            onSave={handleEditSave}
          />
        )}

        {bulkEditingIds.length > 0 && (
          <SubProgramMemberBulkEditModal
            open={bulkEditingIds.length > 0}
            memberIds={bulkEditingIds}
            onClose={() => setBulkEditingIds([])}
            onSave={handleBulkEditSave}
            subPrograms={allSubPrograms}
          />
        )}

        <MemberSelectModal
          open={showMemberSelect}
          onClose={() => setShowMemberSelect(false)}
          onSelect={(member) => {
            console.log("✅ 선택된 회원 데이터:", member); // 디버깅용
            setPendingMember(member);
            setShowMemberSelect(false);
          }}
        />

        <Dialog
          open={showRegisterDialog}
          onClose={() => setShowRegisterDialog(false)}
          maxWidth="sm"
          fullWidth
          fullScreen={window.innerWidth < 600}
          disableAutoFocus={false}
          disableEnforceFocus={false}
          disableRestoreFocus={true}
          keepMounted={false}
          aria-labelledby="register-dialog-title"
        >
          <DialogTitle id="register-dialog-title">회원 등록</DialogTitle>
          <DialogContent>
            <SubProgramMemberRegisterForm
              onRegister={(data) => {
                handleRegister(data);
                setShowRegisterDialog(false);
                setPendingMember(null);
              }}
              initialData={pendingMember}
              filters={filters}
              subProgramOptions={subProgramOptions} // ✅ 이제 항상 전체 세부사업 포함
              directSubProgramSelect={true}
              allSubPrograms={allSubPrograms} // ✅ 백업용 전체 세부사업 목록 추가
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setShowRegisterDialog(false);
              setPendingMember(null);
            }}>
              취소
            </Button>
          </DialogActions>
        </Dialog>

        {SnackbarComp}
      </Box>
    </ErrorBoundary>
  );
}

export default SubProgramMemberManage;
