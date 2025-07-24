import React, { useRef, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Button, Paper, Typography, Alert, LinearProgress, Table, TableBody, TableCell, Box,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { uploadAttendanceData } from "../services/attendancePerformanceAPI";
import { getSubProgramMembers } from "../services/subProgramMemberAPI";
import { useUserRole } from "../hooks/useUserRole";
import useSnackbar from "./useSnackbar";
import { normalizeDate, getCurrentKoreanDate } from "../utils/dateUtils"; // ✅ 통합된 normalizeDate 사용

// ✅ 이용자명+성별 매칭으로 변경
async function getUserId(이용자명, 성별, 세부사업명) {
  const members = await getSubProgramMembers({ 세부사업명 });
  const member = members.find(m => m.이용자명 === 이용자명 && m.성별 === 성별);
  return member ? member.고유아이디 : "";
}

async function mapFields(row, structure) {
  const today = new Date();
  const todayStr = getCurrentKoreanDate(); // ✅ 통합된 함수 사용
  const 고유아이디 = await getUserId(row["이용자명"], row["성별"], row["세부사업명"]);
  const struct = structure[row["세부사업명"]] || {};

  return {
    날짜: normalizeDate(row["날짜"]) || todayStr, // ✅ 통합된 normalizeDate 사용
    세부사업명: row["세부사업명"] || "",
    이용자명: row["이용자명"] || "",
    성별: row["성별"] || "",
    "내용(특이사항)": row["내용(특이사항)"] || "",
    출석여부: row["출석여부"]?.trim() === "결석" ? false : (row["출석여부"]?.trim() === "출석" || !row["출석여부"] ? true : false),
    고유아이디,
    function: struct.function || "",
    unit: struct.unit || ""
  };
}

// ✅ 중복 로직을 날짜+세부사업명+이용자명으로 변경
function generateRowKey(row) {
  return `${row["날짜"]}_${row["세부사업명"]}_${row["이용자명"]}`.trim();
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

    if (!structure[row["세부사업명"]]) {
      return "세부사업명에 대한 매핑 정보가 없습니다.";
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

        const 이용자명 = row["이용자명"].trim();
        const 성별 = row["성별"] || "";
        const 세부사업명 = row["세부사업명"];

        // ✅ 이용자명+성별로 매칭
        const members = await getSubProgramMembers({ 세부사업명 });
        const subProgramMember = members.find(m =>
          m.이용자명 === 이용자명 && m.성별 === 성별
        );

        if (subProgramMember) {
          const mappedRow = await mapFields({
            ...row,
            고유아이디: subProgramMember.고유아이디
          }, structure);
          
          console.log("📤 출석 업로드 데이터:", {
            이용자명: mappedRow.이용자명,
            원본날짜: row["날짜"],
            정규화날짜: mappedRow.날짜,
            날짜타입: typeof row["날짜"]
          });
          
          validRows.push(mappedRow);
          matched++;
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
      if (onSuccess) onSuccess();

    } catch (err) {
      setResult({ errorMessage: err.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, maxWidth: "100%" }}>
      {SnackbarComp}
      
      <Typography variant="h5" gutterBottom sx={{ textAlign: "center", mb: 3 }}>
        출석 엑셀 업로드
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: "center" }}>
        <strong>필수 헤더:</strong> 날짜, 세부사업명, 이용자명, 성별, 내용(특이사항), 출석여부, 고유아이디<br/>
        ※ 날짜는 YYYY-MM-DD 형식(자동 변환), 중복(날짜+세부사업명+이용자명) 자동 제외<br/>
        ✅ 이름+성별로 자동 매핑, 출석여부 비어있으면 출석 처리(결석만 false)
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
          엑셀 파일 선택
        </Button>
      </Box>

      {uploading && <LinearProgress sx={{ mb: 2 }} />}

      {result && result.added >= 0 && (
        <Alert severity="success" sx={{ mb: 2 }}>
          ✅ 신규 등록: {result.added}건 / 자동 매핑: {result.matched}건 / ❌ 실패: {result.failed}건
        </Alert>
      )}

      {result?.errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          ⚠️ 업로드 실패: {result.errorMessage}
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
        <Box sx={{ textAlign: "center" }}>
          <Button onClick={onClose} variant="outlined">
            닫기
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
