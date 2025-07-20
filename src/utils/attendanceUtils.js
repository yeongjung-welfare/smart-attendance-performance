// src/utils/attendanceUtils.js
export function isPresent(attendance) {
  // 불리언 true, 문자열 "true", 숫자 1만 출석으로 인정 (나머지는 결석)
  return attendance === true || attendance === "true" || attendance === 1;
}