import React, { useRef, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
Button, Paper, Typography, Alert, LinearProgress, Table, TableBody, TableCell,
TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Box
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import {
  registerMember, updateMember, checkDuplicateMember, getAllMembers
} from "../services/memberAPI";
import { getAgeGroup } from "../utils/ageGroup";
import { getAge } from "../utils/ageUtils";
import { normalizeDate, getCurrentKoreanDate } from "../utils/dateUtils";
import useMediaQuery from '@mui/material/useMediaQuery';

// ✅ 전화번호 정규화 함수 추가
function normalizePhone(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.length === 11
    ? `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    : phone || "";
}

const REQUIRED_HEADERS = ["이용자명", "성별", "생년월일", "연락처", "주소", "행정동", "소득구분"];

function MemberUploadForm({ onSuccess, onClose }) {
  const fileInput = useRef();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);
  const [unmatchedRows, setUnmatchedRows] = useState([]);
  const [showUnmatchedDialog, setShowUnmatchedDialog] = useState(false);
  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    // 빈 의존성 배열로 한 번만 실행
  }, []);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);
    setErrors([]);
    setUnmatchedRows([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(sheet);

      if (!raw || raw.length === 0) {
        setResult({ error: "데이터가 비어 있습니다." });
        setUploading(false);
        return;
      }

      const firstRow = Object.keys(raw[0]);
      const missingHeaders = REQUIRED_HEADERS.filter(h => !firstRow.includes(h));

      if (missingHeaders.length > 0) {
        setResult({ error: `누락된 헤더: ${missingHeaders.join(", ")}` });
        setUploading(false);
        return;
      }

      const allMembers = await getAllMembers();
      let added = 0, updated = 0, failed = 0;

      for (const row of raw) {
        const name = row["이용자명"]?.trim() || "";
        const birthdate = normalizeDate(row["생년월일"]); // ✅ 통합된 normalizeDate 사용
        const phone = normalizePhone(row["연락처"]); // ✅ 전화번호 정규화

        if (!name || !birthdate || !phone) {
          failed++;
          setErrors(prev => [...prev, { row, error: "필수 항목 누락 (이용자명, 생년월일, 연락처)" }]);
          continue;
        }

        // ✅ 개선된 중복 체크 (정규화된 데이터로)
        const isDuplicate = await checkDuplicateMember({ name, birthdate, phone });

        if (isDuplicate) {
          failed++;
          setErrors(prev => [...prev, { row, error: "중복된 회원 (이름, 생년월일, 연락처 일치)" }]);
          continue;
        }

        const base = {
          name,
          gender: row["성별"]?.trim() || "",
          birthdate, // ✅ 정규화된 날짜 문자열
          phone, // ✅ 정규화된 전화번호
          address: row["주소"]?.trim() || "",
          district: row["행정동"]?.trim() || "",
          incomeType: row["소득구분"]?.trim() || "일반",
          disability: row["장애유무"]?.trim() || "무",
          registrationDate: getCurrentKoreanDate()
        };

        // 연령대 계산
        if (birthdate && birthdate.length >= 4) {
          base.ageGroup = getAgeGroup(birthdate.substring(0, 4));
        } else {
          base.ageGroup = "미상";
        }

        if (typeof getAge === "function" && birthdate) {
          base.age = getAge(birthdate);
        } else {
          base.age = null;
        }

        // 디버깅 로그
        console.log("📤 전체회원 업로드 데이터:", {
          name: base.name,
          rawBirthdate: row["생년월일"],
          normalizedBirthdate: birthdate,
          birthdateType: typeof row["생년월일"],
          ageGroup: base.ageGroup,
          rawPhone: row["연락처"],
          normalizedPhone: phone
        });

        // ✅ 기존 회원 찾기 (정규화된 데이터로 비교)
        const existing = allMembers.find(m =>
          m.name === name &&
          normalizeDate(m.birthdate) === birthdate &&
          normalizePhone(m.phone) === phone
        );

        if (existing) {
          const updatedData = { ...existing };
          Object.keys(base).forEach(key => {
            if (base[key] !== "" && base[key] !== undefined) {
              updatedData[key] = base[key];
            }
          });

          await updateMember(existing.id, updatedData);
          updated++;
        } else {
          const res = await registerMember(base);
          if (res && res.success) {
            added++;
          } else {
            failed++;
            setUnmatchedRows(prev => [...prev, base]);
          }
        }
      }

            setResult({ added, updated, failed });
      if (unmatchedRows.length > 0) setShowUnmatchedDialog(true);
      
      // ✅ 자동 닫기 제거 - 사용자가 직접 닫기
      // if (typeof onSuccess === "function") onSuccess();
    } catch (err) {
      console.error("업로드 오류:", err);
      setResult({ error: err.message });
    } finally {
      setUploading(false);
      // ✅ 파일 input 초기화
      if (fileInput.current) {
        fileInput.current.value = '';
      }
    }
  };

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, maxWidth: "100%" }}>
      <Typography variant="h5" gutterBottom sx={{ textAlign: "center", mb: 3 }}>
        회원 대량 업로드
      </Typography>

      <Box sx={{ mb: 3, textAlign: "center" }}>
        <input
          type="file"
          ref={fileInput}
          onChange={handleFile}
          accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
        />
        <Button
          onClick={() => fileInput.current?.click()}
          variant="contained"
          startIcon={<UploadFileIcon />}
          disabled={uploading}
          sx={{ fontSize: { xs: "1rem", sm: "1.1rem" }, py: 1.2, width: { xs: "100%", sm: "auto" } }}
        >
          엑셀/CSV 파일 선택
        </Button>
      </Box>

      {uploading && <LinearProgress sx={{ mb: 2 }} />}

      {result?.added !== undefined && (
  <Alert severity="success" sx={{ mb: 2 }}>
    <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
      📊 업로드 완료!
    </Typography>
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 1 }}>
      <Chip 
        label={`✅ 신규: ${result.added}명`} 
        color="success" 
        size="small" 
      />
      <Chip 
        label={`🔄 업데이트: ${result.updated}명`} 
        color="info" 
        size="small" 
      />
      {result.failed > 0 && (
        <Chip 
          label={`❌ 실패: ${result.failed}명`} 
          color="error" 
          size="small" 
        />
      )}
    </Box>
    {(result.added > 0 || result.updated > 0) && (
      <Typography variant="body2" sx={{ mt: 1, fontWeight: 600, color: "success.main" }}>
        🎉 아래 "완료" 버튼을 눌러 결과를 확인하세요!
      </Typography>
    )}
  </Alert>
)}

      {result?.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          오류: {result.error}
        </Alert>
      )}

      {/* ✅ 오류 안내 Alert 추가 */}
      {errors.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            ⚠️ {errors.length}건의 오류가 발생했습니다. 아래 표에서 확인하세요.
          </Typography>
        </Alert>
      )}

      {errors.length > 0 && (
        <TableContainer component={Paper} sx={{ mb: 2, maxHeight: 300 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>행 정보</TableCell>
                <TableCell>오류 내용</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {errors.map((e, i) => (
                <TableRow key={i}>
                  <TableCell>{JSON.stringify(e.row)}</TableCell>
                  <TableCell>{e.error}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        ※ 엑셀 첫 번째 행(헤더)은 아래 형식이어야 합니다:<br />
        이용자명, 성별, 생년월일, 연락처, 주소, 행정동, 소득구분, 장애유무
      </Typography>

      {onClose && (
  <Box sx={{ textAlign: "center", mt: 2 }}>
    <Button 
      onClick={() => {
        onClose();
        if ((result?.added > 0 || result?.updated > 0) && onSuccess) {
          onSuccess(); // 성공적으로 업로드된 경우에만 onSuccess 호출
        }
      }} 
      variant={(result?.added > 0 || result?.updated > 0) ? "contained" : "outlined"}
      color={(result?.added > 0 || result?.updated > 0) ? "success" : "primary"}
      size="large"
      sx={{ minWidth: 120 }}
    >
      {(result?.added > 0 || result?.updated > 0) ? "✅ 완료" : "닫기"}
    </Button>
  </Box>
)}

      <Dialog
        open={showUnmatchedDialog}
        onClose={() => setShowUnmatchedDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>미매칭 회원 처리</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            아래 명단은 기존 회원과 매칭되지 않았습니다. 수동 등록이 필요합니다.
          </Typography>
          {unmatchedRows.map((row, idx) => (
            <Typography key={idx} variant="body2">
              {row.name} / {row.gender} / {row.phone} / {normalizeDate(row.birthdate)}
            </Typography>
          ))}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            ※ 미매칭 회원은 회원 관리에서 등록 후 다시 업로드하세요.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUnmatchedDialog(false)}>확인</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default MemberUploadForm;
