import React, { useRef, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Button, Paper, Typography, Alert, LinearProgress, Table, TableBody, TableCell, Box,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Chip
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { uploadAttendanceData } from "../services/attendancePerformanceAPI";
import { getSubProgramMembers } from "../services/subProgramMemberAPI";
import { useUserRole } from "../hooks/useUserRole";
import useSnackbar from "./useSnackbar";
import { normalizeDate, getCurrentKoreanDate } from "../utils/dateUtils"; // ✅ 통합된 normalizeDate 사용

// 이름 비교할 때 대소문자 무시, 공백 제거하는 헬퍼함수
const cleanName = (str) => (str || "").toLowerCase().replace(/\s+/g, "");

/// 이용자번호 예: "정기수840223" → { name: "정기수", birthdate: "1984-04-23" }
function parseUserNumber(userNumber) {
  if (!userNumber) return { name: "", birthdate: "" };
  // 공백도 포함한 이름 + 6자리 숫자 패턴으로 변경
  const match = userNumber.match(/^([\p{L} \-']+)(\d{6})$/u);
  if (!match) return { name: "", birthdate: "" };
  const [_, name, ymd] = match;
  const yearPrefix = Number(ymd.slice(0, 2)) < 30 ? "20" : "19";
  const birthdate = `${yearPrefix}${ymd.slice(0, 2)}-${ymd.slice(2, 4)}-${ymd.slice(4, 6)}`;
  return { name: name.trim(), birthdate };
}

// ✅ 동명이인 모두 반환 (고유아이디 배열)
async function getUserIds(이용자명, 성별, 세부사업명) {
  const members = await getSubProgramMembers({ 세부사업명 });
  let matches = members.filter(m => m.이용자명 === 이용자명 && m.성별 === 성별);

  if (matches.length === 0) {
    // 성별 일치자가 없으면 이름만으로 fallback
    matches = members.filter(m => m.이용자명 === 이용자명);
  }

  return matches.map(m => m.고유아이디);
}

async function mapFields(row, structure) {
  const todayStr = getCurrentKoreanDate();
  const 고유아이디목록 = await getUserIds(row["이용자명"], row["성별"], row["세부사업명"]);

  const subName = (row["세부사업명"] || "").trim().toLowerCase();
  let struct = {};

  const normStructure = Object.fromEntries(
    Object.entries(structure).map(([k, v]) => [k.trim().toLowerCase(), v])
  );

  if (normStructure[subName]) {
    struct = normStructure[subName];
  }

  // ✅ 여러 개 반환
  return 고유아이디목록.map(고유아이디 => ({
    날짜: normalizeDate(row["날짜"]) || todayStr,
    세부사업명: row["세부사업명"] || "",
    이용자명: row["이용자명"] || "",
    성별: row["성별"] || "",
    "내용(특이사항)": row["내용(특이사항)"] || "",
    출석여부: row["출석여부"]?.trim() === "결석" ? false : true,
    고유아이디,
    function: struct.function || "",
    unit: struct.unit || ""
  }));
}

// ✅ 중복 로직을 날짜+세부사업명+이용자명으로 변경
function generateRowKey(row) {
  return `${row["날짜"]}_${row["세부사업명"]}_${row["고유아이디"] || row["이용자명"]}_${row["연락처"] || ""}`.trim();
}

function deduplicateRows(rows) {
  const seen = new Set();
  return rows.filter(row => {
    const key = generateRowKey(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function AttendancePerformanceUploadForm({ onSuccess, onClose, structure }) {
  const fileInput = useRef();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);
  const [unmatchedRows, setUnmatchedRows] = useState([]);
  const [showUnmatchedDialog, setShowUnmatchedDialog] = useState(false);
  const { role: userRole } = useUserRole();
  const [SnackbarComp, showSnackbar] = useSnackbar();

  const REQUIRED_FIELDS = ["날짜", "세부사업명", "이용자명"];

  const validateRow = (row) => {
    for (const field of REQUIRED_FIELDS) {
      if (!row[field] || row[field].toString().trim() === "") {
        return `필수 항목 누락: ${field}`;
      }
    }

    const normalized = normalizeDate(row["날짜"]); // ✅ 통합된 normalizeDate 사용
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return "날짜 형식 오류 (YYYY-MM-DD)";
    }

    // ✅ 계층구조와 flat 구조 모두 확인
const hasMapping = structure[row["세부사업명"]] || 
                   (structure.flat && structure.flat[row["세부사업명"]]) ||
                   (structure.hierarchical && Object.values(structure.hierarchical).some(units => 
                     Object.values(units).some(subs => subs.includes(row["세부사업명"]))
                   ));

if (!hasMapping) {
  return "세부사업명에 대한 매핑 정보가 없습니다.";
}

    return null;
  };

  // ✅ 여기에 헬퍼 함수 추가 (validateRow 함수와 handleFile 함수 사이)
  const findStructureMapping = (세부사업명, structure) => {
    // 1. 직접 매핑 확인
    if (structure[세부사업명]) {
      return structure[세부사업명];
    }
    
    // 2. flat 구조 확인
    if (structure.flat && structure.flat[세부사업명]) {
      return structure.flat[세부사업명];
    }
    
    // 3. hierarchical 구조에서 검색
    if (structure.hierarchical) {
      for (const [team, units] of Object.entries(structure.hierarchical)) {
        for (const [unit, subs] of Object.entries(units)) {
          if (subs.includes(세부사업명)) {
            return { function: team, unit: unit, team: team };
          }
        }
      }
    }
    
    return null;
  };

  const handleFile = async (e) => {
    if (userRole === "teacher") {
      showSnackbar("권한이 없습니다.", "error");
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setResult(null);
    setErrors([]);
    setUnmatchedRows([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const originalRows = XLSX.utils.sheet_to_json(sheet);

      const rows = deduplicateRows(originalRows);
      let added = 0, matched = 0, failed = 0;
      const validRows = [];
      const unmatched = [];

      for (const row of rows) {
        const error = validateRow(row);
        if (error) {
          failed++;
          setErrors(prev => [...prev, { row, error }]);
          continue;
        }
// 3) 매칭 로직 수정된 부분 (handleFile 내부)
const { name: parsedName, birthdate: parsedBirthdate } = parseUserNumber(row["이용자번호"]);
const members = await getSubProgramMembers({ 세부사업명: row["세부사업명"] });
const subProgramMember = members.find(m =>
  cleanName(m.이용자명) === cleanName(parsedName) &&
  m.생년월일 && m.생년월일.startsWith(parsedBirthdate)
);

const mappedRows = await mapFields({
  ...row,
  이용자명: row["이용자명"],
  성별: row["성별"],
}, structure);

// ✅ 여러 명 반환 시 모두 추가
if (mappedRows.length > 0) {
  validRows.push(...mappedRows);
  matched += mappedRows.length;
} else {
  unmatched.push(row);
  failed++;
}
      }

      if (validRows.length > 0) {
        await uploadAttendanceData(validRows);
        added = validRows.length;
      }

      setResult({ added, matched, failed });
setUnmatchedRows(unmatched);
if (unmatched.length > 0) setShowUnmatchedDialog(true);

        } catch (err) {
      console.error("업로드 오류:", err); // ✅ 디버깅용 로그 추가
      setResult({ errorMessage: err.message });
      showSnackbar("업로드 실패: " + err.message, "error"); // ✅ 스낵바 알림 추가
        } finally {
      setUploading(false);
      // ✅ 파일 input 초기화 (같은 파일 재선택 가능)
      if (fileInput.current) {
        fileInput.current.value = '';
      }
    }
  };

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, maxWidth: "100%" }}>
      {SnackbarComp}
      
      <Typography variant="h5" gutterBottom sx={{ textAlign: "center", mb: 3 }}>
        출석 엑셀 업로드
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: "center" }}>
  <strong>필수 헤더:</strong> 날짜, 세부사업명, 이용자명, 성별, 이용자번호(이름+생년월일6자리), 내용(특이사항), 출석여부, 고유아이디<br />
  ※ 날짜는 YYYY-MM-DD 형식(자동 변환), 중복(날짜+세부사업명+고유아이디) 자동 제외<br />
  ✅ 이용자번호를 기반으로 매칭하여 고유아이디를 자동 할당하며, 출석여부가 비어있으면 출석, "결석"만 결석 처리합니다.
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
  disabled={uploading || userRole === "teacher"}
  sx={{ fontSize: { xs: "1rem", sm: "1.1rem" }, py: 1.2, width: { xs: "100%", sm: "auto" } }}
>
  {uploading ? "업로드 중..." : "엑셀 파일 선택"}
</Button>
      </Box>

      {uploading && <LinearProgress sx={{ mb: 2 }} />}

      {result && result.added >= 0 && (
  <Alert severity="success" sx={{ mb: 2 }}>
    <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
      📊 업로드 완료!
    </Typography>
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 1 }}>
      <Chip 
        label={`✅ 성공: ${result.added}건`} 
        color="success" 
        size="small" 
      />
      <Chip 
        label={`🔄 매칭: ${result.matched}건`} 
        color="info" 
        size="small" 
      />
      {result.failed > 0 && (
        <Chip 
          label={`❌ 실패: ${result.failed}건`} 
          color="error" 
          size="small" 
        />
      )}
    </Box>
    {result.added > 0 && (
      <Typography variant="body2" sx={{ mt: 1, color: "success.dark" }}>
        💡 업로드된 출석 데이터는 자동으로 실적에 연동되었습니다.
      </Typography>
    )}
    {result.added > 0 && (
      <Typography variant="body2" sx={{ mt: 1, fontWeight: 600, color: "success.main" }}>
        🎉 아래 "완료" 버튼을 눌러 결과를 확인하세요!
      </Typography>
    )}
  </Alert>
)}

            {result?.errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          ⚠️ 업로드 실패: {result.errorMessage}
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

      {onClose && (
  <Box sx={{ textAlign: "center", mt: 2 }}>
          <Button 
        onClick={() => {
          onClose();
          if (result?.added > 0 && onSuccess) {
            onSuccess(); // 성공적으로 업로드된 경우에만 onSuccess 호출
          }
        }} 
        variant={result?.added > 0 ? "contained" : "outlined"}
        color={result?.added > 0 ? "success" : "primary"}
        size="large"
        sx={{ minWidth: 120 }}  // ← 이 부분 추가 필요
      >
        {result?.added > 0 ? "✅ 완료" : "닫기"}  // ← 확인후 닫기
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
            아래 명단은 이름+성별로 자동 매핑되지 않았습니다. 수동 등록이 필요합니다.
          </Typography>
          {unmatchedRows.map((row, idx) => (
            <Typography key={idx} variant="body2">
              {row["이용자명"]} / {row["성별"] || "-"}
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

export default AttendancePerformanceUploadForm;
