import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

/**
 * 실적 통계 데이터 fetch (기능/팀/단위/세부/월/분기별, 대량실적 포함)
 * filters: { function, team, unit, subProgram, months: [YYYY-MM, ...], quarters: [1,2,3,4] }
 */
export async function fetchPerformanceStats({
  function: func,
  team,
  unit,
  subProgram,
  months,
  quarters
}) {
  let q = collection(db, "PerformanceSummary");
  let constraints = [];
  if (func) constraints.push(where("function", "==", func));
  if (team) constraints.push(where("team", "==", team));
  if (unit) constraints.push(where("unit", "==", unit));
  if (subProgram) constraints.push(where("subProgram", "==", subProgram));
  if (months && months.length > 0) {
    constraints.push(where("month", "in", months));
  }
  // Firestore의 where("in")은 10개 제한, 분기 필터는 프론트에서 처리
  if (constraints.length > 0) {
    q = query(q, ...constraints);
  }
  const snapshot = await getDocs(q);

  // 집계
  const grouped = {};
  snapshot.docs.forEach(doc => {
    const d = doc.data();
    const year = d.date ? d.date.slice(0, 4) : d.year;
    const month = d.date ? d.date.slice(5, 7) : d.month;
    const quarter = month ? Math.ceil(parseInt(month, 10) / 3).toString() : "";
    // 분기 필터(프론트)
    if (quarters && quarters.length > 0 && !quarters.includes(quarter)) return;

    const key = [
      d.function, year, month, quarter, d.team, d.unit, d.subProgram
    ].join("|");

    if (!grouped[key]) {
      grouped[key] = {
        id: key,
        function: d.function || "",
        year,
        month,
        quarter,
        team: d.team || "",
        unit: d.unit || "",
        subProgram: d.subProgram || "",
        registered: 0,
        actualMale: 0,
        actualFemale: 0,
        actualTotal: 0,
        totalMale: 0,
        totalFemale: 0,
        totalSum: 0,
        paidMale: 0,
        paidFemale: 0,
        paidSum: 0,
        freeMale: 0,
        freeFemale: 0,
        freeSum: 0,
        sessions: 0,
        cases: 0
      };
    }
    // 등록 인원
    grouped[key].registered += Number(d.registered) || 0;
    // 실인원(남/여/합)
    if (d.gender === "남") grouped[key].actualMale += 1;
    if (d.gender === "여") grouped[key].actualFemale += 1;
    grouped[key].actualTotal = grouped[key].actualMale + grouped[key].actualFemale;
    // 연인원(남/여/합)
    if (d.gender === "남") grouped[key].totalMale += Number(d.total) || 0;
    if (d.gender === "여") grouped[key].totalFemale += Number(d.total) || 0;
    grouped[key].totalSum = grouped[key].totalMale + grouped[key].totalFemale;
    // 유료/무료(남/여/합)
    if (d.paidType === "유료") {
      if (d.gender === "남") grouped[key].paidMale += 1;
      if (d.gender === "여") grouped[key].paidFemale += 1;
    }
    if (d.paidType === "무료") {
      if (d.gender === "남") grouped[key].freeMale += 1;
      if (d.gender === "여") grouped[key].freeFemale += 1;
    }
    grouped[key].paidSum = grouped[key].paidMale + grouped[key].paidFemale;
    grouped[key].freeSum = grouped[key].freeMale + grouped[key].freeFemale;
    // 횟수/건수
    grouped[key].sessions += Number(d.sessions) || 0;
    grouped[key].cases += Number(d.cases) || 0;
  });

  return Object.values(grouped);
}