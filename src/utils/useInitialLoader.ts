// src/utils/useInitialLoader.ts
"use client";
import { useEffect, useState } from "react";

export default function useInitialLoader(ms = 2000) {
  const [initialLoading, setInitialLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setInitialLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return initialLoading;
}