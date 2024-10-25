import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 10 * 60 * 1000, // 10 mins
      gcTime: 10 * 60 * 1000, // 10 mins
    },
  },
});

export const persister = createSyncStoragePersister({
  storage: typeof window !== "undefined" ? window.localStorage : null,
});
