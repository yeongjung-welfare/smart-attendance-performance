import React from "react";
import { Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import * as XLSX from "xlsx";

/**
 * 엑셀로 데이터를 다운로드하는 통합 ExportButton 컴포넌트입니다.
 * 
 * @param {Array<Object>} data - 다운로드할 JSON 데이터
 * @param {string} fileName - 저장할 파일 이름 (예: "이용자목록.xlsx")
 * @param {string} label - 버튼에 표시할 텍스트 (기본값: "엑셀 다운로드")
 * @param {Array<[string, string]>} headers - [key, label] 배열로 내보낼 열 순서와 한글명 지정 (필수 아님)
 * @param {string} sheetName - 시트명 (기본값: "내보내기")
 */
function ExportButton({
  data,
  fileName = "이용자목록.xlsx",
  label = "엑셀 다운로드",
  headers,
  sheetName = "내보내기"
}) {
  // 기본 헤더 정의 (headers prop이 없을 때 사용)
  const DEFAULT_HEADERS = [
    ["team", "팀명"],
    ["unitProgram", "단위사업명"],
    ["subProgram", "세부사업명"],
    ["name", "이용자명"],
    ["gender", "성별"],
    ["phone", "연락처"],
    ["birthdate", "생년월일"],
    ["ageGroup", "연령대"],
    ["address", "거주지"],
    ["incomeType", "소득구분"],
    ["disability", "장애유무"],
    ["paidType", "유료/무료"],
    ["status", "이용상태"],
    ["userId", "이용자번호"],
    ["note", "비고"]
  ];

  // 내보낼 헤더(순서/라벨) 결정
  const EXPORT_HEADERS = headers && headers.length > 0 ? headers : DEFAULT_HEADERS;

  const handleExport = () => {
    if (!Array.isArray(data) || data.length === 0) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    // 데이터 열 순서 및 한글 라벨 맞춰서 재구성
    const exportData = data.map((row) => {
      const formatted = {};
      EXPORT_HEADERS.forEach(([key, label]) => {
        // null/undefined도 빈 문자열로 처리
        formatted[label] = row[key] !== undefined && row[key] !== null ? row[key] : "";
      });
      return formatted;
    });

    // 시트 생성 및 엑셀 파일 저장
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    // 첫 행에 한글 라벨을 명시적으로 삽입 (헤더가 없을 경우 대비)
    XLSX.utils.sheet_add_aoa(worksheet, [EXPORT_HEADERS.map(([, label]) => label)], { origin: "A1" });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    XLSX.writeFile(workbook, fileName);
  };

  return (
    <Button
      variant="outlined"
      startIcon={<DownloadIcon />}
      onClick={handleExport}
      sx={{ mb: 2, minWidth: 160 }}
      disabled={!Array.isArray(data) || data.length === 0}
    >
      {label}
    </Button>
  );
}

export default ExportButton;