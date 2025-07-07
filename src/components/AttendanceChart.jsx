import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler // 👈 추가
} from "chart.js";
import { Line } from "react-chartjs-2";

// Filler 플러그인 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler // 👈 추가
);

function AttendanceChart({ data }) {
  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: "일별 출석자 수",
        data: data.map(d => d.출석),
        borderColor: "#43a047",
        backgroundColor: "#a5d6a7",
        fill: true // 👈 fill 옵션 사용 가능
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
      <Line
        data={chartData}
        options={options}
        key={JSON.stringify(chartData)}
      />
    </div>
  );
}

export default AttendanceChart;