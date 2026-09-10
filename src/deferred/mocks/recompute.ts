import type {
  ConstraintViolationDTO,
  ItineraryDayDTO,
  ItineraryItemDTO,
  Quadrant,
  TripResponse,
} from "../types";
import { pickReplacementPlace } from "./data";

const SINGLE_HOP_LIMIT_MIN = 60;

function minutesOfDay(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

function isoAtSameDay(referenceIso: string, minutesFromMidnight: number): string {
  const ref = new Date(referenceIso);
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  d.setMinutes(minutesFromMidnight);
  return d.toISOString();
}

function heuristicTravelMin(idx: number, extraBufferMin: number): number {
  return (idx === 0 ? 0 : 15 + (idx % 3) * 5) + (idx === 0 ? 0 : extraBufferMin);
}

/** Recomputes arrive/depart/travel for every item in a day, anchored to the day's
 * original first-item arrival time. Mirrors "변경 지점 이후만 재계산" in spirit —
 * this mock just recomputes the whole day sequentially, which is simpler and gives
 * the same end result for a single-day-at-a-time edit. */
export function recalculateDay(day: ItineraryDayDTO, extraBufferMin = 0): ItineraryDayDTO {
  if (day.items.length === 0) return day;

  const anchorIso = day.items[0].arrive_at;
  let cursor = minutesOfDay(anchorIso);

  const items: ItineraryItemDTO[] = day.items.map((item, idx) => {
    const travel = idx === 0 ? 0 : heuristicTravelMin(idx, extraBufferMin);
    cursor += travel;
    const arrive = cursor;
    cursor += item.stay_min;
    const depart = cursor;
    return {
      ...item,
      order: idx,
      arrive_at: isoAtSameDay(anchorIso, arrive),
      depart_at: isoAtSameDay(anchorIso, depart),
      travel_min_from_prev: idx === 0 ? null : travel,
    };
  });

  return { ...day, items };
}

export function detectViolations(trip: TripResponse): ConstraintViolationDTO[] {
  const violations: ConstraintViolationDTO[] = [];

  for (const day of trip.days) {
    if (day.items.length === 0) continue;

    const first = day.items[0];
    const last = day.items[day.items.length - 1];
    const usedMin = minutesOfDay(last.depart_at) - minutesOfDay(first.arrive_at);
    const budgetMin = day.avail_hours * 60;

    if (usedMin > budgetMin) {
      violations.push({
        type: "schedule_overrun",
        detail: `${day.day_index}일차 일정이 가용 시간보다 ${Math.round(usedMin - budgetMin)}분 초과됩니다.`,
      });
    }

    for (const item of day.items) {
      if ((item.travel_min_from_prev ?? 0) > SINGLE_HOP_LIMIT_MIN) {
        violations.push({
          type: "travel_time_insufficient",
          place_title: item.place.title,
          detail: `${item.place.title}까지 이동시간이 ${item.travel_min_from_prev}분으로, 60분 제한을 초과합니다.`,
        });
      }
    }
  }

  return violations;
}

function findDay(trip: TripResponse, dayIndex: number): ItineraryDayDTO | undefined {
  return trip.days.find((d) => d.day_index === dayIndex);
}

function replaceDay(trip: TripResponse, updated: ItineraryDayDTO): TripResponse {
  return { ...trip, days: trip.days.map((d) => (d.day_index === updated.day_index ? updated : d)) };
}

function usedPlaceIds(trip: TripResponse): Set<string> {
  return new Set(trip.days.flatMap((d) => d.items.map((it) => it.place.content_id)));
}

function dayQuadrant(day: ItineraryDayDTO): Quadrant | undefined {
  return day.items[0]?.place.quadrant;
}

export function applyReorder(trip: TripResponse, dayIndex: number, itemOrder: number, direction: "up" | "down"): TripResponse {
  const day = findDay(trip, dayIndex);
  if (!day) return trip;

  const idx = day.items.findIndex((it) => it.order === itemOrder);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= day.items.length) return trip;
  if (day.items[idx].locked || day.items[swapIdx].locked) return trip;

  const items = [...day.items];
  [items[idx], items[swapIdx]] = [items[swapIdx], items[idx]];
  return replaceDay(trip, recalculateDay({ ...day, items }));
}

