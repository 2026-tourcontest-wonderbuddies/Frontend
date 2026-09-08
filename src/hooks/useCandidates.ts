import { useMutation, useQuery } from "@tanstack/react-query";
import { createCandidates, getCandidates, selectCandidate } from "../api/candidates";

export function useCreateCandidates() {
  return useMutation({ mutationFn: createCandidates });
}

export function useCandidates(requestId: string | undefined) {
  return useQuery({
    queryKey: ["candidates", requestId],
    queryFn: () => getCandidates(requestId as string),
    enabled: Boolean(requestId),
  });
}

export interface SelectCandidateArgs {
  candidateId: string;
  lodgingContentId?: string;
}

export function useSelectCandidate() {
  return useMutation({
    mutationFn: ({ candidateId, lodgingContentId }: SelectCandidateArgs) =>
      selectCandidate(candidateId, lodgingContentId),
  });
}
