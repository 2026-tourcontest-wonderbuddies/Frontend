import { http, HttpResponse } from "msw";
import type { ChatMessageDTO, ChatRequestPayload, ChatResponse, QuickFixCode, TripResponse } from "../../types";
import {
  applyAdd,
  applyAddSlack,
  applyLockFirstUnlocked,
  applyRemove,
  applySwap,
  applyWalkLight,
  detectViolations,
} from "../recompute";
import { setTrip, tripStore } from "./trips";

const KEYWORD_MAP: [RegExp, QuickFixCode][] = [
  [/고정/, "lock_place"],
  [/(교체|바꿔|바꾸)/, "swap_place"],
  [/추가/, "add_place"],
  [/(빼|제외|말고)/, "exclude_category"],
  [/(여유|쉬는|버퍼|휴식)/, "add_slack"],
  [/실내/, "indoor_focus"],
  [/야외/, "outdoor_focus"],
  [/(도보|걷)/, "walk_light"],
];

function detectQuickFix(message: string): QuickFixCode | null {
  for (const [re, code] of KEYWORD_MAP) {
    if (re.test(message)) return code;
  }
  return null;
}

function summaryFor(code: QuickFixCode): string {
  return (
    {
      lock_place: "장소 고정",
      swap_place: "장소 교체",
      add_place: "장소 추가",
      exclude_category: "장소 제외",
      indoor_focus: "실내 중심으로 변경",
      outdoor_focus: "야외 중심으로 변경",
      walk_light: "도보 이동 줄이기",
      add_slack: "여유 시간 추가",
    } as Record<QuickFixCode, string>
  )[code];
}

function applyQuickFix(
  code: QuickFixCode,
  trip: TripResponse,
  dayIndex: number,
): { trip: TripResponse; assistantText: string } {
  const day = trip.days.find((d) => d.day_index === dayIndex);
  const lastItem = day?.items[day.items.length - 1];

  switch (code) {
    case "lock_place": {
      const { trip: next, placeTitle } = applyLockFirstUnlocked(trip, dayIndex);
      return {
        trip: next,
        assistantText: placeTitle ? `${placeTitle}을(를) 고정했어요. 재계산 시에도 순서가 유지돼요.` : "고정할 장소를 찾지 못했어요.",
      };
    }
    case "swap_place": {
      if (!lastItem) return { trip, assistantText: "교체할 장소가 없어요." };
      const next = applySwap(trip, dayIndex, lastItem.order);
      const newLast = next.days.find((d) => d.day_index === dayIndex)?.items.at(-1);
      return {
        trip: next,
        assistantText:
          newLast && newLast.place.content_id !== lastItem.place.content_id
            ? `${lastItem.place.title} 대신 ${newLast.place.title}(으)로 교체했어요.`
            : "교체할 다른 후보를 찾지 못했어요.",
      };
    }
    case "add_place": {
      const next = applyAdd(trip, dayIndex);
      const added = next.days.find((d) => d.day_index === dayIndex)?.items.length ?? 0;
      const before = day?.items.length ?? 0;
      return {
        trip: next,
        assistantText: added > before ? "새로운 장소를 하루 일정 끝에 추가했어요." : "추가할 만한 장소를 찾지 못했어요.",
      };
    }
    case "exclude_category": {
      if (!lastItem) return { trip, assistantText: "제외할 장소가 없어요." };
      const next = applyRemove(trip, dayIndex, lastItem.order);
      return { trip: next, assistantText: `${lastItem.place.title}을(를) 코스에서 제외했어요.` };
    }
    case "walk_light": {
      const next = applyWalkLight(trip, dayIndex);
      return { trip: next, assistantText: "이동 거리가 가장 긴 구간을 줄였어요." };
    }
    case "add_slack": {
      const next = applyAddSlack(trip, dayIndex);
      return { trip: next, assistantText: "장소 사이에 30분 여유 시간을 추가했어요." };
    }
    case "indoor_focus":
      return { trip, assistantText: "실내 중심 선호를 반영할게요. (이번 목업에서는 안내만 제공돼요)" };
    case "outdoor_focus":
      return { trip, assistantText: "야외 중심 선호를 반영할게요. (이번 목업에서는 안내만 제공돼요)" };
    default:
      return { trip, assistantText: "요청을 반영하지 못했어요." };
  }
}

export const chatHandlers = [
  http.post("/api/trips/:id/chat/", async ({ request, params }) => {
    const id = params.id as string;
    const trip = tripStore.get(id);
    if (!trip) {
      return HttpResponse.json({ detail: "찾을 수 없는 코스입니다." }, { status: 404 });
    }

    const payload = (await request.json()) as ChatRequestPayload;
    const userText = payload.message ?? summaryFor(payload.quick_fix as QuickFixCode);
    const code = payload.quick_fix ?? (payload.message ? detectQuickFix(payload.message) : null);

    const messages: ChatMessageDTO[] = [
      { id: `m-${Date.now()}-u`, role: "user", text: userText, created_at: new Date().toISOString() },
    ];

    await new Promise((r) => setTimeout(r, 500));

    if (!code) {
      messages.push({
        id: `m-${Date.now()}-a`,
        role: "assistant",
        text: "요청을 정확히 이해하지 못했어요. 아래 빠른 수정 버튼 중 하나를 선택해보시겠어요?",
        created_at: new Date().toISOString(),
        structured_intent: { type: "unrecognized", summary: "해석 실패" },
      });
      const response: ChatResponse = { messages, trip: null, violations: [] };
      return HttpResponse.json(response);
    }

    const { trip: updatedTrip, assistantText } = applyQuickFix(code, trip, payload.day_index);
    const violations = detectViolations(updatedTrip);

    messages.push({
      id: `m-${Date.now()}-a`,
      role: "assistant",
      text:
        violations.length > 0
          ? `${assistantText} 다만 일부 제약을 확인해주세요.`
          : assistantText,
      created_at: new Date().toISOString(),
      structured_intent: { type: code, summary: summaryFor(code) },
    });

    setTrip(id, updatedTrip);

    const response: ChatResponse = { messages, trip: updatedTrip, violations };
    return HttpResponse.json(response);
  }),
];
