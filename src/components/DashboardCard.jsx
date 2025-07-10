import React from "react";
import {
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Apps as AppsIcon,
  School as SchoolIcon
} from "@mui/icons-material";

const iconMap = {
  "전체 회원 수": <PeopleIcon fontSize="large" />,
  "오늘 출석": <CheckCircleIcon fontSize="large" />,
  "승인 대기자": <HourglassEmptyIcon fontSize="large" />,
  "프로그램 수": <AppsIcon fontSize="large" />,
  "강사 수": <SchoolIcon fontSize="large" />
};

function DashboardCard({ title, value, color = "primary" }) {
  const icon = iconMap[title] || <AppsIcon fontSize="large" />;

  return (
    <div
      className={`w-full sm:w-[240px] rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-200 p-4 text-${color}-800 bg-${color}-100`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="text-4xl">{icon}</div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

export default DashboardCard;