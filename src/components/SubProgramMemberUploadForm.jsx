// 🔧 src/components/SubProgramMemberUploadForm.jsx (보완 + 기존 스타일 유지)

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

// ✅ 연락처 포맷 정규화
function normalizePhone(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.length === 11
    ? `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    : phone || "";
}

// ✅ 생년월일 정규화 (yyyy-MM-dd 형식)
function normalizeDate(date) {
  try {
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

// ✅ 필수 헤더 정의
const REQUIRED_HEADERS = ["이용자명", "성별", "생년월일"];

function SubProgramMemberUploadForm({ onSuccess, onClose, userInfo }) {
  const fileInput = useRef();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  // ✅ 파일 핸들링 함수
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

      // ✅ 헤더 누락 확인
      const firstRow = Object.keys(raw[0]);
      const missingHeaders = REQUIRED_HEADERS.filter(h => !firstRow.includes(h));
      if (missingHeaders.length > 0) {
        setResult({ error: `누락된 헤더: ${missingHeaders.join(", ")}` });
        setUploading(false);
        return;
      }

      // ✅ 데이터 정제 및 변환
      const rows = raw.map(row => ({
        name: row["이용자명"]?.trim() || "",
        gender: row["성별"]?.trim() || "",
        birthdate: normalizeDate(row["생년월일"]),
        phone: normalizePhone(row["연락처"]),
        address: row["주소"]?.trim() || "",
        incomeType: row["소득구분"]?.trim() || "",
        disability: row["장애유무"]?.trim() || "",
        paidType: row["유료/무료"]?.trim() || "",
        status: row["이용상태"]?.trim() || "이용",
        team: row["팀명"]?.trim() || "",
        unitProgram: row["단위사업명"]?.trim() || "",
        subProgram: row["세부사업명"]?.trim() || "",
        note: row["비고"]?.trim() || "",
        ageGroup: row["연령대"]?.trim() || "",
        createdAt: new Date().toISOString()
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
        세부사업 이용자 대량 업로드
      </Typography>

      {/* ✅ 파일 선택 */}
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

      {/* ✅ 업로드 상태 표시 */}
      {uploading && <LinearProgress sx={{ mt: 2 }} />}

      {/* ✅ 결과 메시지 */}
      {result?.success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {result.success}명 회원 등록 준비 완료
        </Alert>
      )}
      {result?.error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          오류: {result.error}
        </Alert>
      )}

      {/* ✅ 업로드 형식 안내 */}
      <Typography variant="body2" sx={{ mt: 2 }}>
        <strong>※ 업로드 가능한 항목 목록:</strong><br />
        필수: <code>이용자명, 성별, 생년월일</code><br />
        선택: 연락처, 주소, 소득구분, 장애유무, 유료/무료, 이용상태, 단위사업명, 팀명, 연령대, 비고 등
      </Typography>

      <Typography variant="body2" sx={{ mt: 1 }}>
        엑셀 샘플 파일: <a href="/sample/member_upload_sample.xlsx" download>다운로드</a>
      </Typography>

      <Button onClick={onClose} sx={{ mt: 2 }}>
        닫기
      </Button>
    </Paper>
  );
}

export default SubProgramMemberUploadForm;