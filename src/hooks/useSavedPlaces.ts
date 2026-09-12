import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSavedPlaces, savePlace, unsavePlace } from "../api/places";

/**
 * GET /api/places/saved/ — 계정에 저장한 장소 목록.
 * 백엔드 뷰에 permission_classes가 없어 비로그인으로 부르면 500이 난다. enabled로 막는다.
 */
export function useSavedPlaces(enabled: boolean) {
  return useQuery({
    queryKey: ["saved-places"],
    queryFn: getSavedPlaces,
    enabled,
  });
}

/** 저장/해제를 한 뮤테이션으로 처리한다. saved=현재 저장돼 있는지. */
export function useToggleSavedPlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contentId, saved }: { contentId: string; saved: boolean }) =>
      saved ? unsavePlace(contentId) : savePlace(contentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-places"] }),
  });
}
