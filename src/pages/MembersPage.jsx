import React, { useEffect, useState } from "react";
import { getAllMembers, getMembersBySubProgram } from "../services/memberAPI";
import { useUser } from "../contexts/AuthContext";

const MembersPage = () => {
  const { currentUser } = useUser();
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchMembers = async () => {
      try {
        if (currentUser.role === "admin") {
          const data = await getAllMembers();
          setMembers(data);
        } else if (currentUser.role === "teacher") {
          const data = await getMembersBySubProgram(currentUser.subProgram);
          setMembers(data);
        }
      } catch (error) {
        console.error("회원 정보 불러오기 오류:", error);
      }
    };

    fetchMembers();
  }, [currentUser]);

  return (
    <div>
      <h1>회원 목록</h1>
      <ul>
        {members.map(member => (
          <li key={member.id}>{member.name} - {member.subProgram}</li>
        ))}
      </ul>
    </div>
  );
};

export default MembersPage;