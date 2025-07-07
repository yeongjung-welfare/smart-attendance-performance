// src/components/DashboardCard.jsx
import React from "react";
import { Card, CardContent, Typography } from "@mui/material";

function DashboardCard({ title, value, color = "primary" }) {
  return (
    <Card sx={{ minWidth: 200, bgcolor: `${color}.light`, color: `${color}.dark`, mb: 2 }}>
      <CardContent>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="h4" fontWeight="bold">{value}</Typography>
      </CardContent>
    </Card>
  );
}

export default DashboardCard;