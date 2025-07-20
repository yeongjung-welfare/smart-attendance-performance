import React from "react";
import {
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Apps as AppsIcon,
  School as SchoolIcon
} from "@mui/icons-material";

// 색상 맵핑 (MUI theme color 기준)
const colorMap = {
  primary: { bg: "#e3f2fd", text: "#1976d2" },
  success: { bg: "#e8f5e9", text: "#388e3c" },
  warning: { bg: "#fffde7", text: "#fbc02d" },
  info: { bg: "#e3f7fc", text: "#0288d1" },
  error: { bg: "#ffebee", text: "#d32f2f" },
  secondary: { bg: "#f3e5f5", text: "#7b1fa2" },
  default: { bg: "#f5f5f5", text: "#333" }
};

const iconMap = {
  "전체 회원 수": <PeopleIcon fontSize="inherit" />,
  "오늘 출석": <CheckCircleIcon fontSize="inherit" />,
  "승인 대기자": <HourglassEmptyIcon fontSize="inherit" />,
  "프로그램 수": <AppsIcon fontSize="inherit" />,
  "강사 수": <SchoolIcon fontSize="inherit" />,
  "이달 신규등록자": <PeopleIcon fontSize="inherit" />,
  "인기 세부사업": <AppsIcon fontSize="inherit" />
};

function DashboardCard({ title, value, color = "primary" }) {
  const icon = iconMap[title] || <AppsIcon fontSize="inherit" />;
  const colorSet = colorMap[color] || colorMap.default;

  return (
    <div
      className="flex-1 min-w-[150px] max-w-[100%] sm:max-w-[240px] bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-200 p-4"
      style={{
        background: colorSet.bg,
        color: colorSet.text,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            background: "#fff",
            width: 44,
            height: 44,
            fontSize: 32,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
          }}
        >
          {icon}
        </div>
        <h3
          className="font-semibold truncate"
          style={{
            fontSize: "1.05rem",
            maxWidth: "110px"
          }}
          title={title}
        >
          {title}
        </h3>
      </div>
      <p
        className="font-bold"
        style={{
          fontSize: "2.1rem",
          wordBreak: "break-all",
          lineHeight: 1.1
        }}
      >
        {value}
      </p>
    </div>
  );
}

export default DashboardCard;