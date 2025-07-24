import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  useMediaQuery
} from "@mui/material";
import {
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Apps as AppsIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon
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
  "전체 회원 수": <PeopleIcon />,
  "오늘 출석자": <CheckCircleIcon />,
  "승인 대기": <HourglassEmptyIcon />,
  "전체 프로그램": <AppsIcon />,
  "이번 달 신규 회원": <SchoolIcon />,
  "탑구B": <TrendingUpIcon />
};

function DashboardCard({ title, value, color = "default", icon }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const selectedColor = colorMap[color] || colorMap.default;
  const displayIcon = icon || iconMap[title] || <AppsIcon />;

  return (
    <Card 
      elevation={2}
      sx={{
        height: '100%',
        minHeight: { xs: 120, sm: 140 },
        background: `linear-gradient(135deg, ${selectedColor.bg} 0%, ${selectedColor.bg}dd 100%)`,
        border: `1px solid ${selectedColor.text}20`,
        borderRadius: 3,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 24px ${selectedColor.text}20`,
          '& .card-icon': {
            transform: 'scale(1.1)',
          }
        }
      }}
    >
      <CardContent 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: { xs: 2, sm: 3 },
          '&:last-child': { 
            paddingBottom: { xs: 2, sm: 3 }
          }
        }}
      >
        {/* 상단: 아이콘과 제목 */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            mb: 2
          }}
        >
          <Typography
            variant={isMobile ? "body2" : "subtitle1"}
            sx={{
              color: selectedColor.text,
              fontWeight: 600,
              lineHeight: 1.3,
              flex: 1,
              mr: 1
            }}
          >
            {title}
          </Typography>
          
          <Box
            className="card-icon"
            sx={{
              color: selectedColor.text,
              opacity: 0.8,
              transition: 'all 0.3s ease',
              '& svg': {
                fontSize: { xs: 28, sm: 32 }
              }
            }}
          >
            {displayIcon}
          </Box>
        </Box>

        {/* 하단: 값 표시 */}
        <Box>
          <Typography
            variant={isMobile ? "h4" : "h3"}
            sx={{
              color: selectedColor.text,
              fontWeight: 700,
              lineHeight: 1,
              fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' }
            }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default DashboardCard;