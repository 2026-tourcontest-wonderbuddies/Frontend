import { http, HttpResponse } from "msw";
import type {
  CandidatesResponse,
  SelectCandidatePayload,
  TripCandidateDTO,
  TripRequestPayload,
} from "../../types";
import { bearerToken, userFromToken } from "../auth-data";
import { candidateToTrip, findLodging, generateCandidates } from "../data";
import { persistedMap, persistMap } from "../persist";
import { setTrip } from "./trips";

interface StoredCandidates {
  request: TripRequestPayload;
  response: CandidatesResponse;
}

// 숙소 선택이 후보 선택과 코스 확정 사이에 끼면서, 그 화면에서 새로고침해도 후보가
// 살아있어야 한다. tripStore와 같은 방식으로 localStorage에 백업한다.
const CANDIDATE_STORE_KEY = "tj_candidates";
const candidateStore = persistedMap<StoredCandidates>(CANDIDATE_STORE_KEY);

function saveCandidates(): void {
  persistMap(CANDIDATE_STORE_KEY, candidateStore);
}

export interface FoundCandidate {
  request: TripRequestPayload;
  candidate: TripCandidateDTO;
}

/** 후보 id로 후보와 그 원본 요청을 찾는다. 숙소 추천 핸들러가 쓴다. */
export function findCandidate(candidateId: string): FoundCandidate | null {
  for (const stored of candidateStore.values()) {
    const candidate = stored.response.candidates.find((c) => c.id === candidateId);
    if (candidate) return { request: stored.request, candidate };
  }
  return null;
}

export const candidateHandlers = [
  http.post("/api/trips/candidates/", async ({ request }) => {
    const user = userFromToken(bearerToken(request));
    if (!user) {
      return HttpResponse.json({ detail: "로그인이 필요합니다." }, { status: 401 });
    }

    const payload = (await request.json()) as TripRequestPayload;
    if (!payload.start_datetime || !payload.end_datetime) {
      return HttpResponse.json(
        { field_errors: { start_datetime: ["필수 값입니다"] } },
        { status: 400 },
      );
    }

    // simulate the recommendation engine working through the checklist
    await new Promise((r) => setTimeout(r, 1400));

    const response = generateCandidates(payload);
    candidateStore.set(response.request_id, { request: payload, response });
    saveCandidates();
    return HttpResponse.json(response, { status: 201 });
  }),

  http.get("/api/trips/candidates/:requestId/", ({ params }) => {
    const requestId = params.requestId as string;
    const stored = candidateStore.get(requestId);
    if (!stored) {
      return HttpResponse.json({ detail: "찾을 수 없는 추천 요청입니다." }, { status: 404 });
    }
    return HttpResponse.json(stored.response);
  }),

  http.post("/api/trips/candidates/:candidateId/select/", async ({ params, request }) => {
    const user = userFromToken(bearerToken(request));
    if (!user) {
      return HttpResponse.json({ detail: "로그인이 필요합니다." }, { status: 401 });
    }

    const candidateId = params.candidateId as string;
    const found = findCandidate(candidateId);
    if (!found) {
      return HttpResponse.json({ detail: "찾을 수 없는 코스 후보입니다." }, { status: 404 });
    }

    let body: SelectCandidatePayload = {};
    try {
      body = ((await request.json()) as SelectCandidatePayload) ?? {};
    } catch {
      // 빈 body도 허용 — 숙소 없이 확정하는 경우
    }

    const lodging = body.lodging_content_id ? findLodging(body.lodging_content_id) : null;
    const trip = candidateToTrip(found.request, found.candidate, lodging);
    setTrip(trip.id, trip);
    return HttpResponse.json(trip, { status: 201 });
  }),
];
