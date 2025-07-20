import React from "react";
import { Table, TableHead, TableRow, TableCell, TableBody, Button, Chip } from "@mui/material";

const statusLabels = {
  pending: "대기중",
  admin: "관리자 승인",
  teacher: "강사 승인",
  rejected: "거절"
};

function PendingUserTable({ users = [], status, onApprove, onReject, onCancel }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>이름</TableCell>
          <TableCell>이메일</TableCell>
          <TableCell>가입일시</TableCell>
          <TableCell align="center">상태 / 관리</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} align="center">해당 상태의 이용자가 없습니다.</TableCell>
          </TableRow>
        ) : (
          users.map(user => (
            <TableRow key={user.id}>
              <TableCell>{user.name || (user.이용자명 ? user.이용자명 : "-")}</TableCell>
              <TableCell>{user.email || "-"}</TableCell>
              <TableCell>{user.createdAt || (user.업로드일 ? user.업로드일 : "-")}</TableCell>
              <TableCell align="center">
                {status === "pending" ? (
                  <>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      sx={{ mr: 1 }}
                      onClick={() => onApprove(user.id, "admin", user.isNewMember || false)}
                    >
                      관리자 승인
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="small"
                      sx={{ mr: 1 }}
                      onClick={() => onApprove(user.id, "teacher", user.isNewMember || false)}
                    >
                      강사 승인
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => onReject(user.id)}
                    >
                      거절
                    </Button>
                  </>
                ) : (
                  <>
                    <Chip
                      label={statusLabels[status]}
                      color={
                        status === "admin"
                          ? "primary"
                          : status === "teacher"
                          ? "secondary"
                          : status === "rejected"
                          ? "error"
                          : "default"
                      }
                      sx={{ mr: 1 }}
                    />
                    {/* 승인/거절 상태에서 취소 버튼 추가 */}
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => onCancel(user.id)}
                    >
                      취소
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export default PendingUserTable;