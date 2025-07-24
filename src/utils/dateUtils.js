// ✅ 시간대 문제 완전 해결된 날짜 정규화 함수
export function normalizeDate(input) {
  if (!input) return "";

  // 엑셀 시리얼 넘버 처리 (UTC 변환 완전 방지)
  if (typeof input === "number") {
    // ✅ 엑셀 기준일을 정확히 계산 (1900-01-01 = 1)
    // 하지만 엑셀은 1900년을 윤년으로 잘못 처리하므로 보정 필요
    let days = Math.floor(input);
    
    // 엑셀 버그 보정: 1900년 2월 29일(존재하지 않음)을 고려
    if (days >= 60) {
      days = days - 1;
    }
    
    // 1900년 1월 1일을 기준으로 일수 계산 (로컬 시간)
    const baseDate = new Date(1900, 0, 1); // 1900년 1월 1일 로컬 시간
    const targetDate = new Date(baseDate.getTime() + (days - 1) * 86400000);
    
    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, "0");
    const d = String(targetDate.getDate()).padStart(2, "0");
    
    console.log("📅 엑셀 날짜 변환 (개선):", {
      원본시리얼: input,
      보정일수: days,
      변환결과: `${y}-${m}-${d}`,
      기준일: baseDate.toDateString()
    });
    
    return `${y}-${m}-${d}`;
  }

  // 문자열 처리
  if (typeof input !== "string") return "";

  // 이미 정규화된 형태
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

  // 다양한 형태의 날짜 문자열 파싱
  let match = input.match(/^(\d{4})[.\-/\s]+(\d{1,2})[.\-/\s]+(\d{1,2})/);
  if (match) {
    const [, y, m, d] = match;
    const month = parseInt(m, 10);
    const day = parseInt(d, 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }

  // YYYY/MM/DD 형식
  match = input.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (match) {
    const [, y, m, d] = match;
    const month = parseInt(m, 10);
    const day = parseInt(d, 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }

  // ✅ 마지막 시도: Date 객체로 변환 (로컬 시간 기준)
  try {
    // 시간대를 명시하지 않고 로컬 시간으로 처리
    const parts = input.match(/(\d{4})-?(\d{2})-?(\d{2})/);
    if (parts) {
      const [, year, month, day] = parts;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      if (!isNaN(date.getTime())) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
    }
  } catch (e) {
    console.warn("Date 객체 변환 실패:", e);
  }

  return "";
}

// ✅ Firebase 저장용 Date 객체 생성 (로컬 시간 기준)
export function toFirebaseDate(input) {
  if (!input) return null;

  const normalizedDate = normalizeDate(input);
  if (!normalizedDate) return null;

  try {
    // ✅ 로컬 시간 기준으로 Date 객체 생성 (UTC 변환 방지)
    const [year, month, day] = normalizedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return isNaN(date.getTime()) ? null : date;
  } catch (e) {
    console.warn("Firebase Date 변환 실패:", e);
    return null;
  }
}

// 화면 표시용 날짜 포맷 (YYYY-MM-DD)
export function formatDateForDisplay(date) {
  if (!date) return "";

  if (typeof date === "string") return normalizeDate(date);

  if (date instanceof Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return "";
}

// ✅ Firebase Timestamp에서 로컬 시간 기준 날짜 문자열 추출
export function extractDateFromFirebase(firebaseDate) {
  if (!firebaseDate) return "";

  let date;
  
  if (firebaseDate.toDate && typeof firebaseDate.toDate === 'function') {
    // Firestore Timestamp
    date = firebaseDate.toDate();
  } else if (firebaseDate instanceof Date) {
    date = firebaseDate;
  } else {
    return normalizeDate(firebaseDate);
  }

  // ✅ 로컬 시간 기준으로 날짜 추출
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 현재 날짜를 한국 시간 기준으로 반환
export function getCurrentKoreanDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
