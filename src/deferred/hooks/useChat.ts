import { useMutation } from "@tanstack/react-query";
import { sendChatMessage } from "../api/chat";
import type { ChatRequestPayload } from "../api/types";

export function useSendChatMessage(tripId: string) {
  return useMutation({
    mutationFn: (payload: ChatRequestPayload) => sendChatMessage(tripId, payload),
  });
}
