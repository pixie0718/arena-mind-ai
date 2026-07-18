"use client";

import { useEffect, useState } from "react";
import type { StadiumConfig } from "@/types/stadium-config";
import { fetchStadiumConfig } from "@/features/navigation/services/fetch-stadium-config";

export type StadiumConfigStatus = "loading" | "ready" | "error";

export interface UseStadiumConfigResult {
  config: StadiumConfig | null;
  status: StadiumConfigStatus;
  errorMessage: string | null;
}

export function useStadiumConfig(stadiumId: string | undefined): UseStadiumConfigResult {
  const [config, setConfig] = useState<StadiumConfig | null>(null);
  const [status, setStatus] = useState<StadiumConfigStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!stadiumId) {
      setStatus("error");
      setErrorMessage("No stadium selected.");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setErrorMessage(null);

    fetchStadiumConfig(stadiumId)
      .then((result) => {
        if (cancelled) return;
        setConfig(result);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Could not load the stadium map.");
      });

    return () => {
      cancelled = true;
    };
  }, [stadiumId]);

  return { config, status, errorMessage };
}
