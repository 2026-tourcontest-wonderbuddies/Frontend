import { http, HttpResponse } from "msw";
import { generateLodgingRecommendations } from "../data";
import { findCandidate } from "./candidates";

export const lodgingHandlers = [
  http.get("/api/lodging/recommendations", ({ request }) => {
    const url = new URL(request.url);
    const candidateId = url.searchParams.get("candidateId");
    if (!candidateId) {
      return HttpResponse.json({ detail: "candidateId가 필요합니다." }, { status: 400 });
    }

    const found = findCandidate(candidateId);
    if (!found) {
      return HttpResponse.json({ detail: "찾을 수 없는 코스 후보입니다." }, { status: 404 });
    }

    return HttpResponse.json({
      candidate_id: candidateId,
      recommendations: generateLodgingRecommendations(found.request, found.candidate),
    });
  }),
];
