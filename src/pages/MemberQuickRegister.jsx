// ✅ src/pages/MemberQuickRegister.jsx
import React, { useState } from "react";
import MemberRegisterForm from "../components/MemberRegisterForm";
import {
  Paper,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { v4 as uuidv4 } from "uuid";
import { getAge } from "../utils/ageUtils";

function MemberQuickRegister() {
  const [members, setMembers] = useState([]);

  const handleRegister = (data) => {
    const isDuplicate = members.some(
      (m) =>
        m.name === data.name &&
        m.birthdate === data.birthdate &&
        m.phone === data.phone
    );
    if (!isDuplicate) {
      setMembers((prev) => [
        ...prev,
        {
          ...data,
          id: uuidv4(),
          age: getAge(data.birthdate),
          registrationDate: new Date().toISOString().slice(0, 10)
        }
      ]);
    }
  };

  const handleDelete = (id) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="p-8">
      <Typography variant="h5" gutterBottom>
        세부사업별 이용자 등록 (자동 고유회원 반영)
      </Typography>

      <Paper className="p-4 mb-6">
        <MemberRegisterForm onRegister={handleRegister} />
      </Paper>

      {members.length > 0 && (
        <Paper className="p-4">
          <Typography variant="h6">등록된 이용자</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>이름</TableCell>
                  <TableCell>성별</TableCell>
                  <TableCell>생년월일</TableCell>
                  <TableCell>연락처</TableCell>
                  <TableCell>주소</TableCell>
                  <TableCell>등록일자</TableCell>
                  <TableCell align="right">관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>{m.gender}</TableCell>
                    <TableCell>{m.birthdate}</TableCell>
                    <TableCell>{m.phone}</TableCell>
                    <TableCell>{m.address}</TableCell>
                    <TableCell>{m.registrationDate}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="삭제">
                        <IconButton onClick={() => handleDelete(m.id)}>
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </div>
  );
}

export default MemberQuickRegister;