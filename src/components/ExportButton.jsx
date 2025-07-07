import React from "react";
import { Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import * as XLSX from "xlsx";

/**
 * 엑셀로 데이터를 다운로드하는 컴포넌트입니다.
 * 
 * @param {Array<Object>} data - 다운로드할 JSON 데이터
 * @param {string} fileName - 저장할 파일 이름 (예: "이용자목록.xlsx")
 * @param {string} label - 버튼에 표시할 텍스트 (기본값: "엑셀 다운로드")
 */
function ExportButton({ data, fileName = "이용자목록.xlsx", label = "엑셀 다운로드" }) {
  const HEADERS = [
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

  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    // 데이터 열 순서 맞춰서 재구성
    const exportData = data.map((row) => {
      const formatted = {};
      HEADERS.forEach(([key, label]) => {
        formatted[label] = row[key] || "";
      });
      return formatted;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "이용자 목록");

    XLSX.writeFile(workbook, fileName);
  };

  return (
    <Button
      variant="outlined"
      startIcon={<DownloadIcon />}
      onClick={handleExport}
      sx={{ mb: 2 }}
    >
      {label}
    </Button>
  );
}

export default ExportButton;