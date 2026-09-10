import { http, HttpResponse } from "msw";
import type { TripRequestPayload, TripResponse } from "../../types";
import { DEMO_TRIP, DEMO_TRIP_ID, generateTrip } from "../data";
import { persistedMap, persistMap } from "../persist";

export const tripStore = persistedMap<TripResponse>("tj_trips");
if (!tripStore.has(DEMO_TRIP_ID)) tripStore.set(DEMO_TRIP_ID, DEMO_TRIP);

export function setTrip(id: string, trip: TripResponse): void {
  tripStore.set(id, trip);
  persistMap("tj_trips", tripStore);
}

export const tripHandlers = [
  http.post("/api/trips/", async ({ request }) => {
    const payload = (await request.json()) as TripRequestPayload;

    if (!payload.start_datetime || !payload.end_datetime) {
      return HttpResponse.json(
        { field_errors: { start_datetime: ["필수 값입니다"] } },
        { status: 400 },
      );
    }

    const trip = generateTrip(payload);
    setTrip(trip.id, trip);
    // simulate the recommendation engine taking a moment
    await new Promise((r) => setTimeout(r, 600));
    return HttpResponse.json(trip, { status: 201 });
  }),

  http.get("/api/trips/:id/", ({ params }) => {
    const id = params.id as string;
    const trip = tripStore.get(id);
    if (!trip) {
      return HttpResponse.json({ detail: "찾을 수 없는 코스입니다." }, { status: 404 });
    }
    return HttpResponse.json(trip);
  }),
];
