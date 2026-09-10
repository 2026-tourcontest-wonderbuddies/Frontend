import type { User } from "../types";

interface StoredUser extends User {
  password: string;
}

// Seed one demo account so the login screen has something to try immediately.
export const users = new Map<string, StoredUser>([
  [
    "demo@siganyeohaeng.kr",
    { id: "u_demo", email: "demo@siganyeohaeng.kr", name: "데모 사용자", password: "demo1234" },
  ],
]);

let userCounter = 1;

export function nextUserId(): string {
  userCounter += 1;
  return `u_${Date.now().toString(36)}_${userCounter}`;
}

// The token just encodes the user id — there's no separate in-memory session
// store to keep in sync. That matters because this mock server's module state
// resets on every full page reload (dev server HMR / hard navigation), while
// the token itself lives in localStorage and survives. Deriving the user
// straight from the token means a stored session for the seeded demo account
// (whose id is always "u_demo") keeps working across reloads instead of
// silently 401-ing. Not real security — this is a client-only mock.
export function createSession(userId: string): string {
  return `tok_${userId}`;
}

export function userFromToken(token: string | null): User | null {
  if (!token?.startsWith("tok_")) return null;
  const userId = token.slice("tok_".length);
  for (const u of users.values()) {
    if (u.id === userId) {
      return toPublicUser(u);
    }
  }
  return null;
}

export function bearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

export function toPublicUser(u: StoredUser): User {
  const { password: _password, ...publicUser } = u;
  return publicUser;
}
