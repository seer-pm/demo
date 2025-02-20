import { fetchAuth, getAppUrl, isAccessTokenExpired } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useGlobalState } from "../useGlobalState";

export function useGetCollections() {
  const accessToken = useGlobalState((state) => state.accessToken);
  return useQuery<{ id: string; name: string }[]>({
    queryKey: ["useGetCollections"],
    enabled: !isAccessTokenExpired(accessToken),
    queryFn: async () => {
      return fetchAuth(accessToken, `${getAppUrl()}/.netlify/functions/collections-handler/`, "GET").then((data) =>
        data.data.map((x: { id: number; name: string }) => ({
          ...x,
          id: x.id.toString(),
        })),
      );
    },
  });
}
