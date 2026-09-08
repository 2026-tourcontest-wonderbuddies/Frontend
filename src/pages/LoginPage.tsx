import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, authErrorMessage } from "../auth/AuthContext";

// Google Identity Services(GSI)는 별도 타입 패키지 없이 index.html의 <script>로 로드함
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; error?: string }) => void;
          }): { requestAccessToken: () => void };
        };
      };
    };
  }
}

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [email, setEmail] = useState("demo@siganyeohaeng.kr");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handleGoogleLogin() {
    if (!window.google) {
      setError("구글 로그인 스크립트를 아직 불러오는 중이에요. 잠시 후 다시 시도해주세요.");
      return;
    }
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("구글 로그인 설정(VITE_GOOGLE_CLIENT_ID)이 없어요.");
      return;
    }
    setError(null);
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "email profile",
      callback: async (resp) => {
        if (!resp.access_token) {
          setError("구글 로그인이 취소되었거나 실패했어요.");
          return;
        }
        setPending(true);
        try {
          await loginWithGoogle(resp.access_token);
          navigate(from, { replace: true });
        } catch (err) {
          setError(authErrorMessage(err, "구글 로그인에 실패했습니다."));
        } finally {
          setPending(false);
        }
      },
    });
    client.requestAccessToken();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(authErrorMessage(err, "로그인에 실패했습니다."));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-eyebrow">TIME-BASED JEJU TRAVEL PLATFORM</div>
        <h1 className="auth-title">제주 코스에 로그인</h1>
        <p className="auth-sub">기존 계정으로 접속하세요</p>

        {error && (
          <div className="auth-error-banner">
            <b>인증에 실패했습니다</b>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <label>이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="field-row">
            <label>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button className="btn-primary auth-submit" type="submit" disabled={pending}>
            {pending ? "로그인 중…" : "로그인"}
          </button>
        </form>

        <div className="auth-divider">또는 소셜 로그인으로 시작</div>
        <div className="auth-social-row">
          <button type="button" className="btn-outline" onClick={() => setError("소셜 로그인은 준비 중이에요. 이메일로 로그인해주세요.")}>
            카카오로 로그인
          </button>
          <button type="button" className="btn-outline" onClick={() => setError("소셜 로그인은 준비 중이에요. 이메일로 로그인해주세요.")}>
            네이버로 로그인
          </button>
          <button type="button" className="btn-outline" onClick={handleGoogleLogin} disabled={pending}>
            구글로 로그인
          </button>
        </div>

        <p className="auth-footer-note">
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
        <p className="auth-hint mono">데모 계정: demo@siganyeohaeng.kr / demo1234</p>
      </div>
    </div>
  );
}