export function applyRemove(trip: TripResponse, dayIndex: number, itemOrder: number): TripResponse {
  const day = findDay(trip, dayIndex);
  if (!day) return trip;
  const target = day.items.find((it) => it.order === itemOrder);
  if (!target || target.locked) return trip;

  const items = day.items.filter((it) => it.order !== itemOrder);
  return replaceDay(trip, recalculateDay({ ...day, items }));
}

export function applyLock(trip: TripResponse, dayIndex: number, itemOrder: number): TripResponse {
  const day = findDay(trip, dayIndex);
  if (!day) return trip;
  const items = day.items.map((it) => (it.order === itemOrder ? { ...it, locked: !it.locked } : it));
  return replaceDay(trip, { ...day, items });
}

export function applyStayTime(trip: TripResponse, dayIndex: number, itemOrder: number, stayMin: number): TripResponse {
  const day = findDay(trip, dayIndex);
  if (!day) return trip;
  const items = day.items.map((it) => (it.order === itemOrder ? { ...it, stay_min: Math.max(15, stayMin) } : it));
  return replaceDay(trip, recalculateDay({ ...day, items }));
}

export function applySwap(trip: TripResponse, dayIndex: number, itemOrder: number): TripResponse {
  const day = findDay(trip, dayIndex);
  if (!day) return trip;
  const target = day.items.find((it) => it.order === itemOrder);
  if (!target || target.locked) return trip;

  const exclude = usedPlaceIds(trip);
  exclude.delete(target.place.content_id);
  const pick = pickReplacementPlace(exclude, dayQuadrant(day));
  if (!pick) return trip;

  const items = day.items.map((it) =>
    it.order === itemOrder
      ? { ...it, place: pick.place, stay_min: pick.stayMin, hours_uncertain: false }
      : it,
  );
  return replaceDay(trip, recalculateDay({ ...day, items }));
}

export function applyAdd(trip: TripResponse, dayIndex: number): TripResponse {
  const day = findDay(trip, dayIndex);
  if (!day) return trip;

  const exclude = usedPlaceIds(trip);
  const pick = pickReplacementPlace(exclude, dayQuadrant(day));
  if (!pick) return trip;

  const newItem: ItineraryItemDTO = {
    order: day.items.length,
    slot_type: "GENERAL",
    place: pick.place,
    arrive_at: day.items[day.items.length - 1]?.depart_at ?? new Date().toISOString(),
    depart_at: day.items[day.items.length - 1]?.depart_at ?? new Date().toISOString(),
    stay_min: pick.stayMin,
    travel_min_from_prev: null,
    hours_uncertain: false,
  };
  return replaceDay(trip, recalculateDay({ ...day, items: [...day.items, newItem] }));
}

// ── Chatbot quick-fix transformations ──────────────────────────────────────

export function applyAddSlack(trip: TripResponse, dayIndex: number): TripResponse {
  const day = findDay(trip, dayIndex);
  if (!day) return trip;
  return replaceDay(trip, recalculateDay(day, 30));
}

export function applyWalkLight(trip: TripResponse, dayIndex: number): TripResponse {
  const day = findDay(trip, dayIndex);
  if (!day || day.items.length < 2) return trip;
  const worst = [...day.items].filter((it) => !it.locked).sort(
    (a, b) => (b.travel_min_from_prev ?? 0) - (a.travel_min_from_prev ?? 0),
  )[0];
  if (!worst) return trip;
  const items = day.items.filter((it) => it.order !== worst.order);
  return replaceDay(trip, recalculateDay({ ...day, items }));
}

export function applyLockFirstUnlocked(trip: TripResponse, dayIndex: number): { trip: TripResponse; placeTitle: string | null } {
  const day = findDay(trip, dayIndex);
  const target = day?.items.find((it) => !it.locked);
  if (!day || !target) return { trip, placeTitle: null };
  const items = day.items.map((it) => (it.order === target.order ? { ...it, locked: true } : it));
  return { trip: replaceDay(trip, { ...day, items }), placeTitle: target.place.title };
}
