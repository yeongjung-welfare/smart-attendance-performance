import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { isPresent } from "../utils/attendanceUtils";

// 전체 회원 수
export async function getTotalMembers() {
  const snapshot = await getDocs(collection(db, "Members"));
  return snapshot.size;
}

// 오늘 출석 수
export async function getTodayAttendance() {
  const today = new Date().toISOString().slice(0, 10);
  const q = query(collection(db, "AttendanceRecords"), where("날짜", "==", today));
  const snapshot = await getDocs(q);
  let count = 0;
  snapshot.docs.forEach(doc => {
    const d = doc.data();
    if (isPresent(d.출석여부)) count++;
  });
  return count;
}

// 승인 대기자 수
export async function getPendingUsers() {
  const q = query(collection(db, "Users"), where("approved", "==", false));
  const snapshot = await getDocs(q);
  return snapshot.size;
}

// 이달 신규 등록자 수 (회원 등록일자 기준)
export async function getTotalNewUsersThisMonth() {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7); // "YYYY-MM"
  const snapshot = await getDocs(collection(db, "Members"));
  let count = 0;
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const regMonth = data.createdAt?.slice(0, 7);
    if (regMonth === currentMonth) count++;
  });
  return count;
}

// 총 프로그램 수 (세부사업명 기준 유니크 개수)
export async function getTotalPrograms() {
  const snapshot = await getDocs(collection(db, "ProgramStructure"));
  const set = new Set();
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.세부사업명) set.add(data.세부사업명);
  });
  return set.size;
}

// 인기 세부사업 (연인원 기준 TOP1)
export async function getTopSubProgram() {
  const snapshot = await getDocs(collection(db, "PerformanceSummary"));
  const counts = {};
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    // 대량/개별실적 구분 없이 연인원 누적
    const sub = data.세부사업명;
    const total = Number(data.연인원) || 0;
    if (sub) counts[sub] = (counts[sub] || 0) + total;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : "없음";
}

// 최근 월별 실적 (연인원 기준, 기능/팀명/단위사업명도 반환)
export async function getMonthlyPerformanceData(months = 5) {
  const q = collection(db, "PerformanceSummary");
  const snapshot = await getDocs(q);
  // 월별, 기능, 팀명, 단위사업명, 세부사업명별 집계
  const map = new Map();

  snapshot.docs.forEach(doc => {
    const d = doc.data();
    const month = d.날짜?.slice(0, 7);
    if (!month) return;
    const key = [
      d.function || "",
      d.team || "",
      d.unit || "",
      d.세부사업명 || "",
      month
    ].join("|");
    const prev = map.get(key) || { 연인원: 0, function: d.function, team: d.team, unit: d.unit, subProgram: d.세부사업명, month };
    prev.연인원 += Number(d.연인원) || 0;
    map.set(key, prev);
  });

  // 최근 N개월 데이터만 반환
  return [...map.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-months);
}

// 최근 7일 출석 통계 (프로그램별+날짜별 1회만 집계)
export async function getRecentAttendanceData(days = 7) {
  const q = collection(db, "AttendanceRecords");
  const snapshot = await getDocs(q);
  // 프로그램별+날짜별 1회만 집계
  const map = new Map();
  const sessionSet = new Set();

  snapshot.docs.forEach(doc => {
    const d = doc.data();
    const date = d.날짜;
    const subProgram = d.세부사업명 || "";
    if (!date || !subProgram) return;
    // 프로그램별+날짜별 1회만
    const sessionKey = `${subProgram}_${date}`;
    if (sessionSet.has(sessionKey)) return;
    sessionSet.add(sessionKey);

    const prev = map.get(date) || 0;
    map.set(date, prev + 1);
  });

  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-days)
    .map(([date, 횟수]) => ({ date, 횟수 }));
}