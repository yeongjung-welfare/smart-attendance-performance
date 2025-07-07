// src/hooks/useProgramStructure.js
import { useEffect, useState } from "react";
import { fetchProgramStructure } from "../api/program-structure";

export function useProgramStructure() {
  const [structure, setStructure] = useState({});
  useEffect(() => {
    fetchProgramStructure()
      .then(data => setStructure(data))
      .catch(() => setStructure({}));
  }, []);
  return structure;
}
