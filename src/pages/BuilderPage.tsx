import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BuilderDial from "../components/BuilderDial";
import LoadingChecklist from "../components/LoadingChecklist";
import WizardProgress from "../components/builder/WizardProgress";
import StepSchedule, { TRIP_LENGTH_CHIPS } from "../components/builder/StepSchedule";
import StepPurpose from "../components/builder/StepPurpose";
import StepTaste from "../components/builder/StepTaste";
import StepLodging from "../components/builder/StepLodging";
import { useCreateTrip } from "../hooks/useCreateTrip";
import { useAuth } from "../auth/AuthContext";
import { addDays, fmtHour, resolveDayHours } from "../utils/date";
import { defaultBuilderForm, type BuilderForm } from "../types/builderForm";
import {
  PURPOSE_LABELS,
  REGION_CODE_BY_KEY,
  REGION_LABELS,
  type PurposeKey,
  type TripCreateRequest,
} from "../api/types";

const PENDING_TRIP_KEY = "tj_pending_trip";

type StepKey = "schedule" | "purpose" | "taste" | "lodging";

/** 다일 여행에서만 노출되는 스텝. 당일치기면 통째로 빠진다. */
const MULTI_DAY_ONLY: StepKey[] = ["lodging"];

interface StepDef {
  key: StepKey;
  title: string;
}

const ALL_STEPS: StepDef[] = [
  { key: "schedule", title: "언제, 몇 분이서 가세요?" },
  { key: "purpose", title: "어디서 무엇을 하고 싶으세요?" },
  { key: "taste", title: "취향을 알려주세요" },
  { key: "lodging", title: "숙박 조건" },
];

/** 스텝별 필수 검증. 빈 배열이면 통과. */
function stepErrors(form: BuilderForm, key: StepKey): string[] {
  const errors: string[] = [];
  if (key === "schedule") {
    if (!form.startDate) errors.push("출발일을 선택해주세요.");
    if (form.nights === 0 && form.endHour <= form.startHour) {
      errors.push("당일치기는 종료 시각이 시작 시각보다 늦어야 해요.");
    }
    if (form.nights > 0) {
      for (const d of resolveDayHours(form.nights, form.startHour, form.endHour, form.dayHours)) {
        if (d.endHour <= d.startHour) {
          errors.push(`${d.dayIndex}일차는 종료 시각이 시작 시각보다 늦어야 해요.`);
        }
      }
    }
    const n = Number(form.headcount);
    if (!Number.isFinite(n) || n < 1) errors.push("인원 수는 1명 이상이어야 해요.");
  }
  if (key === "purpose" && !form.purposeMain) {
    errors.push("여행 주목적을 골라주세요.");
  }
  return errors;
}

