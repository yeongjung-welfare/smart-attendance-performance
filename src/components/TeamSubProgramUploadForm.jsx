import React from "react";
import * as XLSX from "xlsx";
import { addTeamSubProgramMap } from "../services/teamSubProgramMapAPI";

function TeamSubProgramUploadForm({ onUploadComplete }) {
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      alert("파일이 선택되지 않았습니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      let successCount = 0;
      let failCount = 0;
      const failedRows = []; // 실패한 행 기록

      for (const row of json) {
        const 세부사업명 = row["세부사업명"]?.toString().trim();
        const 팀명 = row["팀명"]?.toString().trim();
        const 기능 = row["기능"]?.toString().trim();
        const 단위사업명 = row["단위사업명"]?.toString().trim();

        if (세부사업명 && 팀명 && 기능 && 단위사업명) {
          try {
            await addTeamSubProgramMap(
              {
                subProgramName: 세부사업명,
                teamName: 팀명,
                functionType: 기능,
                mainProgramName: 단위사업명,
              },
              true // 중복 시 덮어쓰기
            );
            successCount++;
          } catch (err) {
            console.error("업로드 실패 - 행 데이터:", row, "오류:", err.message);
            failCount++;
            failedRows.push({ row, error: err.message });
          }
        } else {
          console.error("필수 필드 누락 - 행 데이터:", row);
          failCount++;
          failedRows.push({ row, error: "필수 필드 누락" });
        }
      }

      // 실패한 행 상세 알림
      if (failCount > 0) {
        let failDetails = failedRows
          .map((item, index) => `${index + 1}: ${JSON.stringify(item.row)} - ${item.error}`)
          .join("\n");
        alert(
          `업로드 완료: 성공 ${successCount}건 / 실패 ${failCount}건\n\n실패 상세:\n${
            failDetails || "상세 오류 없음"
          }`
        );
      } else {
        alert(`업로드 완료: 성공 ${successCount}건 / 실패 ${failCount}건`);
      }
      if (onUploadComplete) onUploadComplete();
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="mb-6">
      <label className="block mb-2 font-semibold">📁 Excel 업로드</label>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      <div className="text-sm text-gray-600 mt-2">
        <p>✅ <strong>업로드 파일 형식 안내 (헤더명 일치 필수)</strong></p>
        <ul className="list-disc ml-5 mt-1">
          <li>세부사업명</li>
          <li>팀명</li>
          <li>기능</li>
          <li>단위사업명</li>
        </ul>
        <details className="mt-2">
          <summary className="cursor-pointer text-blue-600 underline">예시 보기</summary>
          <pre className="bg-gray-100 p-2 rounded text-xs whitespace-pre-wrap mt-2">
세부사업명,팀명,기능,단위사업명
이미용 서비스,마을돌봄팀,서비스제공 기능,일상생활지원
경로식당,마을돌봄팀,서비스제공 기능,저소득 어르신 무료급식지원사업
          </pre>
        </details>
      </div>
    </div>
  );
}

export default TeamSubProgramUploadForm;