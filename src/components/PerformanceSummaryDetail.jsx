import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  Grid
} from "@mui/material";

function PerformanceSummaryDetail({ summary, onClose }) {
  if (!summary) return null;

  const {
    function: func,
    team,
    unit,
    subProgram,
    registered = {},
    actual = {},
    totalVisits = {},
    paid = {},
    free = {},
    sessions,
    cases,
    details = []
  } = summary;

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>상세 실적: {subProgram}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle1" gutterBottom>
          <strong>기능:</strong> {func} &nbsp;|&nbsp;
          <strong>팀명:</strong> {team} &nbsp;|&nbsp;
          <strong>단위사업명:</strong> {unit} &nbsp;|&nbsp;
          <strong>세부사업명:</strong> {subProgram}
        </Typography>
        <Grid container spacing={1} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">
              <strong>등록인원</strong> – 남: {registered.male ?? 0}, 여: {registered.female ?? 0}, 합: {registered.total ?? 0}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">
              <strong>실인원</strong> – 남: {actual.male ?? 0}, 여: {actual.female ?? 0}, 합: {actual.total ?? 0}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">
              <strong>연인원</strong> – 남: {totalVisits.male ?? 0}, 여: {totalVisits.female ?? 0}, 합: {totalVisits.total ?? 0}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">
              <strong>유료</strong> – 남: {paid.male ?? 0}, 여: {paid.female ?? 0}, 합: {paid.total ?? 0}<br />
              <strong>무료</strong> – 남: {free.male ?? 0}, 여: {free.female ?? 0}, 합: {free.total ?? 0}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2">
              <strong>횟수:</strong> {sessions ?? 0}회, <strong>건수:</strong> {cases ?? 0}건
            </Typography>
          </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" gutterBottom>📋 참여자 목록</Typography>
        {details.length > 0 ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>날짜</TableCell>
                <TableCell>이름</TableCell>
                <TableCell>성별</TableCell>
                <TableCell>출석</TableCell>
                <TableCell>비고</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {details.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.gender || "-"}</TableCell>
                  <TableCell>{item.result || "-"}</TableCell>
                  <TableCell>{item.note || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography variant="body2" color="text.secondary">참여자 정보가 없습니다.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
}

export default PerformanceSummaryDetail;