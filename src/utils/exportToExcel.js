// src/utils/exportToExcel.js

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/**
 * JSON 데이터를 기반으로 엑셀(.xlsx) 파일로 내보냅니다.
 *
 * @param {Object} options
 * @param {Array} options.data - 엑셀로 변환할 JSON 배열
 * @param {string} [options.fileName="data"] - 저장할 파일 이름 (확장자는 자동으로 붙습니다)
 * @param {string} [options.sheetName="Sheet1"] - 시트 이름
 */
export function exportToExcel({ data, fileName = "data", sheetName = "Sheet1" }) {
  if (!Array.isArray(data) || data.length === 0) {
    alert("엑셀로 내보낼 데이터가 없습니다.");
    return;
  }

  try {
    // 1. 워크시트 생성
    const worksheet = XLSX.utils.json_to_sheet(data);

    // 2. 워크북 생성 및 워크시트 추가
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // 3. 워크북을 엑셀 버퍼로 변환
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array"
    });

        // ✅ 4. MIME 타입 명확히 지정 + UTF-8 인코딩
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"
    });

    // ✅ 5. 확장자 자동 보완
    const correctedFileName = fileName.endsWith(".xlsx")
      ? fileName
      : `${fileName}.xlsx`;

    // 6. 저장
       // 6. 안전한 저장 방식
    try {
      saveAs(blob, correctedFileName);
    } catch (saveError) {
      console.warn("saveAs 실패, 대체 방식 사용:", saveError);
      // 대체 다운로드 방식 (Safari 등 호환성)
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = correctedFileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
    } catch (error) {
    console.error("엑셀 내보내기 오류:", error);
    alert(`엑셀 내보내기 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
  }
}