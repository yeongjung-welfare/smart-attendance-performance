/**
 * 출생연도를 기반으로 연령대(2025년 기준)를 반환
 * @param {string|number} birthYear - 출생연도 (예: 1985)
 * @param {number} baseYear - 기준년도 (기본값: 2025)
 * @returns {string} 연령대 (예: "30대", "70대 이상", "미상")
 */
export function getAgeGroup(birthYear, baseYear = 2025) {
  const year = parseInt(birthYear, 10);

  // 유효하지 않은 연도 처리
  if (!year || isNaN(year) || year > baseYear) return "미상";

  const age = baseYear - year;

  if (age <= 7) return "0~7세(영유아)";
  if (age <= 19) return "10대";
  if (age <= 29) return "20대";
  if (age <= 39) return "30대";
  if (age <= 49) return "40대";
  if (age <= 59) return "50대";
  if (age <= 69) return "60대";
  return "70대 이상";
}