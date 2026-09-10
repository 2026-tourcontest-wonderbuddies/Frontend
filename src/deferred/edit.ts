import { apiClient } from "./client";
import type { EditRequestPayload, EditResponse, TripResponse } from "./types";

export function applyEdit(tripId: string, payload: EditRequestPayload) {
  return apiClient.post<EditResponse>(`/trips/${tripId}/edit/`, payload);
}

export function commitTrip(tripId: string, trip: TripResponse) {
  return apiClient.put<TripResponse>(`/trips/${tripId}/`, trip);
}
