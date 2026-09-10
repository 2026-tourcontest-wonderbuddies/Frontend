import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PlaceDetailSheet from "../components/PlaceDetailSheet";
import ChipGroup from "../components/ChipGroup";
import { useAuth } from "../auth/AuthContext";
import { filterPlaces, type SearchPlace } from "../data/places";
import { toggleSavedPlace, useSavedPlaces } from "../store/saved";
import { REGION_LABELS, type RegionKey } from "../api/types";

const CATEGORY_OPTIONS = ["관광지", "음식점", "쇼핑"].map((v) => ({ value: v, label: v }));
const REGION_OPTIONS = (Object.entries(REGION_LABELS) as [RegionKey, string][]).map(([value, label]) => ({
  value,
  label,
}));

/**
 * [백엔드 연결 이전] 장소 검색 엔드포인트가 아직 서버에 없어
 * src/data/places.ts 의 시드 목록을 클라이언트에서 필터링해 보여준다.
 */
export default function SearchPage() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState<RegionKey | "">("");
  const [selected, setSelected] = useState<SearchPlace | null>(null);

  const results = useMemo(() => filterPlaces({ q, category, region }), [q, category, region]);
  const savedPlaces = useSavedPlaces(user?.id);
  const savedIds = useMemo(
    () => new Set(savedPlaces.map((r) => r.place.content_id)),
    [savedPlaces],
  );

  function resetFilters() {
    setQ("");
    setCategory("");
    setRegion("");
  }

  return (
    <div className="wrap" style={{ padding: "40px 32px 90px" }}>
      <div className="page-eyebrow">EXPLORE</div>
      <h1 className="page-title">장소 검색</h1>
      <p className="page-sub">이름, 관광 유형, 권역으로 제주 장소를 직접 찾아보세요.</p>

      <div className="nocon-banner" style={{ marginTop: 12 }}>
        ⚠ 백엔드 미연동 — 장소 검색 API가 아직 서버에 없어요. 지금 보이는 결과는 프론트에 넣어둔
        시드 10곳을 걸러낸 것이라, 실제 제주 장소 전체가 아니에요.
      </div>

      <div className="search-bar" style={{ marginTop: 24, maxWidth: 480 }}>
        <input
          className="search-input"
          type="text"
          placeholder="장소명으로 검색 (예: 협재, 성산)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="override-section" style={{ marginTop: 20 }}>
        <div className="override-label">관광 유형</div>
        <ChipGroup options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
      </div>

      <div className="override-section">
        <div className="override-label">권역</div>
        <ChipGroup options={REGION_OPTIONS} value={region} onChange={(v) => setRegion(v as RegionKey)} />
      </div>

      {(q || category || region) && (
        <a className="reset-link" onClick={resetFilters}>
          필터 초기화
        </a>
      )}

      <div className="results-head" style={{ marginTop: 28 }}>
        <div className="result-count">
          총 <b>{results.length}</b>개 장소
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

      {results.length === 0 && (
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
                {place.address} · {place.content_type_name}
                {place.small_category_name ? ` · ${place.small_category_name}` : ""}
              </div>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              {place.satisfaction_score && (
                <span className="meta-chip mono">★ {place.satisfaction_score.toFixed(2)}</span>
              )}
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
          </div>
        ))}
      </div>

      {selected && <PlaceDetailSheet place={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
