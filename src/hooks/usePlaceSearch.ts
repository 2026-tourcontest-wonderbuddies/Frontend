import { useEffect, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { searchPlaces } from "../api/places";
import type { RegionCode } from "../api/types";

/** 값이 바뀌고 delayMs 동안 더 안 바뀌면 그 값을 반영한다. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

/** 입력창 드롭다운 자동완성. 글자 입력 후 300ms 멈추면 이름으로만 검색해 상위 몇 개를 보여준다. */
export function usePlaceSuggestions(rawQuery: string) {
  const q = useDebouncedValue(rawQuery.trim(), 300);
  return useQuery({
    queryKey: ["place-suggestions", q],
    queryFn: () => searchPlaces({ q, page: 1, page_size: 6 }),
    enabled: q.length > 0,
  });
}

interface SearchResultParams {
  q: string;
  category: string;
  region: RegionCode | "";
}

/** 검색 버튼(또는 자동완성 클릭)으로 확정된 조건의 실제 결과 목록. "더보기"로 다음 페이지를 이어붙인다. */
export function usePlaceSearchResults({ q, category, region }: SearchResultParams) {
  return useInfiniteQuery({
    queryKey: ["place-search", q, category, region],
    queryFn: ({ pageParam }) =>
      searchPlaces({
        q,
        category: category || undefined,
        region: region || undefined,
        page: pageParam,
        page_size: 20,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.has_more ? allPages.length + 1 : undefined),
  });
}
