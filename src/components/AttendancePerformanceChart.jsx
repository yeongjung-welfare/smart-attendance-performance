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
    // 일별 출석자 수 차트
    const labels = data.map(d => d.date);
    const chartData = {
      labels,
      datasets: [
        {
          label: "일별 출석자 수",
          data: data.map(d => d.출석),
          borderColor: "#43a047",
          backgroundColor: "#a5d6a7",
          fill: true
        }
      ]
    };
    const options = {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: false }
      }
    };
    return (
      <div>
        <h3 className="font-bold mb-2">일별 출석 차트</h3>
        <Line data={chartData} options={options} key={JSON.stringify(chartData)} />
      </div>
    );
  }

  // 실적: 월별 실적 합계 차트
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
      legend: { display: false },
      title: { display: false }
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