import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Button, Paper, Typography, Alert, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { uploadAttendanceData } from "../services/attendancePerformanceAPI";

function AttendancePerformanceUploadForm({ onSuccess, onClose, structure }) {
  const fileInput = useRef();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);

  const REQUIRED_FIELDS = ["날짜", "세부사업명", "이름"];

  const generateRowKey = (row) => `${row["날짜"]}_${row["세부사업명"]}_${row["이름"]}`.trim();

  const deduplicateRows = (rows) => {
    const seen = new Set();
    return rows.filter((row) => {
      const key = generateRowKey(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const validateRow = (row) => {
    for (const field of REQUIRED_FIELDS) {
      if (!row[field] || row[field].toString().trim() === "") {
        return `필수 항목 누락: ${field}`;
      }
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row["날짜"])) {
      return "날짜 형식 오류 (YYYY-MM-DD)";
    }
    return null;
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setResult(null);
    setErrors([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const originalRows = XLSX.utils.sheet_to_json(sheet);
      const rows = deduplicateRows(originalRows);

      const validRows = [];
      const failedRows = [];

      for (const row of rows) {
        const error = validateRow(row);
        if (error) {
          failedRows.push({ row, error });
          continue;
        }
        validRows.push(row);
      }

      if (validRows.length > 0) {
        await uploadAttendanceData(validRows);
      }

      setResult({ success: validRows.length, fail: failedRows.length });
      setErrors(failedRows);
      if (onSuccess) onSuccess();
    } catch (err) {
      setResult({ errorMessage: err.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Paper className="my-2 p-4 max-w-[900px] mx-auto">
      <Typography variant="h6" gutterBottom>출석 엑셀 업로드</Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        <strong>날짜, 세부사업명, 이름, 성별, 내용(특이사항)</strong><br />
        ※ 날짜는 YYYY-MM-DD 형식, 중복(날짜+세부사업명+이름) 자동 제외<br />
        ✅ 세부사업명 기준 자동 매핑<br />
      </Typography>
      <Button
        component="label"
        variant="contained"
        startIcon={<UploadFileIcon />}
        disabled={uploading}
      >
        엑셀 파일 선택
        <input
          type="file"
          accept=".xlsx,.xls"
          hidden
          ref={fileInput}
          onChange={handleFile}
        />
      </Button>
      {uploading && <LinearProgress sx={{ mt: 2 }} />}
      {result && result.success >= 0 && (
        <Alert severity="success" sx={{ mt: 2 }}>
          ✅ 등록 성공: {result.success}건 / ❌ 실패: {result.fail}건
        </Alert>
      )}
      {result?.errorMessage && (
        <Alert severity="error" sx={{ mt: 2 }}>
          ⚠️ 업로드 실패: {result.errorMessage}
        </Alert>
      )}
      {errors.length > 0 && (
        <TableContainer component={Paper} sx={{ overflowX: "auto", maxWidth: "100%" }}>
          <Table size="small" sx={{ minWidth: 700 }}>
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
      <Button onClick={onClose} sx={{ mt: 2 }}>닫기</Button>
    </Paper>
  );
}

export default AttendancePerformanceUploadForm;