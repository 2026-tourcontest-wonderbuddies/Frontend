import { apiClient } from "./client";
import type { AuthSession, LoginPayload, SignupPayload, User } from "./types";

export function login(payload: LoginPayload) {
  return apiClient.post<AuthSession>("/auth/login", payload);
}

// 백엔드 /auth/google/ 는 { key: <서비스 토큰> }만 돌려주고 유저 정보는 안 줌 —
// 구글 access_token으로 구글 자체 userinfo API를 직접 불러서 email/name을 채운다.
export async function loginWithGoogle(accessToken: string): Promise<AuthSession> {
  const [profile, { key }] = await Promise.all([
    fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`).then(
      (res) => res.json() as Promise<{ sub: string; email: string; name: string }>,
    ),
    apiClient.post<{ key: string }>("/auth/google/", { access_token: accessToken }),
  ]);

  return {
    user: { id: profile.sub, email: profile.email, name: profile.name },
    token: key,
  };
}

export function signup(payload: SignupPayload) {
  return apiClient.post<AuthSession>("/auth/signup", payload);
}

export function logout() {
  return apiClient.post<void>("/auth/logout", {});
}

export function getMe() {
  return apiClient.get<User>("/auth/me");
}
