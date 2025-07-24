import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Button, Paper, Typography, Alert, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Box
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import { uploadBulkPerformanceSummary } from "../services/attendancePerformanceAPI";
import { exportToExcel } from "../utils/exportToExcel";
import { useUserRole } from "../hooks/useUserRole";
import useSnackbar from "./useSnackbar";
import { getStructureBySubProgram } from "../services/teamSubProgramMapAPI";
import { normalizeDate, getCurrentKoreanDate } from "../utils/dateUtils";

function PerformanceBulkUploadForm({ onSuccess, onCancel }) {
  const fileInput = useRef();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);
  const { role: userRole } = useUserRole();
  const [SnackbarComp, showSnackbar] = useSnackbar();

  const REQUIRED_FIELDS = ["세부사업명"];

  const validateRow = (row) => {
    for (const field of REQUIRED_FIELDS) {
      if (!row[field] || row[field].toString().trim() === "") {
        return `필수 항목 누락: ${field}`;
      }
    }

    const normalizedDate = normalizeDate(row["날짜"]);
    if (row["날짜"]) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
        return "날짜 형식 오류 (YYYY-MM-DD)";
      }

      const [yyyy, mm, dd] = normalizedDate.split("-");
      if (
        Number(yyyy) < 2000 ||
        Number(yyyy) > 2100 ||
        Number(mm) < 1 || Number(mm) > 12 ||
        Number(dd) < 1 || Number(dd) > 31
      ) {
        return `유효하지 않은 날짜: ${normalizedDate}`;
      }
    }

    return null;
  };

  const handleFile = async (e) => {
    if (userRole === "teacher") {
      showSnackbar("권한이 없습니다.", "error");
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);
    setErrors([]);
    setProgress(0);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      let added = 0, failed = 0;
      const processedRows = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const error = validateRow(row);

        if (error) {
          failed++;
          setErrors(prev => [...prev, { row, error }]);
          continue;
        }

        const 날짜 = normalizeDate(row["날짜"]?.toString().trim()) || getCurrentKoreanDate();
        const 세부사업명 = row["세부사업명"]?.trim() || "";
        const 단위사업명 = row["단위사업명"]?.trim() || "";
        const 등록인원 = parseInt(row["등록인원"]) || 0;
        const 실인원 = parseInt(row["실인원"]) || 0;
        const 연인원 = parseInt(row["연인원"]) || 0;
        const 건수 = parseInt(row["건수"]) || 0;
        const 비고 = row["비고"]?.trim() || "";

        const 최종등록인원 = 등록인원 > 0 ? 등록인원 : 실인원;
        const 최종실인원 = 실인원 > 0 ? 실인원 : 등록인원;

        let 기능 = "";
        let 팀명 = "";
        let 단위 = 단위사업명;

        if (세부사업명) {
          try {
            const mapped = await getStructureBySubProgram(세부사업명);
            if (mapped) {
              기능 = mapped.function || "";
              단위 = 단위 || mapped.unit || "";
              팀명 = mapped.team || "";
            }
          } catch {}
        }

        processedRows.push({
          날짜,
          세부사업명,
          단위사업명: 단위,
          기능,
          팀명,
          등록인원: 최종등록인원,
          실인원: 최종실인원,
          연인원,
          건수,
          비고
        });

        added++;
        setProgress(((i + 1) / rows.length) * 100);
      }

      if (processedRows.length > 0) {
        const uploadResult = await uploadBulkPerformanceSummary(processedRows);
        added += uploadResult.filter(r => r.success).length;
        failed += uploadResult.filter(r => !r.success).length;
        
        setErrors(prev => [
          ...prev,
          ...uploadResult.filter(r => !r.success).map(r => ({ row: r.row, error: r.error }))
        ]);
      }

      setResult({ added, failed });
      if (onSuccess) onSuccess(processedRows);

    } catch (err) {
      setResult({ errorMessage: err.message });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        날짜: getCurrentKoreanDate(),
        세부사업명: "프로그램 A",
        단위사업명: "교육문화 및 평생교육",
        등록인원: 100,
        실인원: 100,
        연인원: 180,
        건수: 50,
        비고: "참고"
      }
    ];
    exportToExcel({ data: template, fileName: "PerformanceTemplate.xlsx" });
  };

  const downloadErrorLog = () => {
    const errorData = errors.map(e => ({ ...e.row, 오류: e.error }));
    exportToExcel({ data: errorData, fileName: "ErrorLog.xlsx" });
  };

  const handleClose = () => {
    if (typeof onCancel === 'function') {
      onCancel();
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      {SnackbarComp}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">
          대량 실적 업로드
        </Typography>
        <Button onClick={handleClose} startIcon={<CloseIcon />}>
          닫기
        </Button>
      </Box>

      <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
        필수 항목: 세부사업명<br />
        ※ 날짜는 YYYY-MM-DD 형식(선택)<br />
        ✅ 등록인원, 실인원 중 하나만 입력해도 자동 채움(중복 없음)<br />
        ✅ 대량실적(집계 실적)은 날짜, 세부사업명, 단위사업명, 등록인원, 실인원, 연인원, 건수, 비고만 업로드<br />
        📌 기능, 팀명 등은 세부사업명 기준 자동 매핑(저장 시점에 처리)
      </Typography>

      <Box sx={{ mb: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button
          startIcon={<DownloadIcon />}
          onClick={downloadTemplate}
          sx={{ mr: 2 }}
        >
          템플릿 다운로드
        </Button>

        <Button
          startIcon={<UploadFileIcon />}
          onClick={() => fileInput.current?.click()}
          disabled={uploading || userRole === "teacher"}
          variant="contained"
          sx={{ mr: 2 }}
        >
          파일 선택
        </Button>

        {errors.length > 0 && (
          <Button
            startIcon={<DownloadIcon />}
            onClick={downloadErrorLog}
          >
            오류 로그 다운로드
          </Button>
        )}
      </Box>

      <input
        type="file"
        ref={fileInput}
        onChange={handleFile}
        accept=".xlsx,.xls,.csv"
        style={{ display: "none" }}
      />

      {uploading && <LinearProgress variant="determinate" value={progress} sx={{ mt: 2 }} />}

      {result?.added !== undefined && (
        <Alert severity="success" sx={{ mt: 2 }}>
          ✅ 등록 성공: {result.added}건 / ❌ 실패: {result.failed}건
        </Alert>
      )}

      {result?.errorMessage && (
        <Alert severity="error" sx={{ mt: 2 }}>
          ⚠️ 업로드 실패: {result.errorMessage}
        </Alert>
      )}

      {errors.length > 0 && (
        <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 400 }}>
          <Table stickyHeader>
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

      <Button
        variant="outlined"
        onClick={handleClose}
        sx={{ mt: 2, width: "100%" }}
      >
        닫기
      </Button>
    </Paper>
  );
}

export default PerformanceBulkUploadForm;
