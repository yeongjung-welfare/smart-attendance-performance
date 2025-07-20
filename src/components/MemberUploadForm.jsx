import React, { useRef, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Button, Paper, Typography, Alert, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import {
  registerMember, updateMember, checkDuplicateMember, getAllMembers
} from "../services/memberAPI";
import { getAgeGroup } from "../utils/ageGroup";
import { getAge } from "../utils/ageUtils";
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';

function normalizePhone(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.length === 11
    ? `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    : phone || "";
}

function normalizeDate(date) {
  if (!date) return "";
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  try {
    if (typeof date === "number") {
      const excelStart = new Date(1899, 11, 30);
      const d = new Date(excelStart.getTime() + (date - 1) * 24 * 60 * 60 * 1000);
      return d.toISOString().split("T")[0];
    }
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
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
        const birthdate = normalizeDate(row["생년월일"]);
        const phone = normalizePhone(row["연락처"]);
        if (!name || !birthdate || !phone) {
          failed++;
          setErrors(prev => [...prev, { row, error: "필수 항목 누락 (이용자명, 생년월일, 연락처)" }]);
          continue;
        }

        const base = {
          name,
          gender: row["성별"]?.trim() || "",
          birthdate,
          phone,
          address: row["주소"]?.trim() || "",
          district: row["행정동"]?.trim() || "",
          incomeType: row["소득구분"]?.trim() || "일반",
          registeredAt: new Date().toISOString().split("T")[0]
        };

        base.ageGroup = getAgeGroup(birthdate.substring(0, 4));
        base.age = getAge(birthdate);

        const existing = allMembers.find(m => m.name === name && m.birthdate === birthdate && m.phone === phone);

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
      if (typeof onSuccess === "function") onSuccess();
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Paper sx={{ my: 2, p: 3, width: isMobile ? "100%" : 600, mx: "auto" }}>
      <Typography variant="h6" gutterBottom>회원 대량 업로드</Typography>
      <Button
        component="label"
        variant="contained"
        startIcon={<UploadFileIcon />}
        disabled={uploading}
        sx={{ fontSize: { xs: "1rem", sm: "1.1rem" }, py: 1.2, width: { xs: "100%", sm: "auto" } }}
      >
        엑셀/CSV 파일 선택
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          hidden
          ref={fileInput}
          onChange={handleFile}
        />
      </Button>
      {uploading && <LinearProgress sx={{ mt: 2 }} />}
      {result?.added !== undefined && (
        <Alert severity={result.failed === 0 ? "success" : "warning"} sx={{ mt: 2 }}>
          {result.added}명 신규 등록, {result.updated}명 정보 업데이트, {result.failed}명 실패
        </Alert>
      )}
      {result?.error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          오류: {result.error}
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
                  <TableCell sx={{ fontSize: { xs: "0.8rem", sm: "1rem" } }}>{JSON.stringify(e.row)}</TableCell>
                  <TableCell sx={{ fontSize: { xs: "0.8rem", sm: "1rem" } }}>{e.error}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Typography variant="body2" sx={{ mt: 2 }}>
        ※ 엑셀 첫 번째 행(헤더)은 아래 형식이어야 합니다:<br />
        <code>이용자명, 성별, 생년월일, 연락처, 주소, 행정동, 소득구분, 장애유무</code>
      </Typography>
      <Box mt={2}>
        <Button onClick={onClose} sx={{ fontSize: { xs: "1rem", sm: "1.1rem" }, width: { xs: "100%", sm: "auto" } }}>닫기</Button>
      </Box>
      <Dialog open={showUnmatchedDialog} onClose={() => setShowUnmatchedDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>미매칭 회원 처리</DialogTitle>
        <DialogContent>
          <Typography>아래 명단은 기존 회원과 매칭되지 않았습니다. 수동 등록이 필요합니다.</Typography>
          <Box sx={{ mt: 2 }}>
            <ul>
              {unmatchedRows.map((row, idx) => (
                <li key={idx}>{row.name} / {row.gender} / {row.phone} / {row.birthdate}</li>
              ))}
            </ul>
          </Box>
          <Typography sx={{ mt: 2, color: "red" }}>※ 미매칭 회원은 회원 관리에서 등록 후 다시 업로드하세요.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUnmatchedDialog(false)}>확인</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default MemberUploadForm;