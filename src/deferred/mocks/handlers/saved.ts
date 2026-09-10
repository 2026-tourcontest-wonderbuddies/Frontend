import { http, HttpResponse } from "msw";
import type { PlaceDTO, SavedCourseDTO, SavedPlaceDTO, TripResponse } from "../../types";
import { bearerToken, userFromToken } from "../auth-data";
import { persistedMap, persistMap } from "../persist";

const savedPlacesByUser = persistedMap<SavedPlaceDTO[]>("tj_saved_places");
const savedCoursesByUser = persistedMap<SavedCourseDTO[]>("tj_saved_courses");
let counter = 0;

function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

function requireUser(request: Request) {
  return userFromToken(bearerToken(request));
}

export const savedHandlers = [
  http.get("/api/saved/places", ({ request }) => {
    const user = requireUser(request);
    if (!user) return HttpResponse.json({ detail: "로그인이 필요합니다." }, { status: 401 });
    return HttpResponse.json(savedPlacesByUser.get(user.id) ?? []);
  }),

  http.post("/api/saved/places", async ({ request }) => {
    const user = requireUser(request);
    if (!user) return HttpResponse.json({ detail: "로그인이 필요합니다." }, { status: 401 });

    const { place } = (await request.json()) as { place: PlaceDTO };
    const list = savedPlacesByUser.get(user.id) ?? [];
    const existing = list.find((p) => p.place.content_id === place.content_id);
    if (existing) return HttpResponse.json(existing, { status: 200 });

    const saved: SavedPlaceDTO = { id: nextId("sp"), place, saved_at: new Date().toISOString() };
    savedPlacesByUser.set(user.id, [saved, ...list]);
    persistMap("tj_saved_places", savedPlacesByUser);
    return HttpResponse.json(saved, { status: 201 });
  }),

  http.delete("/api/saved/places/:id", ({ request, params }) => {
    const user = requireUser(request);
    if (!user) return HttpResponse.json({ detail: "로그인이 필요합니다." }, { status: 401 });

    const list = savedPlacesByUser.get(user.id) ?? [];
    savedPlacesByUser.set(user.id, list.filter((p) => p.id !== params.id));
    persistMap("tj_saved_places", savedPlacesByUser);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("/api/saved/courses", ({ request }) => {
    const user = requireUser(request);
    if (!user) return HttpResponse.json({ detail: "로그인이 필요합니다." }, { status: 401 });
    return HttpResponse.json(savedCoursesByUser.get(user.id) ?? []);
  }),

  http.post("/api/saved/courses", async ({ request }) => {
    const user = requireUser(request);
    if (!user) return HttpResponse.json({ detail: "로그인이 필요합니다." }, { status: 401 });

    const { trip, title } = (await request.json()) as { trip: TripResponse; title: string };
    const list = savedCoursesByUser.get(user.id) ?? [];
    const existing = list.find((c) => c.trip.id === trip.id);
    if (existing) return HttpResponse.json(existing, { status: 200 });

    const saved: SavedCourseDTO = { id: nextId("sc"), title, trip, saved_at: new Date().toISOString() };
    savedCoursesByUser.set(user.id, [saved, ...list]);
    persistMap("tj_saved_courses", savedCoursesByUser);
    return HttpResponse.json(saved, { status: 201 });
  }),

  http.delete("/api/saved/courses/:id", ({ request, params }) => {
    const user = requireUser(request);
    if (!user) return HttpResponse.json({ detail: "로그인이 필요합니다." }, { status: 401 });

    const list = savedCoursesByUser.get(user.id) ?? [];
    savedCoursesByUser.set(user.id, list.filter((c) => c.id !== params.id));
    persistMap("tj_saved_courses", savedCoursesByUser);
    return new HttpResponse(null, { status: 204 });
  }),
];
