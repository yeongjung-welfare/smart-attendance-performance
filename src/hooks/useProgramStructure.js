import { useEffect, useState } from "react";
import { getAllTeamSubProgramMaps } from "../services/teamSubProgramMapAPI";

export function useProgramStructure() {
  const [structure, setStructure] = useState({});

  useEffect(() => {
    async function fetchStructure() {
      try {
        const maps = await getAllTeamSubProgramMaps();
        const result = {};

        maps.forEach(item => {
          const { functionType, teamName, mainProgramName, subProgramName } = item;
          
          if (
            typeof teamName !== "string" ||
            typeof mainProgramName !== "string" ||
            typeof subProgramName !== "string"
          ) {
            return;
          }

          // ✅ 팀명을 최상위 키로 변경
          if (!result[teamName]) {
            result[teamName] = {};
          }

          if (!result[teamName][mainProgramName]) {
            result[teamName][mainProgramName] = [];
          }

          if (!result[teamName][mainProgramName].includes(subProgramName)) {
            result[teamName][mainProgramName].push(subProgramName);
          }
        });

        // 정렬 적용
        const sorted = {};
        Object.keys(result)
          .sort((a, b) => a.localeCompare(b, "ko"))
          .forEach(team => {
            sorted[team] = {};
            Object.keys(result[team])
              .sort((a, b) => a.localeCompare(b, "ko"))
              .forEach(unit => {
                sorted[team][unit] = result[team][unit].slice().sort((a, b) => a.localeCompare(b, "ko"));
              });
          });

        setStructure(sorted);
      } catch (err) {
        console.error("📛 useProgramStructure fetch 오류:", err);
        setStructure({});
      }
    }
    fetchStructure();
  }, []);

  return structure;
}
