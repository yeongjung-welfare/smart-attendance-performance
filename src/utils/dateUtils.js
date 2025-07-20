export function normalizeDate(input) {
  if (!input) return "";

  // Excel 숫자형 날짜 처리
  if (typeof input === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30)); // 엑셀 기준 날짜
    const date = new Date(excelEpoch.getTime() + (input - 1) * 86400000);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // 문자열일 경우에만 match 사용
  if (typeof input !== "string") return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

  let match = input.match(/^(\d{4})[.\-/\s]+(\d{1,2})[.\-/\s]+(\d{1,2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  match = input.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const date = new Date(input);
  if (!isNaN(date.getTime())) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return "";
}