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
import {
  registerSubProgramMember,
  updateSubProgramMember,
  findMemberByNameAndPhone
} from "../services/subProgramMemberAPI";
import { getAgeGroup } from "../utils/ageGroup";

// 연락처 정규화
function normalizePhone(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.length === 11
    ? `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    : phone || "";
}

// 생년월일 정규화
function normalizeDate(date) {
  if (!date) return "";
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  try {
    if (typeof date === "number") {
      const excelStart = new Date(1899, 11, 30);
      const d = new Date(excelStart.getTime() + (date - 1) * 86400000);
      return d.toISOString().split("T")[0];
    }
    const d = new Date(date);
    return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

const REQUIRED_HEADERS = ["이용자명", "세부사업명"];

function SubProgramMemberUploadForm({ onSuccess, onClose, userInfo }) {
  const fileInput = useRef();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const isTeacher = userInfo?.role === "teacher";

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

      const firstRow = Object.keys(raw[0]);
      const missingHeaders = REQUIRED_HEADERS.filter(h => !firstRow.includes(h));
      if (missingHeaders.length > 0) {
        setResult({ error: `누락된 헤더: ${missingHeaders.join(", ")}` });
        setUploading(false);
        return;
      }

      let successRows = [], failRows = [];

      for (let idx = 0; idx < raw.length; idx++) {
        const row = raw[idx];
        const name = row["이용자명"]?.trim();
        const subProgram = row["세부사업명"]?.trim();
        if (!name || !subProgram) {
          failRows.push({ idx: idx + 2, reason: "필수값 누락 (이용자명, 세부사업명)" });
          continue;
        }

        if (isTeacher && !(userInfo?.subPrograms || []).includes(subProgram)) {
          failRows.push({ idx: idx + 2, reason: `접근 불가한 세부사업명: ${subProgram}` });
          continue;
        }

        const phone = normalizePhone(row["연락처"]);
        const birthdate = normalizeDate(row["생년월일"]);
        const ageGroup = row["연령대"] || (birthdate ? getAgeGroup(birthdate.slice(0, 4)) : "");

        const memberData = {
          name,
          gender: row["성별"]?.trim() || "",
          phone,
          birthdate,
          address: row["주소"]?.trim() || "",
          incomeType: row["소득구분"]?.trim() || "",
          disability: row["장애유무"]?.trim() || "",
          paidType: row["유료/무료"]?.trim() || "",
          status: row["이용상태"]?.trim() || "이용",
          subProgram,
          note: row["비고"]?.trim() || "",
          ageGroup,
          createdAt: new Date().toISOString()
        };

        try {
          const existing = await findMemberByNameAndPhone(name, phone);
          if (existing && existing.subProgram === subProgram) {
            await updateSubProgramMember(existing.id, memberData);
          } else {
            await registerSubProgramMember(memberData);
          }
          successRows.push(memberData);
        } catch (error) {
          failRows.push({ idx: idx + 2, reason: error.message || "등록 오류" });
        }
      }

      setResult({
        success: successRows.length,
        fail: failRows.length,
        failRows
      });

      if (typeof onSuccess === "function") {
        onSuccess(successRows);
      }
    } catch (err) {
      setResult({ error: err.message });
    }

    setUploading(false);
  };

  if (isTeacher) {
    return (
      <Paper sx={{ my: 2, p: 3 }}>
        <Alert severity="warning">
          강사는 대량 이용자 업로드 기능을 사용할 수 없습니다.
        </Alert>
        <Button onClick={onClose} sx={{ mt: 2 }}>닫기</Button>
      </Paper>
    );
  }

  return (
    <Paper sx={{ my: 2, p: 3, minWidth: 600, mx: "auto" }}>
      <Typography variant="h6" gutterBottom>
        세부사업 이용자 대량 업로드
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

      {result?.success > 0 && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {result.success}명 등록/업데이트 완료
          {result.fail > 0 && (
            <>
              <br />
              <strong style={{ color: "#d32f2f" }}>
                {result.fail}건 실패:
              </strong>
              <br />
              {result.failRows?.slice(0, 5).map((r) => (
                <span key={r.idx}>엑셀 {r.idx}행: {r.reason}<br /></span>
              ))}
              {result.failRows?.length > 5 && " ..."}
            </>
          )}
        </Alert>
      )}
      {result?.error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          오류: {result.error}
        </Alert>
      )}

      <Typography variant="body2" sx={{ mt: 2 }}>
        <strong>※ 필수 항목:</strong> <code>이용자명, 세부사업명</code><br />
        <strong>선택 항목:</strong> 성별, 생년월일, 연락처, 주소, 소득구분, 장애유무, 유료/무료, 이용상태, 비고 등
      </Typography>

      <Button onClick={onClose} sx={{ mt: 2 }}>
        닫기
      </Button>
    </Paper>
  );
}

export default SubProgramMemberUploadForm;