import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Button, Paper, Typography, Alert, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { uploadBulkPerformanceSummary } from "../services/attendancePerformanceAPI";

function PerformanceBulkUploadForm({ onSuccess, onClose }) {
  const fileInput = useRef();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);

  // 세부사업명만 필수
  const REQUIRED_FIELDS = ["세부사업명"];

  const validateRow = (row) => {
    for (const field of REQUIRED_FIELDS) {
      if (!row[field] || row[field].toString().trim() === "") {
        return `필수 항목 누락: ${field}`;
      }
    }
    if (row["날짜"] && !/^\d{4}-\d{2}-\d{2}$/.test(row["날짜"])) {
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

      const validRows = [];
      const failedRows = [];

      for (const row of originalRows) {
        const error = validateRow(row);
        if (error) {
          failedRows.push({ row, error });
          continue;
        }
        validRows.push({
          date: row["날짜"] || "",
          subProgram: row["세부사업명"],
          registered: Number(row["등록인원"]) || 0,
          actual: Number(row["실인원"]) || 0,
          total: Number(row["연인원"]) || 0,
          cases: Number(row["건수"]) || 0,
          note: row["비고"] || ""
        });
      }

      if (validRows.length > 0) {
        await uploadBulkPerformanceSummary(validRows);
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
      <Typography variant="h6" gutterBottom>대량 실적 엑셀 업로드</Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        <strong>세부사업명(필수), 날짜, 등록인원, 실인원, 연인원, 건수, 비고</strong><br />
        ※ 날짜는 YYYY-MM-DD 형식, 세부사업명만 필수<br />
        ✅ 업로드 시 실적 통계에 자동 반영<br />
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

export default PerformanceBulkUploadForm;