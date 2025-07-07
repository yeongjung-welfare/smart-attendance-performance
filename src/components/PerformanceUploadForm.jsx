// ✅ PerformanceUploadForm.jsx (최신 전체 통합본)
import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Button, Paper, Typography, Alert, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { uploadPerformanceData } from "../services/performanceAPI";
import { downloadExampleExcel } from "../utils/generateExampleExcel";
import { getStructureBySubProgram } from "../services/teamSubProgramMapAPI"; // ✅ 수정됨

function PerformanceUploadForm({ onSuccess, onClose }) {
  const fileInput = useRef();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);

  const REQUIRED_FIELDS = ["날짜", "세부사업명", "이용자명", "성별"];

  const generateRowKey = (row) => `${row["날짜"]}_${row["세부사업명"]}_${row["이용자명"]}`.trim();

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

        let 기능 = row["기능"]?.trim();
        let 단위사업명 = row["단위사업명"]?.trim();
        let 팀명 = row["팀명"]?.trim();

        // 자동 매핑 보완
        if (!기능 || !단위사업명 || !팀명) {
          try {
            const auto = await getStructureBySubProgram(row["세부사업명"]);
            if (auto) {
              기능 = 기능 || auto.function;
              단위사업명 = 단위사업명 || auto.unit;
              팀명 = 팀명 || auto.team;
            }

            if (!기능 || !단위사업명 || !팀명) {
              failedRows.push({
                row,
                error: `자동 매핑 실패: [${row["세부사업명"]}] → 팀명/기능/단위사업명을 찾을 수 없습니다.\n👉 [팀별 세부사업 매핑 관리]에서 먼저 등록해주세요.`
              });
              continue;
            }
          } catch (err) {
            failedRows.push({ row, error: "자동 매핑 중 오류 발생: " + err.message });
            continue;
          }
        }

        validRows.push({
          팀명,
          기능,
          단위사업명,
          세부사업명: row["세부사업명"],
          이름: row["이용자명"],
          성별: row["성별"],
          출석여부: "출석",
          날짜: row["날짜"],
          "내용(특이사항)": row["내용(특이사항)"] || ""
        });
      }

      const uploadResults = await uploadPerformanceData(validRows);

      let success = 0;
      let fail = failedRows.length;
      uploadResults.forEach((res) => {
        if (res.success) {
          success++;
        } else {
          fail++;
          failedRows.push({ row: res.row, error: res.error });
        }
      });

      setResult({ success, fail });
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
      <Typography variant="h6" gutterBottom>실적 엑셀 업로드</Typography>

      <Typography variant="body2" sx={{ mb: 1 }}>
        📄 업로드 양식 예시:<br />
        <strong>날짜, 기능, 단위사업명, 세부사업명, 이용자명, 성별, 내용(특이사항)</strong><br />
        ※ 날짜는 YYYY-MM-DD 형식, 중복(날짜+세부사업명+이용자명) 자동 제외<br />
        ✅ 기능/단위사업명이 비어 있어도 세부사업명을 기준으로 자동 채워집니다.<br />
        ✅ 출석여부는 자동으로 "출석"으로 처리됩니다.<br />
        ⚠️ 자동 매핑 실패 시 [팀별 세부사업 매핑 관리]에서 등록 필요
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

      <Button
        onClick={downloadExampleExcel}
        variant="outlined"
        sx={{ mt: 1, ml: 2 }}
      >
        예시 엑셀 다운로드
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
        <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 300 }}>
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

      <Button onClick={onClose} sx={{ mt: 2 }}>닫기</Button>
    </Paper>
  );
}

export default PerformanceUploadForm;