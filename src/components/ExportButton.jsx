import React from "react";
import { Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver"; // ✅ Blob 다운로드를 위해 추가

/**
 * 엑셀로 데이터를 다운로드하는 통합 ExportButton 컴포넌트입니다.
 *
 * @param {Array<Object>} data - 다운로드할 JSON 데이터
 * @param {string} fileName - 저장할 파일 이름 (예: "이용자목록.xlsx")
 * @param {string} label - 버튼에 표시할 텍스트 (기본값: "엑셀 다운로드")
 * @param {Array<[string, string]>} headers - [key, label] 배열로 내보낼 열 순서와 한글명 지정 (선택)
 * @param {string} sheetName - 시트명 (기본값: "내보내기")
 * @param {boolean} addDateToFileName - 파일명에 오늘 날짜 자동 추가 (기본값: true)
 */
function ExportButton({
  data,
  fileName = "이용자목록.xlsx",
  label = "엑셀 다운로드",
  headers,
  sheetName = "내보내기",
  addDateToFileName = true
}) {
  const DEFAULT_HEADERS = [
    ["id", "고유아이디"],
    ["name", "이름"],
    ["gender", "성별"],
    ["birthdate", "생년월일"],
    ["ageGroup", "나이"],
    ["phone", "연락처"],
    ["address", "주소"],
    ["district", "행정동"],
    ["incomeType", "소득구분"]
  ];

  const getAutoHeaders = () => {
    if (Array.isArray(data) && data.length > 0) {
      return Object.keys(data[0]).map((key) => [key, key]);
    }
    return [];
  };

  const EXPORT_HEADERS =
    headers && headers.length > 0
      ? headers
      : DEFAULT_HEADERS.length > 0
      ? DEFAULT_HEADERS
      : getAutoHeaders();

  const getFileNameWithDate = () => {
    if (!addDateToFileName) return fileName;
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const ext = fileName.endsWith(".xlsx") ? "" : ".xlsx";
    const base = fileName.replace(/\.xlsx$/i, "");
    return `${base}_${y}${m}${d}${ext}`;
  };

  const handleExport = () => {
    if (!Array.isArray(data) || data.length === 0) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    const exportData = data.map((row) => {
      const formatted = {};
      EXPORT_HEADERS.forEach(([key, label]) => {
        formatted[label] = row[key] !== undefined && row[key] !== null ? row[key] : "";
      });
      return formatted;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData, { skipHeader: true });

    // ✅ 첫 행에 한글 헤더 삽입
    XLSX.utils.sheet_add_aoa(worksheet, [EXPORT_HEADERS.map(([, label]) => label)], {
      origin: "A1"
    });

    // ✅ 열 너비 자동 설정
    const colWidths = EXPORT_HEADERS.map(([key, label]) => {
      const maxLen = Math.max(
        label.length,
        ...data.map((row) => (row[key] ? String(row[key]).length : 0))
      );
      return { wch: Math.max(8, Math.min(maxLen + 2, 30)) };
    });
    worksheet["!cols"] = colWidths;

    // ✅ 워크북 생성 및 시트 추가
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // ✅ 엑셀 파일 버퍼로 변환
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array"
    });

    // ✅ Blob 생성 (정확한 MIME 타입 지정)
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    // ✅ 파일 저장
    saveAs(blob, getFileNameWithDate());
  };

  return (
    <Button
      variant="outlined"
      startIcon={<DownloadIcon />}
      onClick={handleExport}
      sx={{ mb: 2, minWidth: 140 }}
      disabled={!Array.isArray(data) || data.length === 0}
    >
      {label}
    </Button>
  );
}

export default ExportButton;