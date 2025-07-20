import React, { useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Divider,
} from "@mui/material";

function SubProgramMemberModal({ open, onClose, 세부사업명, members = [], userInfo }) {
  const role = userInfo?.role;
  const allowedSubPrograms = userInfo?.subPrograms || [];

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSubProgram = m.세부사업명 === 세부사업명;
      if (!matchesSubProgram) return false;

      if (role === "teacher") {
        return allowedSubPrograms.includes(m.세부사업명);
      }

      return true;
    });
  }, [members, 세부사업명, role, allowedSubPrograms]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        세부사업 참여자 목록: <strong>{세부사업명}</strong>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" gutterBottom>
          총 인원: {filteredMembers.length.toLocaleString()}명
        </Typography>

        <Divider sx={{ my: 2 }} />

        {filteredMembers.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>팀명</TableCell>
                  <TableCell>단위사업명</TableCell>
                  <TableCell>세부사업명</TableCell>
                  <TableCell>이용자명</TableCell>
                  <TableCell>성별</TableCell>
                  <TableCell>연락처</TableCell>
                  <TableCell>생년월일</TableCell>
                  <TableCell>연령대</TableCell>
                  <TableCell>소득구분</TableCell>
                  <TableCell>유료/무료</TableCell>
                  <TableCell>이용상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMembers.map((member, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{member.팀명 || "-"}</TableCell>
                    <TableCell>{member.단위사업명 || "-"}</TableCell>
                    <TableCell>{member.세부사업명 || "-"}</TableCell>
                    <TableCell>{member.이용자명 || "-"}</TableCell>
                    <TableCell>{member.성별 || "-"}</TableCell>
                    <TableCell>{member.연락처 || "-"}</TableCell>
                    <TableCell>{member.생년월일 || "-"}</TableCell>
                    <TableCell>{member.연령대 || "-"}</TableCell>
                    <TableCell>{member.소득구분 || "-"}</TableCell>
                    <TableCell>{member.유료무료 || "-"}</TableCell>
                    <TableCell>{member.이용상태 || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Typography variant="body2" color="textSecondary">
            해당 세부사업에 등록된 이용자가 없습니다.
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">닫기</Button>
      </DialogActions>
    </Dialog>
  );
}

export default SubProgramMemberModal;