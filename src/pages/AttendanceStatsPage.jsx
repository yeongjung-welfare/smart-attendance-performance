import React, { useState, useEffect } from "react";
import AttendanceStats from "../components/AttendanceStats";
import ExportButton from "../components/ExportButton";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import useSnackbar from "../components/useSnackbar"; // ✅ 에러 알림용

function AttendanceStatsPage() {
  const [allData, setAllData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [SnackbarComp, showSnackbar] = useSnackbar();

  // ✅ Firestore에서 전체 출석 데이터 로딩
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        const snapshot = await getDocs(collection(db, "AttendanceRecords"));
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // ✅ 데이터 정제 (필수 필드 누락 방지)
        const cleaned = docs.map(d => ({
          id: d.id,
          date: d.date || "",
          function: d.function || "",
          unit: d.unit || "",
          subProgram: d.subProgram || "",
          name: d.name || "",
          attended: d.attended === true // Boolean으로 처리
        }));

        setAllData(cleaned);
        setFiltered(cleaned); // 초기값: 전체 출력
      } catch (err) {
        console.error("출석 데이터 로딩 오류", err);
        showSnackbar("출석 데이터를 불러오지 못했습니다.", "error");
      }
    };

    fetchAttendanceData();
  }, []);

  return (
    <div className="p-6">
      {SnackbarComp}
      <h2 className="text-2xl font-bold mb-4">출석 통계</h2>

      {/* ✅ 필터링된 데이터만 엑셀로 내보내기 */}
      <ExportButton data={filtered} fileName="출석통계.xlsx" label="출석 엑셀 다운로드" />

      {/* ✅ 필터 컴포넌트: 내부에서 setFiltered 호출 */}
      <AttendanceStats data={allData} onFilter={setFiltered} />
    </div>
  );
}

export default AttendanceStatsPage;