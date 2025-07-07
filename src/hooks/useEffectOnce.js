// src/hooks/useEffectOnce.js
import { useEffect, useRef } from "react";

export function useEffectOnce(callback) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (!hasRun.current) {
      callback();
      hasRun.current = true;
    }
  }, []);
}