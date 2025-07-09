const BASE_URL = 'https://smart-attendance-performance.onrender.com';
export async function fetchProgramStructure() {
  const res = await fetch(`${BASE_URL}/api/program-structure`);
  if (!res.ok) throw new Error("사업구조 불러오기 실패");
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("서버에서 올바른 JSON이 반환되지 않았습니다.");
  }
  return await res.json(); // 서버의 전체 JSON 구조 그대로 반환
}