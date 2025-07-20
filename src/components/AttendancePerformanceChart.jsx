import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

// ChartJS 플러그인 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function getUniqueUserCountByDate(data) {
  const map = {};
  data.forEach(d => {
    if (!d.날짜 || !d.고유아이디) return;
    if (!map[d.날짜]) map[d.날짜] = new Set();
    map[d.날짜].add(d.고유아이디);
  });
  return Object.entries(map).map(([date, set]) => ({
    date,
    실인원: set.size,
    등록인원: data.filter(r => r.날짜 === date).reduce((sum, r) => sum + (r.등록인원 || 0), 0),
    연인원: data.filter(r => r.날짜 === date).reduce((sum, r) => sum + (r.연인원 || 0), 0)
  }));
}

function getMonthlyUniqueUserCount(data) {
  const map = {};
  data.forEach(d => {
    if (!d.날짜 || !d.고유아이디) return;
    const month = d.날짜.slice(0, 7);
    if (!map[month]) map[month] = new Set();
    map[month].add(d.고유아이디);
  });
  return Object.entries(map).map(([month, set]) => ({
    month,
    실인원: set.size
  }));
}

function getMonthlyTotalStats(data) {
  const map = {};
  data.forEach(d => {
    if (!d.날짜) return;
    const month = d.날짜.slice(0, 7);
    if (!map[month]) map[month] = { 연인원: 0, 건수: 0, 남성: 0, 여성: 0 };
    map[month].연인원 += d.연인원 || 0;
    map[month].건수 += d.건수 || 0;
    map[month].남성 += d.성별분리?.남성 || 0;
    map[month].여성 += d.성별분리?.여성 || 0;
  });
  return Object.entries(map).map(([month, stats]) => ({
    month,
    연인원: stats.연인원,
    건수: stats.건수,
    남성: stats.남성,
    여성: stats.여성
  }));
}

function AttendancePerformanceChart({ mode, data }) {
  if (mode === "attendance") {
    const uniqueCounts = getUniqueUserCountByDate(data);
    const labels = uniqueCounts.map(d => d.date);
    const chartData = {
      labels,
      datasets: [
        {
          label: "실인원",
          data: uniqueCounts.map(d => d.실인원),
          borderColor: "#43a047",
          backgroundColor: "rgba(67, 160, 71, 0.2)",
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: "등록인원",
          data: uniqueCounts.map(d => d.등록인원),
          borderColor: "#1976d2",
          backgroundColor: "rgba(25, 118, 210, 0.2)",
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: "연인원",
          data: uniqueCounts.map(d => d.연인원),
          borderColor: "#f57c00",
          backgroundColor: "rgba(245, 124, 0, 0.2)",
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };
    const options = {
      responsive: true,
      plugins: {
        legend: { display: true, position: "top" },
        title: {
          display: true,
          text: "최근 7일간 실적 통계",
          font: { size: 16 }
        }
      },
      scales: {
        x: { title: { display: true, text: "날짜" } },
        y: { title: { display: true, text: "인원 수" }, beginAtZero: true }
      }
    };
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="font-bold text-lg mb-4">일별 실적 통계</h3>
        <Line data={chartData} options={options} />
      </div>
    );
  }

  const monthlyStats = getMonthlyTotalStats(data);
  const labels = monthlyStats.map(d => d.month);

  const chartData = {
    labels,
    datasets: [
      {
        label: "연인원",
        data: monthlyStats.map(d => d.연인원),
        backgroundColor: "#90caf9"
      },
      {
        label: "건수",
        data: monthlyStats.map(d => d.건수),
        backgroundColor: "#ce93d8"
      },
      {
        label: "남성",
        data: monthlyStats.map(d => d.남성),
        backgroundColor: "#ff9800"
      },
      {
        label: "여성",
        data: monthlyStats.map(d => d.여성),
        backgroundColor: "#f06292"
      }
    ]
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { display: true, position: "top" },
      title: {
        display: true,
        text: "최근 월별 실적 통계",
        font: { size: 16 }
      }
    },
    scales: {
      x: { title: { display: true, text: "월" } },
      y: { title: { display: true, text: "인원/건수" }, beginAtZero: true }
    }
  };
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-bold text-lg mb-4">월별 실적 통계</h3>
      <Bar data={chartData} options={options} />
    </div>
  );
}

export default AttendancePerformanceChart;