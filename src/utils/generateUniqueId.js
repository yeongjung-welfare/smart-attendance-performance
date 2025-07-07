// utils/generateUniqueId.js
// UUID 기반 고유 ID 생성 유틸

import { v4 as uuidv4 } from "uuid";

/**
 * UUID를 기반으로 고유 식별자 생성
 * 예: 'b3f9e6ac-51b4-4e90-9fcd-21e829f0e59a'
 *
 * @returns {string} 고유 UUID 문자열
 */
export default function generateUniqueId() {
  return uuidv4();
}