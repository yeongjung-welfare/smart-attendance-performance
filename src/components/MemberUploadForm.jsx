// src/components/MemberUploadForm.jsx

import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Button,
  Paper,
  Typography,
  Alert,
  LinearProgress
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";

function normalizePhone(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.length === 11
    ? `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    : phone || "";
}

function normalizeDate(date) {
  try {
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

const REQUIRED_HEADERS = [
  "이용자명", "성별", "생년월일", "연락처", "주소", "행정동", "소득구분"
];

function MemberUploadForm({ onSuccess, onClose }) {
  const fileInput = useRef();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);

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

      // ✅ 필수 헤더 확인
      const firstRow = Object.keys(raw[0]);
      const missingHeaders = REQUIRED_HEADERS.filter(h => !firstRow.includes(h));
      if (missingHeaders.length > 0) {
        setResult({ error: `누락된 헤더: ${missingHeaders.join(", ")}` });
        setUploading(false);
        return;
      }

      // ✅ 데이터 정제
      const rows = raw.map(row => ({
        name: row["이용자명"]?.trim() || "",
        gender: row["성별"]?.trim() || "",
        birthdate: normalizeDate(row["생년월일"]),
        phone: normalizePhone(row["연락처"]),
        address: row["주소"]?.trim() || "",
        district: row["행정동"]?.trim() || "",
        incomeType: row["소득구분"]?.trim() || "일반",
        registeredAt: new Date().toISOString().split("T")[0]
      }));

      onSuccess?.(rows);
      setResult({ success: rows.length });
    } catch (err) {
      setResult({ error: err.message });
    }

    setUploading(false);
  };

  return (
    <Paper className="my-2 p-4 min-w-[600px] max-w-full overflow-x-auto mx-auto">
      <Typography variant="h6" gutterBottom>
        회원 대량 업로드
      </Typography>

      <Button
        component="label"
        variant="contained"
        startIcon={<UploadFileIcon />}
        disabled={uploading}
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

      {result?.success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {result.success}명 회원 등록 완료
        </Alert>
      )}
      {result?.error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          오류: {result.error}
        </Alert>
      )}

      {/* ✅ 업로드 형식 안내 */}
      <Typography variant="body2" sx={{ mt: 2 }}>
        ※ 엑셀 첫 번째 행(헤더)은 아래 형식이어야 합니다:
        <br />
        <code>
          이용자명, 성별, 생년월일, 연락처, 주소, 행정동, 소득구분
        </code>
      </Typography>

      <Typography variant="body2" sx={{ mt: 1 }}>
        샘플 파일:{" "}
        <a href="/sample/member_upload_sample.xlsx" download>
          다운로드
        </a>
      </Typography>

      <Button onClick={onClose} sx={{ mt: 2 }}>
        닫기
      </Button>
    </Paper>
  );
}

export default MemberUploadForm;