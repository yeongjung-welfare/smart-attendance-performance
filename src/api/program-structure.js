// src/api/program-structure.js

// Cloud Functions + Hosting 환경에서는 환경 분기 없이 아래처럼 사용!
export async function fetchProgramStructure() {
  const res = await fetch("/api/program-structure");
  if (!res.ok) throw new Error("사업구조 불러오기 실패");
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("서버에서 올바른 JSON이 반환되지 않았습니다.");
  }
  return await res.json();
}

export async function saveProgramStructure(data) {
  const res = await fetch("/api/program-structure", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error("사업구조 저장 실패: " + errorText);
  }
  return await res.json();
}

export async function updateProgramStructure(key, updatedData) {
  const res = await fetch(`/api/program-structure/${key}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(updatedData)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error("사업구조 수정 실패: " + errorText);
  }

  return await res.json();
}

export async function deleteProgramStructure(key) {
  const res = await fetch(`/api/program-structure/${key}`, {
    method: "DELETE"
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error("사업구조 삭제 실패: " + errorText);
  }

  return await res.json();
}