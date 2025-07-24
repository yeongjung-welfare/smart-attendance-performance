// src/components/MemberSelectModal.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Table, TableHead, TableRow, TableCell, TableBody,
  TextField, InputAdornment, Box, Typography, Chip,
  TableContainer, Paper, CircularProgress, Alert
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import CakeIcon from "@mui/icons-material/Cake";
import ClearIcon from "@mui/icons-material/Clear";
import { getAllMembers } from "../services/memberAPI";

function MemberSelectModal({ open, onClose, onSelect }) {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 모달이 열릴 때마다 회원 목록 새로고침
  useEffect(() => {
    if (open) {
      loadMembers();
    }
  }, [open]);

  const loadMembers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllMembers();
      console.log("✅ 불러온 회원 데이터:", data);
      setMembers(data || []);
    } catch (err) {
      setError("회원 목록을 불러오는데 실패했습니다.");
      console.error("회원 목록 로드 오류:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 개선된 검색 기능 - 초기에는 전체 목록 표시, 검색어 입력 시 필터링
  const filteredMembers = useMemo(() => {
    // ✅ 핵심 개선: 검색어가 없을 때는 전체 목록 반환
    if (!search.trim()) {
      return members;
    }
    
    const searchTerm = search.toLowerCase().trim().replace(/\s+/g, '');
    console.log("🔍 검색어:", searchTerm);
    
    const filtered = members.filter(member => {
      // 실제 데이터베이스 필드명 사용
      const name = (member.name || "").toLowerCase().replace(/\s+/g, '');
      const phone = (member.phone || "").replace(/\D/g, "");
      const birthdate = (member.birthdate || "");
      const incomeType = (member.incomeType || "").toLowerCase();
      const gender = (member.gender || "").toLowerCase();
      
      const searchPhone = searchTerm.replace(/\D/g, "");
      
      // 더 정확한 검색 조건
      const nameMatch = name.includes(searchTerm);
      const phoneMatch = searchPhone && phone.includes(searchPhone);
      const birthdateMatch = birthdate.includes(searchTerm);
      const incomeMatch = incomeType.includes(searchTerm);
      const genderMatch = gender.includes(searchTerm);
      
      const matches = nameMatch || phoneMatch || birthdateMatch || incomeMatch || genderMatch;
      
      // 디버깅용 로그
      if (matches) {
        console.log("✅ 매칭된 회원:", {
          name: member.name,
          phone: member.phone,
          searchTerm,
          nameMatch,
          phoneMatch
        });
      }
      
      return matches;
    });
    
    console.log("🔍 필터링 결과:", filtered.length, "명");
    return filtered;
  }, [members, search]);

  const handleMemberSelect = (member) => {
  console.log("✅ 선택된 원본 회원:", member);
  
  // ✅ SubProgramMemberRegisterForm의 initialData 구조에 맞게 변환
  const mappedMemberData = {
    name: member.name,
    gender: member.gender,
    birthdate: member.birthdate,
    phone: member.phone,
    address: member.address,
    incomeType: member.incomeType,
    // 추가 필드들도 매핑
    이용자명: member.name,
    성별: member.gender,
    생년월일: member.birthdate,
    연락처: member.phone,
    주소: member.address,
    소득구분: member.incomeType
  };
  
  console.log("🔥 변환된 회원 데이터:", mappedMemberData);
  onSelect(mappedMemberData);
  onClose();
  setSearch(""); // 검색어 초기화
};

  const handleClose = () => {
    onClose();
    setSearch(""); // 검색어 초기화
  };

  // 검색어 클리어 함수
  const handleClearSearch = () => {
    setSearch("");
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      fullScreen={window.innerWidth < 600}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PersonIcon />
          전체회원에서 검색/선택
          <Chip 
            label={`총 ${members.length}명`} 
            size="small" 
            color="primary" 
            variant="outlined"
          />
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* ✅ 강화된 검색 입력창 */}
        <TextField
          placeholder="이름, 전화번호, 생년월일, 성별, 소득구분으로 검색하세요"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          margin="normal"
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: search && (
              <InputAdornment position="end">
                <Button
                  size="small"
                  onClick={handleClearSearch}
                  sx={{ minWidth: 'auto', p: 0.5 }}
                >
                  <ClearIcon fontSize="small" />
                </Button>
              </InputAdornment>
            ),
          }}
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              fontSize: '1rem'
            }
          }}
        />

        {/* ✅ 개선된 검색 결과 안내 */}
        {search ? (
          <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2" color="primary" fontWeight={600}>
              🔍 "{search}" 검색 결과: <strong>{filteredMembers.length}명</strong>
            </Typography>
            {filteredMembers.length === 0 && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                • 검색어를 다시 확인해보세요
                <br />• 이름의 일부만 입력해보세요 (예: "김철수" → "김" 또는 "철수")
                <br />• 전화번호는 숫자만 입력해보세요
              </Typography>
            )}
          </Box>
        ) : (
          <Box sx={{ mb: 2, p: 2, bgcolor: '#e8f5e8', borderRadius: 1 }}>
            <Typography variant="body2" color="success.main" fontWeight={600}>
              💡 <strong>전체 회원 목록 ({filteredMembers.length}명)</strong>
              <br />검색어를 입력하면 해당하는 회원만 필터링됩니다.
            </Typography>
          </Box>
        )}

        {/* 로딩 상태 */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              회원 목록을 불러오는 중...
            </Typography>
          </Box>
        )}

        {/* 에러 상태 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
            <Button size="small" onClick={loadMembers} sx={{ ml: 1 }}>
              다시 시도
            </Button>
          </Alert>
        )}

        {/* ✅ 개선된 회원 목록 테이블 - 초기에도 전체 목록 표시 */}
        {!loading && !error && (
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <PersonIcon fontSize="small" />
                      이름
                    </Box>
                  </TableCell>
                  <TableCell>성별</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <CakeIcon fontSize="small" />
                      생년월일
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <PhoneIcon fontSize="small" />
                      연락처
                    </Box>
                  </TableCell>
                  <TableCell>소득구분</TableCell>
                  <TableCell align="center">선택</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                        {search ? `"${search}" 검색 결과가 없습니다.` : "등록된 회원이 없습니다."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member, index) => (
                    <TableRow 
                      key={member.id || index} 
                      hover
                      sx={{ 
                        cursor: "pointer",
                        "&:hover": { backgroundColor: "#f5f5f5" }
                      }}
                      onClick={() => handleMemberSelect(member)}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {member.name || "이름 없음"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={member.gender || "-"} 
                          size="small" 
                          color={member.gender === "남" ? "primary" : "secondary"}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{member.birthdate || "-"}</TableCell>
                      <TableCell>{member.phone || "-"}</TableCell>
                      <TableCell>
                        <Chip 
                          label={member.incomeType || "일반"} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMemberSelect(member);
                          }}
                        >
                          선택
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* ✅ 사용 안내 - 더 상세한 가이드 */}
        <Box sx={{ mt: 2, p: 2, bgcolor: "#f8f9fa", borderRadius: 1 }}>
          <Typography variant="caption" color="textSecondary">
            💡 <strong>검색 도움말:</strong>
            <br />• <strong>이름 검색:</strong> "김철수", "철수", "김" 등으로 검색 가능
            <br />• <strong>전화번호 검색:</strong> "010-1234-5678", "01012345678", "1234" 등으로 검색 가능
            <br />• <strong>생년월일 검색:</strong> "1990-01-01", "1990", "01-01" 등으로 검색 가능
            <br />• <strong>성별 검색:</strong> "남", "여"로 검색 가능
            <br />• <strong>소득구분 검색:</strong> "일반", "기초수급", "차상위" 등으로 검색 가능
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} size="large">취소</Button>
      </DialogActions>
    </Dialog>
  );
}

export default MemberSelectModal;
