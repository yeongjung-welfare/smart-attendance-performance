import { v4 as uuidv4 } from "uuid";

export function generateUniqueId() {
  return `MEM-${uuidv4().replace(/-/g, "").slice(0, 12)}`;
}

// 일괄 출석 체크/해제 함수 (항상 true/false 반환)
export const setAllAttendance = (rows, checked) => {
  return rows.map(row => ({
    ...row,
    출석여부: checked === true // 명시적 불리언 처리
  }));
};