export default function BuilderPage() {
  const navigate = useNavigate();
  const createTrip = useCreateTrip();
  const { isAuthenticated } = useAuth();

  const [form, setForm] = useState<BuilderForm>(defaultBuilderForm);
  const [step, setStep] = useState(0);
  const [maxVisited, setMaxVisited] = useState(0);
  /** 취소를 눌러 폼으로 돌아왔는지. 뒤늦게 도착한 응답이 화면을 옮기는 걸 막는다. */
  const abandoned = useRef(false);

  const patch = (p: Partial<BuilderForm>) => setForm((f) => ({ ...f, ...p }));

  const isMultiDay = form.nights > 0;
  const endDate = useMemo(() => addDays(form.startDate, form.nights), [form.startDate, form.nights]);

  // 당일치기면 숙박 관련 스텝이 빠져 3스텝이 된다.
  const steps = useMemo(
    () => (isMultiDay ? ALL_STEPS : ALL_STEPS.filter((s) => !MULTI_DAY_ONLY.includes(s.key))),
    [isMultiDay],
  );

  // 숙박 스텝이 사라져 step이 배열 밖을 가리키지 않도록 클램프.
  useEffect(() => {
    const last = steps.length - 1;
    setStep((s) => Math.min(s, last));
    setMaxVisited((m) => Math.min(m, last));
  }, [steps.length]);

  const currentStep = steps[step];
  const currentErrors = stepErrors(form, currentStep.key);
  const isLastStep = step === steps.length - 1;
  const blockedFields = steps.flatMap((s) => stepErrors(form, s.key));

  function goNext() {
    if (currentErrors.length) return;
    const next = Math.min(step + 1, steps.length - 1);
    setStep(next);
    setMaxVisited((m) => Math.max(m, next));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goPrev() {
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function jumpTo(index: number) {
    if (index > maxVisited) return;
    setStep(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildPayload(): TripCreateRequest {
    // 24시는 그 날 00:00이 아니라 다음 날 00:00이다. 날짜를 하루 넘겨야 마지막 날이 사라지지 않는다.
    const endsAtMidnight = form.endHour === 24;
    return {
      // 서버 TIME_ZONE이 UTC라서 오프셋을 빼면 9시간 밀린다. KST를 명시한다.
      start_datetime: `${form.startDate}T${fmtHour(form.startHour)}:00+09:00`,
      end_datetime: `${endsAtMidnight ? addDays(endDate, 1) : endDate}T${fmtHour(endsAtMidnight ? 0 : form.endHour)}:00+09:00`,
      guests: Number(form.headcount),
      purpose_main: form.purposeMain as PurposeKey,
      purpose_sub: form.purposeSub || undefined,
      region_preference: form.region ? REGION_CODE_BY_KEY[form.region] : undefined,
      free_text_input: form.freeTextInput || undefined,
      food_pref_1: form.foodPrefs[0] || undefined,
      food_pref_2: form.foodPrefs[1] || undefined,
      lodging_type: isMultiDay ? form.lodgingType || undefined : undefined,
      lodging_need_cooking: isMultiDay ? form.cooking === "필요" : undefined,
      lodging_free_text: isMultiDay ? form.lodgingFreeText || undefined : undefined,
      // 숙소 자체는 여기서 정하지 않는다. 백엔드 추천 알고리즘이 "그날 마지막 장소"에서의
      // 이동시간으로 앵커를 고르므로(accommodations/recommend.py) 코스가 있어야 의미가 있다.
      // 코스 생성 후 LodgingPage(명세 6·7번)에서 고른다.
    };
  }

  function submit(payload: TripCreateRequest) {
    abandoned.current = false;
    createTrip.mutate(payload, {
      // 명세 1번은 코스 본문이 아니라 id 3개만 준다. 후보 화면이 trip_id로 상세를 받아온다.
      onSuccess: (res) => {
        // 취소하고 폼으로 돌아온 뒤에 응답이 도착할 수 있다. 그때 화면을 끌고 가면 안 된다.
        if (abandoned.current) return;
        navigate(`/trips/${res.trip_id}/courses`);
      },
    });
  }

  /** 기다리기를 포기하고 폼으로 돌아온다. 서버 작업을 멈출 수단은 없어서 그대로 돈다. */
  function abandonWait() {
    abandoned.current = true;
    createTrip.reset();
  }

  function handleSubmit() {
    // 뒤로 가서 값을 지웠을 수 있으니 제출 직전에 전체 스텝을 다시 검증한다.
    if (blockedFields.length) return;
    const payload = buildPayload();

    if (!isAuthenticated) {
      sessionStorage.setItem(PENDING_TRIP_KEY, JSON.stringify(payload));
      navigate("/login", { state: { from: "/builder" } });
      return;
    }

    submit(payload);
  }

  // If the user got redirected to /login mid-submit, resume automatically
  // once they are back here and authenticated.
  useEffect(() => {
    if (!isAuthenticated) return;
    const raw = sessionStorage.getItem(PENDING_TRIP_KEY);
    if (!raw) return;
    sessionStorage.removeItem(PENDING_TRIP_KEY);
    try {
      submit(JSON.parse(raw) as TripCreateRequest);
    } catch {
      // ignore malformed pending payload
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (createTrip.isPending) {
    return (
      <LoadingChecklist
        note="여행 조건을 분석하고 있습니다 · 일정이 길수록 몇 분까지 걸릴 수 있어요"
        onCancel={abandonWait}
      />
    );
  }

  const headcountNum = Number(form.headcount);
  const headcountValid = Number.isFinite(headcountNum) && headcountNum >= 1;

  return (
    <div id="screen-builder">
      <section className="builder wrap">
        <div className="wizard-shell">
          <div className="intro-eyebrow">BUILD YOUR OWN JEJU TIMELINE</div>
          <h1 className="intro-title">조건을 알려주시면 코스를 완성해드려요.</h1>
          <p className="step-sub" style={{ marginLeft: 0 }}>* 모든 이동수단은 차량 기준입니다.</p>

          <WizardProgress steps={steps} current={step} maxVisited={maxVisited} onJump={jumpTo} />

          <div className="wizard-body">
            {currentStep.key === "schedule" && <StepSchedule form={form} patch={patch} />}
            {currentStep.key === "purpose" && <StepPurpose form={form} patch={patch} />}
            {currentStep.key === "taste" && <StepTaste form={form} patch={patch} />}
            {currentStep.key === "lodging" && <StepLodging form={form} patch={patch} />}
          </div>

          {currentErrors.map((e) => (
            <div className="form-error" key={e}>
              {e}
            </div>
          ))}

          <div className="wizard-nav">
            <button type="button" className="btn-outline" onClick={goPrev} disabled={step === 0}>
              ← 이전
            </button>
            {isLastStep ? (
              <button
                className="cta-final"
                onClick={handleSubmit}
                disabled={blockedFields.length > 0 || createTrip.isPending}
              >
                이 조건으로 코스 매칭받기 →
              </button>
            ) : (
              <button type="button" className="cta-final" onClick={goNext} disabled={currentErrors.length > 0}>
                다음 →
              </button>
            )}
          </div>

          {createTrip.isError && (
            <div className="form-error">코스를 만드는 중 문제가 발생했어요. 조건을 확인하고 다시 시도해주세요.</div>
          )}
          {isLastStep && !isAuthenticated && (
            <p className="auth-hint" style={{ marginTop: 10 }}>
              추천을 받으려면 로그인이 필요해요. 지금 조건은 그대로 저장했다가 로그인 후 이어서 진행할게요.
            </p>
          )}
        </div>

        <aside className={`preview${isLastStep ? "" : " preview-desktop-only"}`}>
          <div className="preview-card">
            <BuilderDial start={form.startHour} end={form.endHour} />
            <div className="summary">
              <h4>지금까지 설정한 조건</h4>
              <div className="sum-row">
                <span>여행 기간</span>
                <b className="mono">{TRIP_LENGTH_CHIPS.find((c) => c.nights === form.nights)?.label}</b>
              </div>
              <div className="sum-row">
                <span>인원 수</span>
                <b className="mono">{headcountValid ? `${headcountNum}명` : "미입력"}</b>
              </div>
              <div className="sum-row">
                <span>희망 지역</span>
                <b className="mono">{form.region ? REGION_LABELS[form.region] : "전역"}</b>
              </div>
              <div className="sum-row">
                <span>목적</span>
                <b className="mono">
                  {form.purposeMain ? PURPOSE_LABELS[form.purposeMain] : "미선택"}
                  {form.purposeSub ? ` · ${PURPOSE_LABELS[form.purposeSub]}` : ""}
                </b>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
