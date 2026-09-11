import { useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import PlaceSearchDetailSheet from "../components/PlaceSearchDetailSheet";
import ChipGroup from "../components/ChipGroup";
import { useAuth } from "../auth/AuthContext";
import { usePlaceSearchResults, usePlaceSuggestions } from "../hooks/usePlaceSearch";
import { toggleSavedPlace, useSavedPlaces } from "../store/saved";
import { REGION_CODE_BY_KEY, REGION_LABELS, type RegionKey, type SearchPlace } from "../api/types";

const CATEGORY_OPTIONS = ["관광지", "문화시설", "음식점", "쇼핑"].map((v) => ({ value: v, label: v }));
const REGION_OPTIONS = (Object.entries(REGION_LABELS) as [RegionKey, string][]).map(([value, label]) => ({
  value,
  label,
}));

export default function SearchPage() {
  const { user } = useAuth();

  const [input, setInput] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [submittedQ, setSubmittedQ] = useState("");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState<RegionKey | "">("");
  const [selected, setSelected] = useState<SearchPlace | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const regionCode = region ? REGION_CODE_BY_KEY[region] : "";

  const { data: suggestData } = usePlaceSuggestions(input);
  const suggestions = suggestData?.results ?? [];
  const showDropdown = inputFocused && input.trim().length > 0 && suggestions.length > 0;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = usePlaceSearchResults({
    q: submittedQ,
    category,
    region: regionCode,
  });
  const results = useMemo(() => data?.pages.flatMap((p) => p.results) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

  const savedPlaces = useSavedPlaces(user?.id);
  const savedIds = useMemo(() => new Set(savedPlaces.map((r) => r.place.content_id)), [savedPlaces]);

  function submitSearch(e?: FormEvent) {
    e?.preventDefault();
    setSubmittedQ(input.trim());
    setInputFocused(false);
    inputRef.current?.blur();
  }

  function pickSuggestion(place: SearchPlace) {
    setInput(place.title);
    setSubmittedQ(place.title);
    setInputFocused(false);
  }

  function resetFilters() {
    setInput("");
    setSubmittedQ("");
    setCategory("");
    setRegion("");
  }

  return (
    <div className="wrap search-page" style={{ padding: "40px 32px 90px" }}>
      <div className="page-eyebrow">EXPLORE</div>
      <h1 className="page-title">장소 검색</h1>
      <p className="page-sub">이름, 관광 유형, 권역으로 제주 장소를 직접 찾아보세요.</p>

      <form onSubmit={submitSearch} style={{ marginTop: 24, maxWidth: 480, position: "relative" }} autoComplete="off">
        <div className="search-bar">
          <input
            ref={inputRef}
            className="search-input"
            type="text"
            placeholder="장소명으로 검색 (예: 협재, 성산)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />
          <button type="submit" className="btn-primary">
            검색
          </button>
        </div>

        {showDropdown && (
          <div className="search-dropdown">
            {suggestions.map((s) => (
              <button
                type="button"
                key={s.content_id}
                className="search-dropdown-item"
                onMouseDown={() => pickSuggestion(s)}
              >
                <span>{s.title}</span>
                <span className="mono" style={{ color: "var(--ink-soft)", fontSize: 12 }}>
                  {s.content_type_name}
                </span>
              </button>
            ))}
          </div>
        )}
      </form>

      <div className="override-section" style={{ marginTop: 20 }}>
        <div className="override-label">관광 유형</div>
        <ChipGroup options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
      </div>

      <div className="override-section region-chip-grid">
        <div className="override-label">권역</div>
        <ChipGroup options={REGION_OPTIONS} value={region} onChange={(v) => setRegion(v as RegionKey)} />
      </div>

      {(submittedQ || category || region) && (
        <a className="reset-link" onClick={resetFilters}>
          필터 초기화
        </a>
      )}

      <div className="results-head" style={{ marginTop: 28 }}>
        <div className="result-count">
          총 <b>{total}</b>개 장소
        </div>
        {user && (
          <Link className="btn-outline" to="/saved">
            저장함 보기
          </Link>
        )}
      </div>

      {!user && (
        <p style={{ color: "var(--ink-soft)", fontSize: 13, marginTop: 8 }}>
          <Link to="/login">로그인</Link>하면 마음에 드는 장소를 저장함에 담아둘 수 있어요.
        </p>
      )}

      {isLoading && (
        <div className="state-panel" style={{ padding: "50px 20px" }}>
          <div className="spinner" />
          <p>장소를 찾고 있어요</p>
        </div>
      )}

      {!isLoading && results.length === 0 && (
        <div className="empty-state" style={{ padding: "70px 20px" }}>
          <span className="serif">조건에 맞는 장소가 없어요</span>
          검색어나 필터를 바꿔보세요.
        </div>
      )}

      <div className="saved-list" style={{ marginTop: 16 }}>
        {results.map((place) => (
          <div className="saved-row" key={place.content_id}>
            <button type="button" className="saved-row-link" onClick={() => setSelected(place)}>
              <div className="saved-row-title">{place.title}</div>
              <div className="saved-row-sub mono">
                {place.content_type_name}
                {place.small_category_name ? ` · ${place.small_category_name}` : ""}
              </div>
            </button>
            {user && (
              <button
                type="button"
                className="btn-outline"
                aria-pressed={savedIds.has(place.content_id)}
                onClick={() => toggleSavedPlace(user.id, place)}
              >
                {savedIds.has(place.content_id) ? "♥ 저장됨" : "♡ 저장"}
              </button>
            )}
          </div>
        ))}
      </div>

      {hasNextPage && (
        <button
          type="button"
          className="btn-outline"
          style={{ display: "block", margin: "24px auto 0" }}
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "불러오는 중…" : "더보기"}
        </button>
      )}

      {selected && <PlaceSearchDetailSheet place={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
