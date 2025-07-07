import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function PerformanceChart({ data }) {
  const chartData = {
    labels: data.map(d => d.month),
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
      <Bar
        data={chartData}
        options={options}
        key={JSON.stringify(chartData)}
      />
    </div>
  );
}

export default PerformanceChart;