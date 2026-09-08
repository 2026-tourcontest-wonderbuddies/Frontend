import { useQuery } from "@tanstack/react-query";
import { getLodgingRecommendations } from "../api/lodging";

export function useLodgingRecommendations(candidateId: string | undefined) {
  return useQuery({
    queryKey: ["lodging-recommendations", candidateId],
    queryFn: () => getLodgingRecommendations(candidateId as string),
    enabled: Boolean(candidateId),
  });
}
