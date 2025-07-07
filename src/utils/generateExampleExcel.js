// ✅ src/utils/generateExampleExcel.js
import * as XLSX from "xlsx";

export function downloadExampleExcel() {
  // 샘플 데이터 (기능/단위사업명은 공란 → 자동 매핑 테스트용)
  const sampleData = [
    {
      "날짜": "2025-07-01",
      "세부사업명": "경로식당",
      "기능": "",
      "단위사업명": "",
      "이용자명": "홍길동",
      "성별": "남",
      "내용(특이사항)": ""
    },
    {
      "날짜": "2025-07-02",
      "세부사업명": "멘토링",
      "기능": "",
      "단위사업명": "",
      "이용자명": "김하늘",
      "성별": "여",
      "내용(특이사항)": "상담 내용 기록 필요"
    }
  ];

  // 워크북 생성
  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "실적업로드예시");

  // 엑셀 파일 다운로드
  XLSX.writeFile(workbook, "실적업로드_예시.xlsx");
}