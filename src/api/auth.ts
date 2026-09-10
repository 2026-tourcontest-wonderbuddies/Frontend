import { apiClient } from "./client";
import type { AuthSession } from "./types";

/**
 * 명세 11번 · POST /api/auth/google/
 *
 * 백엔드는 `{ key: <서비스 토큰> }`만 돌려주고 유저 정보는 안 준다 —
 * 구글 access_token으로 구글 userinfo API를 직접 불러서 email/name을 채운다.
 * 이후 모든 요청은 `Authorization: Token {key}` 로 이 키를 실어 보낸다(client.ts).
 */
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
