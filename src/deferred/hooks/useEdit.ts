import { useMutation } from "@tanstack/react-query";
import { applyEdit, commitTrip } from "../api/edit";
import type { EditRequestPayload, TripResponse } from "../api/types";

export function useApplyEdit(tripId: string) {
  return useMutation({
    mutationFn: (payload: EditRequestPayload) => applyEdit(tripId, payload),
  });
}

export function useCommitTrip(tripId: string) {
  return useMutation({
    mutationFn: (trip: TripResponse) => commitTrip(tripId, trip),
  });
}
