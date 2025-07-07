import React from "react";
import { Checkbox, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";

function AttendanceTable({ members, selected, onChange }) {
  const toggle = (member) => {
    if (selected.find(m => m.userId === member.userId)) {
      onChange(selected.filter(m => m.userId !== member.userId));
    } else {
      onChange([...selected, member]);
    }
  };

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>출석</TableCell>
          <TableCell>이름</TableCell>
          <TableCell>성별</TableCell>
          <TableCell>유/무료</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {members.map(member => (
          <TableRow key={member.userId}>
            <TableCell>
              <Checkbox
                checked={selected.some(m => m.userId === member.userId)}
                onChange={() => toggle(member)}
              />
            </TableCell>
            <TableCell>{member.name}</TableCell>
            <TableCell>{member.gender}</TableCell>
            <TableCell>{member.paidType}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default AttendanceTable;