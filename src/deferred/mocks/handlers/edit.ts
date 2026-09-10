import { http, HttpResponse } from "msw";
import type { EditRequestPayload, EditResponse } from "../../types";
import { applyAdd, applyLock, applyRemove, applyReorder, applyStayTime, applySwap, detectViolations } from "../recompute";
import { setTrip } from "./trips";

export const editHandlers = [
  http.post("/api/trips/:id/edit/", async ({ request }) => {
    const payload = (await request.json()) as EditRequestPayload;
    const { trip, day_index, op, item_order, direction, stay_min } = payload;

    let updated = trip;
    switch (op) {
      case "reorder":
        if (item_order !== undefined && direction) updated = applyReorder(trip, day_index, item_order, direction);
        break;
      case "remove":
        if (item_order !== undefined) updated = applyRemove(trip, day_index, item_order);
        break;
      case "lock":
        if (item_order !== undefined) updated = applyLock(trip, day_index, item_order);
        break;
      case "stay_time":
        if (item_order !== undefined && stay_min !== undefined) updated = applyStayTime(trip, day_index, item_order, stay_min);
        break;
      case "swap":
        if (item_order !== undefined) updated = applySwap(trip, day_index, item_order);
        break;
      case "add":
        updated = applyAdd(trip, day_index);
        break;
    }

    const response: EditResponse = { trip: updated, violations: detectViolations(updated) };
    return HttpResponse.json(response);
  }),

  http.put("/api/trips/:id/", async ({ request, params }) => {
    const trip = (await request.json()) as EditResponse["trip"];
    setTrip(params.id as string, trip);
    return HttpResponse.json(trip);
  }),
];
