import { apiClient } from "./client";
import type { ChatRequestPayload, ChatResponse } from "./types";

export function sendChatMessage(tripId: string, payload: ChatRequestPayload) {
  return apiClient.post<ChatResponse>(`/trips/${tripId}/chat/`, payload);
}
