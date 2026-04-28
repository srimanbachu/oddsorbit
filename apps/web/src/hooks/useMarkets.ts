import { useQuery } from "@tanstack/react-query";
import { useClient } from "../lib/solana";

export function useMarkets() {
  const client = useClient();
  return useQuery({
    queryKey: ["markets"],
    enabled: !!client,
    queryFn: async () => {
      if (!client) return [];
      return client.fetchAllMarkets();
    },
  });
}
