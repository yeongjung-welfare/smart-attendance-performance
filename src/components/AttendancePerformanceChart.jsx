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

function AttendancePerformanceChart({ mode, data }) {
  if (mode === "attendance") {
    // ✅ 일별 출석자 수 차트
    const labels = data.map(d => d.date);
    const chartData = {
      labels,
      datasets: [
        {
          label: "일별 출석자 수",
          data: data.map(d => d.출석),
          borderColor: "#43a047",
          backgroundColor: "#a5d6a7",
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
          text: "최근 7일간 출석자 수",
          font: { size: 16 }
        }
      },
      scales: {
        x: { title: { display: true, text: "날짜" } },
        y: { title: { display: true, text: "출석 인원" }, beginAtZero: true }
      }
    };
    return (
      <div>
        <h3 className="font-bold mb-2">일별 출석 차트</h3>
        <Line data={chartData} options={options} key={JSON.stringify(chartData)} />
      </div>
    );
  }

  // ✅ 월별 실적 합계 차트
  const labels = data.map(d => d.date || d.month);
  const chartData = {
    labels,
    datasets: [
      {
        label: "월별 실적",
        data: data.map(d => d.실적),
        backgroundColor: "#1976d2"
      }
    ]
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { display: true, position: "top" },
      title: {
        display: true,
        text: "최근 월별 실적 (연인원 기준)",
        font: { size: 16 }
      }
    },
    scales: {
      x: { title: { display: true, text: "월" } },
      y: { title: { display: true, text: "연인원 수" }, beginAtZero: true }
    }
  };
  return (
    <div>
      <h3 className="font-bold mb-2">월별 실적 차트</h3>
      <Bar data={chartData} options={options} key={JSON.stringify(chartData)} />
    </div>
  );
}

export default AttendancePerformanceChart;