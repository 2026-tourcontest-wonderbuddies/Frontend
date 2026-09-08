import { apiClient } from "./client";
import type { LodgingRecommendationsResponse } from "./types";

export function getLodgingRecommendations(candidateId: string) {
  return apiClient.get<LodgingRecommendationsResponse>(
    `/lodging/recommendations?candidateId=${encodeURIComponent(candidateId)}`,
  );
}
