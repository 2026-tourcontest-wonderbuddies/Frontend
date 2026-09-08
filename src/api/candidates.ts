import { apiClient } from "./client";
import type {
  CandidatesResponse,
  SelectCandidatePayload,
  TripRequestPayload,
  TripResponse,
} from "./types";

export function createCandidates(payload: TripRequestPayload) {
  return apiClient.post<CandidatesResponse>("/trips/candidates/", payload);
}

export function getCandidates(requestId: string) {
  return apiClient.get<CandidatesResponse>(`/trips/candidates/${requestId}/`);
}

/** 숙소는 확정 *전*에 고르므로, 확정 요청에 함께 실어 보낸다. */
export function selectCandidate(candidateId: string, lodgingContentId?: string) {
  const body: SelectCandidatePayload = lodgingContentId ? { lodging_content_id: lodgingContentId } : {};
  return apiClient.post<TripResponse>(`/trips/candidates/${candidateId}/select/`, body);
}
