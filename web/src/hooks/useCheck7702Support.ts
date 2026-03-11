import { useCheck7702Support as useCheck7702SupportShared } from "@seer-pm/react";
import { useGlobalState } from "./useGlobalState";

export function useCheck7702Support(): boolean {
  const useSmartAccount = useGlobalState((state) => state.useSmartAccount);

  return useCheck7702SupportShared(useSmartAccount);
}
