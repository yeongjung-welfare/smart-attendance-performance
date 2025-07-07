// ✅ src/utils/programStructureHelper.js
// 세부사업명으로 기능/단위사업명 매핑 (클라이언트 측 보조 매핑)

const programStructureMap = {
  "노인건강교실": { function: "서비스제공기능", unit: "건강관리지원사업" },
  "아동돌봄교실": { function: "서비스제공기능", unit: "아동청소년지원" },
  "마을축제": { function: "지역조직화기능", unit: "주민조직화지원" },
  // ⚠ 필요한 세부사업명 전체 입력 요망
};

/**
 * 세부사업명 기준으로 기능/단위사업명 매핑
 * @param {string} subProgram 세부사업명
 * @returns {object|null} 매핑된 구조 { function, unit } 또는 null
 */
export function getStructureBySubProgram(subProgram) {
  return programStructureMap[subProgram.trim()] || null;
}