import { useSyncExternalStore } from "react";
import type { SearchPlace } from "../data/places";

/**
 * [백엔드 연결 이전] 저장함(찜)은 백엔드 API 명세에 대응 엔드포인트가 없다.
 * 서버에 `/api/saved/*` 가 생기기 전까지 브라우저 localStorage 에만 담는다.
 * 따라서 저장 목록은 기기·브라우저 단위이며 계정을 따라다니지 않는다.
 */

export interface SavedPlaceRecord {
  id: string;
  place: SearchPlace;
  saved_at: string;
}

/** 코스 상세를 매번 다시 받지 않도록 저장 시점의 요약을 함께 담아둔다. */
export interface SavedCourseRecord {
  id: string;
  course_id: number;
  title: string;
  spot_count: number;
  stay_min: number;
  travel_min: number;
  first_place?: { title: string; latitude: number; longitude: number };
  saved_at: string;
}

const PLACES_KEY = "tj_saved_places";
const COURSES_KEY = "tj_saved_courses";

/** userId → 목록. 한 브라우저를 여러 계정이 쓰는 경우를 갈라둔다. */
type Bucket<T> = Record<string, T[]>;

const EMPTY_PLACES: SavedPlaceRecord[] = [];
const EMPTY_COURSES: SavedCourseRecord[] = [];

let placeCache: Bucket<SavedPlaceRecord> | null = null;
let courseCache: Bucket<SavedCourseRecord> | null = null;
const listeners = new Set<() => void>();

function readBucket<T>(key: string): Bucket<T> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Bucket<T>) : {};
  } catch {
    return {};
  }
}

function places(): Bucket<SavedPlaceRecord> {
  placeCache ??= readBucket<SavedPlaceRecord>(PLACES_KEY);
  return placeCache;
}

function courses(): Bucket<SavedCourseRecord> {
  courseCache ??= readBucket<SavedCourseRecord>(COURSES_KEY);
  return courseCache;
}

function emit() {
  for (const listener of listeners) listener();
}

function writePlaces(next: Bucket<SavedPlaceRecord>) {
  placeCache = next;
  localStorage.setItem(PLACES_KEY, JSON.stringify(next));
  emit();
}

function writeCourses(next: Bucket<SavedCourseRecord>) {
  courseCache = next;
  localStorage.setItem(COURSES_KEY, JSON.stringify(next));
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // 다른 탭에서 바뀐 저장 목록을 따라간다.
  function onStorage(e: StorageEvent) {
    if (e.key === PLACES_KEY) placeCache = null;
    else if (e.key === COURSES_KEY) courseCache = null;
    else return;
    listener();
  }
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function newId(): string {
  return crypto.randomUUID();
}

/** 저장 코스 요약 줄. 체류+이동을 합쳐 시간 단위로 보여준다. */
export function courseSummaryText(course: SavedCourseRecord): string {
  const hours = Math.round((course.stay_min + course.travel_min) / 60);
  return `${course.spot_count}곳 · 총 ${hours}시간`;
}

// ── 조회 ──────────────────────────────────────────────────────────────────

export function useSavedPlaces(userId?: string): SavedPlaceRecord[] {
  return useSyncExternalStore(subscribe, () =>
    userId ? (places()[userId] ?? EMPTY_PLACES) : EMPTY_PLACES,
  );
}

export function useSavedCourses(userId?: string): SavedCourseRecord[] {
  return useSyncExternalStore(subscribe, () =>
    userId ? (courses()[userId] ?? EMPTY_COURSES) : EMPTY_COURSES,
  );
}

export function useIsPlaceSaved(userId: string | undefined, contentId: string): boolean {
  return useSyncExternalStore(subscribe, () =>
    Boolean(userId && places()[userId]?.some((r) => r.place.content_id === contentId)),
  );
}

export function useIsCourseSaved(userId: string | undefined, courseId?: number): boolean {
  return useSyncExternalStore(subscribe, () =>
    Boolean(userId && courseId != null && courses()[userId]?.some((r) => r.course_id === courseId)),
  );
}

// ── 쓰기 ──────────────────────────────────────────────────────────────────

/** 이미 저장돼 있으면 해제, 아니면 저장. */
export function toggleSavedPlace(userId: string, place: SearchPlace) {
  const list = places()[userId] ?? [];
  const existing = list.find((r) => r.place.content_id === place.content_id);
  const next = existing
    ? list.filter((r) => r.id !== existing.id)
    : [{ id: newId(), place, saved_at: new Date().toISOString() }, ...list];
  writePlaces({ ...places(), [userId]: next });
}

export function removeSavedPlace(userId: string, id: string) {
  writePlaces({ ...places(), [userId]: (places()[userId] ?? []).filter((r) => r.id !== id) });
}

export function toggleSavedCourse(userId: string, course: Omit<SavedCourseRecord, "id" | "saved_at">) {
  const list = courses()[userId] ?? [];
  const existing = list.find((r) => r.course_id === course.course_id);
  const next = existing
    ? list.filter((r) => r.id !== existing.id)
    : [{ ...course, id: newId(), saved_at: new Date().toISOString() }, ...list];
  writeCourses({ ...courses(), [userId]: next });
}

export function removeSavedCourse(userId: string, id: string) {
  writeCourses({ ...courses(), [userId]: (courses()[userId] ?? []).filter((r) => r.id !== id) });
}
