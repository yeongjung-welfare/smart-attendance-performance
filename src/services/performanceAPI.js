import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from "firebase/firestore";
import { db } from "../firebase";
import { getStructureBySubProgram } from "./teamSubProgramMapAPI"; // ✅ 교체된 자동 매핑 함수

const COLLECTION_NAME = "PerformanceSummary";

// ✅ 1. 전체 실적 가져오기
export async function fetchPerformances() {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ✅ 2. 확장 실적 요약 조회
export async function fetchPerformanceSummaries() {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  const data = snapshot.docs.map(doc => doc.data());
  return generateExtendedPerformanceSummaries(data);
}

// ✅ 3. 단건 저장
export async function savePerformance(data) {
  const collectionRef = collection(db, COLLECTION_NAME);
  const q = query(
    collectionRef,
    where("date", "==", data.date),
    where("subProgram", "==", data.subProgram),
    where("name", "==", data.name)
  );
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    throw new Error("이미 등록된 실적입니다.");
  }

  const docData = {
    ...data,
    attended: data.attended ?? (data.result?.trim() === "출석" || data.result?.trim() === "참여"),
    feeType: data.feeType ?? "",
    createdAt: new Date().toISOString()
  };

  const docRef = await addDoc(collectionRef, docData);
  return { id: docRef.id, ...docData };
}

// ✅ 4. 수정
export async function updatePerformance(id, data) {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, data);
  return { id, ...data };
}

// ✅ 5. 삭제
export async function deletePerformance(id) {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

// ✅ 6. 엑셀 업로드용 일괄 등록 (자동 매핑 반영)
export async function uploadPerformanceData(rows) {
  const results = [];
  const collectionRef = collection(db, COLLECTION_NAME);

  for (const row of rows) {
    let { 기능, 단위사업명, 세부사업명, 이름, 날짜 } = row;

    // ✅ 자동 매핑 (Firebase Firestore에서 조회)
    if ((!기능 || !단위사업명) && 세부사업명) {
      try {
        const mapped = await getStructureBySubProgram(세부사업명);
        if (mapped) {
          기능 = 기능 || mapped.function;
          단위사업명 = 단위사업명 || mapped.unit;
        } else {
          results.push({ success: false, row, error: "자동 매핑 실패: 세부사업명에 대한 정보 없음" });
          continue;
        }
      } catch (err) {
        results.push({ success: false, row, error: "자동 매핑 오류: " + err.message });
        continue;
      }
    }

    // 필수값 누락 검사
    if (!기능 || !단위사업명 || !세부사업명 || !이름 || !날짜) {
      results.push({ success: false, row, error: "필수 필드 누락" });
      continue;
    }

    // 중복 체크
    const q = query(
      collectionRef,
      where("date", "==", 날짜),
      where("subProgram", "==", 세부사업명),
      where("name", "==", 이름)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      results.push({ success: false, row, error: "중복 데이터 존재" });
      continue;
    }

    // 등록 처리
    try {
      const docData = {
        function: 기능,
        unit: 단위사업명,
        subProgram: 세부사업명,
        name: 이름,
        gender: row.성별 || "",
        result: row.출석여부 || "",
        note: row["내용(특이사항)"] || "",
        date: 날짜,
        cases: Number(row.건수) || 0,
        sessions: Number(row.횟수) || 0,
        attended: true,
        feeType: row.유형 || "",
        createdAt: new Date().toISOString()
      };

      await addDoc(collectionRef, docData);
      results.push({ success: true, row });
    } catch (err) {
      results.push({ success: false, row, error: err.message });
    }
  }

  return results;
}

// ✅ 7. 실적 요약 생성 함수
export function generateExtendedPerformanceSummaries(data) {
  const grouped = {};

  for (const record of data) {
    const dateStr = record.date || "";
    const [year, month] = dateStr.split("-");
    const quarter = Math.ceil(parseInt(month, 10) / 3);

    const key = `${record.function}__${record.unit}__${record.subProgram}__${year}__${month}`;

    if (!grouped[key]) {
      grouped[key] = {
        function: record.function,
        unit: record.unit,
        subProgram: record.subProgram,
        team: record.team || "",
        year,
        month,
        quarter,
        registerMale: new Set(),
        registerFemale: new Set(),
        realMale: new Set(),
        realFemale: new Set(),
        repeatMale: 0,
        repeatFemale: 0,
        paidMale: 0,
        paidFemale: 0,
        freeMale: 0,
        freeFemale: 0,
        sessions: 0,
        cases: 0
      };
    }

    const g = grouped[key];
    const gender = record.gender === "남" ? "Male" : record.gender === "여" ? "Female" : null;

    if (gender && record.name) {
      g[`register${gender}`].add(record.name);
    }

    if (gender && record.attended && record.name) {
      g[`real${gender}`].add(record.name);
      g[`repeat${gender}`]++;
    }

    if (record.attended) {
      if (record.feeType === "유료") g[`paid${gender}`]++;
      else if (record.feeType === "무료") g[`free${gender}`]++;
    }

    g.sessions += Number(record.sessions) || 0;
    g.cases += Number(record.cases) || 0;
  }

  return Object.values(grouped).map(g => ({
    function: g.function,
    unit: g.unit,
    subProgram: g.subProgram,
    team: g.team,
    year: g.year,
    month: g.month,
    quarter: g.quarter,
    registered: {
      male: g.registerMale.size,
      female: g.registerFemale.size,
      total: g.registerMale.size + g.registerFemale.size
    },
    actual: {
      male: g.realMale.size,
      female: g.realFemale.size,
      total: g.realMale.size + g.realFemale.size
    },
    totalVisits: {
      male: g.repeatMale,
      female: g.repeatFemale,
      total: g.repeatMale + g.repeatFemale
    },
    paid: {
      male: g.paidMale,
      female: g.paidFemale,
      total: g.paidMale + g.paidFemale
    },
    free: {
      male: g.freeMale,
      female: g.freeFemale,
      total: g.freeMale + g.freeFemale
    },
    sessions: g.sessions,
    cases: g.cases
  }));
}