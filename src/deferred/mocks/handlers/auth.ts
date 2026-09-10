import { http, HttpResponse } from "msw";
import type { LoginPayload, SignupPayload } from "../../types";
import { bearerToken, createSession, nextUserId, toPublicUser, userFromToken, users } from "../auth-data";

export const authHandlers = [
  http.post("/api/auth/signup", async ({ request }) => {
    const payload = (await request.json()) as SignupPayload;

    if (!payload.email || !payload.password || !payload.name) {
      return HttpResponse.json(
        { field_errors: { email: ["이메일, 비밀번호, 이름을 모두 입력해주세요."] } },
        { status: 400 },
      );
    }
    if (users.has(payload.email)) {
      return HttpResponse.json(
        { field_errors: { email: ["이미 사용 중인 이메일입니다."] } },
        { status: 400 },
      );
    }

    const id = nextUserId();
    const stored = { id, email: payload.email, name: payload.name, password: payload.password };
    users.set(payload.email, stored);
    const token = createSession(id);

    return HttpResponse.json({ user: toPublicUser(stored), token }, { status: 201 });
  }),

  http.post("/api/auth/login", async ({ request }) => {
    const payload = (await request.json()) as LoginPayload;
    const stored = users.get(payload.email);

    if (!stored || stored.password !== payload.password) {
      return HttpResponse.json(
        { detail: "이메일 또는 비밀번호가 일치하지 않습니다." },
        { status: 401 },
      );
    }

    const token = createSession(stored.id);
    return HttpResponse.json({ user: toPublicUser(stored), token });
  }),

  http.post("/api/auth/logout", () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("/api/auth/me", ({ request }) => {
    const user = userFromToken(bearerToken(request));
    if (!user) {
      return HttpResponse.json({ detail: "로그인이 필요합니다." }, { status: 401 });
    }
    return HttpResponse.json(user);
  }),
];
