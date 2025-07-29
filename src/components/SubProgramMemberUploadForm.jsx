import React, { useRef, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
Button, Paper, Typography, Alert, LinearProgress, useMediaQuery, Box, Dialog, DialogTitle,
DialogContent, DialogActions, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Chip
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { registerSubProgramMember, findMemberByNameAndPhone } from "../services/subProgramMemberAPI";
import { getAllMembers, registerMember } from "../services/memberAPI";
import { getAgeGroup } from "../utils/ageGroup";
import { normalizeDate, getCurrentKoreanDate } from "../utils/dateUtils"; // ✅ toFirebaseDate 제거

// ✅ 전화번호 정규화 함수 추가
function normalizePhone(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.length === 11
    ? `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    : phone || "";
}

const REQUIRED_HEADERS = ["세부사업명", "이용자명", "성별"];

function SubProgramMemberUploadForm({ onSuccess, onClose, filters = {}, subProgramOptions = [] }) {
  const fileInput = useRef();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [unmatchedRows, setUnmatchedRows] = useState([]);
  const [showUnmatchedDialog, setShowUnmatchedDialog] = useState(false);
  const [members, setMembers] = useState([]);
  const [errors, setErrors] = useState([]);
  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    getAllMembers().then(setMembers);
  }, []);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);
    setUnmatchedRows([]);
    setShowUnmatchedDialog(false);
    setErrors([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

      if (!raw || raw.length === 0 || !raw[0].length) {
        setResult({ error: "엑셀 파일에 유효한 데이터가 없습니다. 헤더 또는 행 확인하세요." });
        setUploading(false);
        return;
      }

      const headerRow = raw[0];
      const missingHeaders = REQUIRED_HEADERS.filter(h => !headerRow.includes(h));
      
      if (missingHeaders.length > 0) {
        setResult({
          error: `필수 헤더가 누락되었습니다. 필요한 헤더: ${REQUIRED_HEADERS.join(", ")}. 누락된 헤더: ${missingHeaders.join(", ")}. 업로드한 파일의 첫 번째 행 헤더: ${headerRow.join(", ")}`
        });
        setUploading(false);
        return;
      }

      const dataRows = raw.slice(1);
      const dataObjects = dataRows.map(rowArr =>
        Object.fromEntries(headerRow.map((h, idx) => [h, rowArr[idx] ?? ""]))
      );

      let added = 0, updated = 0, failed = 0, manualMatch = 0;
      const unmatchedList = [];
      const errorList = [];

      // 전체회원 DB를 한 번만 불러와서 메모리에서 find
      const memberMap = {};
      members.forEach(m => {
        const normalizedPhone = normalizePhone(m.phone);
        const normalizedBirthdate = normalizeDate(m.birthdate);
        memberMap[`${m.name}|${normalizedBirthdate}|${normalizedPhone}`] = m;
      });

      // Promise.all로 병렬 처리
      await Promise.all(dataObjects.map(async (row) => {
        const 세부사업명 = row["세부사업명"]?.trim() || filters.세부사업명 || "";
        const 이용자명 = row["이용자명"]?.trim() || "";
        const 성별 = row["성별"]?.trim() || "";
        const 연락처 = row["연락처"] ? normalizePhone(row["연락처"]) : "";
        const 생년월일 = row["생년월일"] ? normalizeDate(row["생년월일"]) : ""; // ✅ 문자열 정규화만
        const 연령대 = row["연령대"]?.trim() || "";
        const 소득구분 = row["소득구분"]?.trim() || "일반";
        const 팀명 = row["팀명"]?.trim() || filters.팀명 || "";
        const 단위사업명 = row["단위사업명"]?.trim() || filters.단위사업명 || "";
        const 유료무료 = row["유료/무료"]?.trim() || "무료";
        const 이용상태 = row["이용상태"]?.trim() || "이용";
        const 고유아이디 = row["고유아이디"]?.trim() || "";

        if (!세부사업명 || !이용자명 || !성별) {
          failed++;
          errorList.push({ row, error: "필수 항목 누락 (세부사업명, 이용자명, 성별)" });
          return;
        }

        if (subProgramOptions.length > 0 && !subProgramOptions.includes(세부사업명)) {
          failed++;
          errorList.push({ row, error: `유효하지 않은 세부사업명: ${세부사업명}` });
          return;
        }

        // 전체회원 매칭 (이름+생년월일+연락처)
const memberKey = `${이용자명}|${생년월일}|${연락처}`;
const existingMember = memberMap[memberKey];

// ✅ 🔥 전체회원 존재 여부 검증 추가
if (!existingMember) {
  failed++;
  errorList.push({ 
    row, 
    error: `전체회원 관리에 등록되지 않은 이용자입니다. 먼저 전체회원으로 등록해주세요. (${이용자명})` 
  });
  return;
}

let existingSubProgramMember = null;
if (existingMember) {
  existingSubProgramMember = await findMemberByNameAndPhone(이용자명, 연락처);
}

        const base = {
          팀명,
          단위사업명,
          세부사업명,
          이용자명,
          성별,
          연락처,
          생년월일, // ✅ 이미 정규화된 문자열
          연령대,
          소득구분,
          유료무료,
          이용상태,
          고유아이디: 고유아이디 || (existingMember ? existingMember.id : "")
        };

        console.log("📤 세부사업 업로드 데이터:", {
          이용자명: base.이용자명,
          원본생년월일: row["생년월일"],
          정규화생년월일: 생년월일,
          원본연락처: row["연락처"],
          정규화연락처: 연락처
        });

        try {
          if (existingSubProgramMember) {
            await registerSubProgramMember({ ...base, 고유아이디: existingSubProgramMember.고유아이디 });
            updated++;
          } else if (existingMember) {
            await registerSubProgramMember({ ...base, 고유아이디: existingMember.id });
            added++;
          } else {
            // ✅ 전체회원 신규 등록 - 문자열로 저장
            const memberData = {
              name: 이용자명,
              gender: 성별,
              birthdate: 생년월일, // ✅ 문자열로 저장 (Date 객체 제거)
              phone: 연락처,
              incomeType: 소득구분,
              registrationDate: getCurrentKoreanDate()
            };

            const result = await registerMember(memberData);
            if (result && result.success) {
              await registerSubProgramMember({ ...base, 고유아이디: result.userId });
              added++;
            } else {
              manualMatch++;
              unmatchedList.push(base);
              errorList.push({ row, error: `전체회원 등록 실패: ${result?.message || "알 수 없는 오류"}` });
            }
          }
        } catch (err) {
          failed++;
          errorList.push({ row, error: `처리 실패: ${err.message}` });
        }
      }));

              setResult({ added, updated, failed, manualMatch });
        setUnmatchedRows(unmatchedList);
        setErrors(errorList);
        if (unmatchedList.length > 0) setShowUnmatchedDialog(true);
        
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
        세부사업별 이용자 대량 업로드
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
      {result.manualMatch > 0 && (
        <Chip 
          label={`⚠️ 미매칭: ${result.manualMatch}명`} 
          color="warning" 
          size="small" 
        />
      )}
    </Box>
    {(result.added > 0 || result.updated > 0) && (
      <Typography variant="body2" sx={{ mt: 1, color: "success.dark" }}>
        💡 업로드된 세부사업 이용자 데이터가 등록되었습니다.
      </Typography>
    )}
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
        ※ 엑셀 첫 번째 행(헤더)은 아래 형식이어야 합니다:
(세부사업명, 이용자명, 성별, 연락처, 생년월일, 연령대, 소득구분, 팀명, 단위사업명, 유료/무료, 이용상태, 고유아이디)
※ 필수: 세부사업명, 이용자명, 성별
※ ⚠️ 주의: 세부사업 이용자로 등록하려면 먼저 전체회원 관리에 등록되어 있어야 합니다.
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
            아래 명단은 전체회원과 자동 매칭되지 않았습니다. 전체회원관리에서 등록 후 다시 업로드하거나, 수동으로 확인하세요.
          </Typography>
          {unmatchedRows.map((row, idx) => (
            <Typography key={idx} variant="body2">
              {row.이용자명} / {row.성별} / {row.연락처}
              {row.생년월일 && <> / {row.생년월일}</>}
            </Typography>
          ))}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            ※ 미매칭 회원은 전체회원관리에서 등록 후 다시 업로드하세요.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUnmatchedDialog(false)}>확인</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default SubProgramMemberUploadForm;
