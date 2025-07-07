// src/utils/ageUtils.js

/**
 * 생년월일 문자열(yyyy-MM-dd)로부터 나이를 계산
 * @param {string} birthdateStr - 생년월일 문자열 (예: "1990-05-12")
 * @returns {number} 계산된 만 나이
 */
export function getAge(birthdateStr) {
  if (!birthdateStr || typeof birthdateStr !== "string") return 0;

  // 다양한 구분자 처리 (-, /, .)
  const normalized = birthdateStr.replace(/[-./]/g, "-");
  const birthDate = new Date(normalized);
  const today = new Date();

  if (isNaN(birthDate.getTime()) || birthDate > today) return 0;

  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}