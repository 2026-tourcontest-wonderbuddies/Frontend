import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, authErrorMessage } from "../auth/AuthContext";

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!PASSWORD_RULE.test(password)) {
      setError("비밀번호는 8자 이상, 영문·숫자·특수문자를 모두 포함해야 해요.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않아요.");
      return;
    }

    setPending(true);
    try {
      await signup({ email, password, name });
      navigate("/", { replace: true });
    } catch (err) {
      setError(authErrorMessage(err, "회원가입에 실패했습니다."));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-eyebrow">TIME-BASED JEJU TRAVEL PLATFORM</div>
        <h1 className="auth-title">계정 생성</h1>
        <p className="auth-sub">제주 여행을 계획하기 위해 계정을 만들어보세요</p>

        {error && (
          <div className="auth-error-banner">
            <b>가입할 수 없어요</b>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <label>이름</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
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
              autoComplete="new-password"
            />
          </div>
          <div className="field-row">
            <label>비밀번호 확인</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <p className="auth-hint">8자 이상의 영문, 숫자, 특수문자를 포함해주세요</p>
          <button className="btn-primary auth-submit" type="submit" disabled={pending}>
            {pending ? "가입 중…" : "가입하기"}
          </button>
        </form>

        <div className="auth-divider">또는</div>
        <div className="auth-social-row">
          <button type="button" className="btn-outline" onClick={() => setError("소셜 가입은 준비 중이에요. 이메일로 가입해주세요.")}>
            구글로 가입
          </button>
          <button type="button" className="btn-outline" onClick={() => setError("소셜 가입은 준비 중이에요. 이메일로 가입해주세요.")}>
            카카오로 가입
          </button>
          <button type="button" className="btn-outline" onClick={() => setError("소셜 가입은 준비 중이에요. 이메일로 가입해주세요.")}>
            네이버로 가입
          </button>
        </div>

        <p className="auth-footer-note">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  );
}
