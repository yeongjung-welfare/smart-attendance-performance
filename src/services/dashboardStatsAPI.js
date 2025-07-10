// ✅ services/dashboardStatsAPI.js
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

// 전체 회원 수
export async function getTotalMembers() {
  const snapshot = await getDocs(collection(db, "Members"));
  return snapshot.size;
}

// 오늘 출석 수
export async function getTodayAttendance() {
  const today = new Date().toISOString().slice(0, 10);
  const q = query(collection(db, "AttendanceRecords"), where("date", "==", today));
  const snapshot = await getDocs(q);
  return snapshot.size;
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
    if (data.subProgramName) set.add(data.subProgramName);
  });
  return set.size;
}

// 인기 세부사업 (연인원 기준 TOP1)
export async function getTopSubProgram() {
  const snapshot = await getDocs(collection(db, "PerformanceSummary"));
  const counts = {};
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const sub = data.subProgram;
    const total = Number(data.total) || 0;
    counts[sub] = (counts[sub] || 0) + total;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : "없음";
}

// 최근 월별 실적 (연인원 기준)
export async function getMonthlyPerformanceData(months = 5) {
  const q = collection(db, "PerformanceSummary");
  const snapshot = await getDocs(q);
  const map = new Map();

  snapshot.docs.forEach(doc => {
    const d = doc.data();
    const month = d.date?.slice(0, 7);
    if (!month) return;
    const prev = map.get(month) || 0;
    map.set(month, prev + (Number(d.total) || 0));
  });

  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-months)
    .map(([date, 실적]) => ({ date, 실적 }));
}

// 최근 7일 출석 통계
export async function getRecentAttendanceData(days = 7) {
  const q = collection(db, "AttendanceRecords");
  const snapshot = await getDocs(q);
  const map = new Map();

  snapshot.docs.forEach(doc => {
    const d = doc.data();
    const date = d.date;
    if (!date) return;
    const prev = map.get(date) || 0;
    map.set(date, prev + 1);
  });

  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-days)
    .map(([date, 출석]) => ({ date, 출석 }));
}