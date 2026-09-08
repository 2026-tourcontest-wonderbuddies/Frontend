interface WizardProgressProps {
  steps: { key: string; title: string }[];
  current: number;
  /** 지금까지 도달해본 가장 뒤 스텝. 그보다 앞선 스텝만 클릭으로 되돌아갈 수 있다. */
  maxVisited: number;
  onJump: (index: number) => void;
}

export default function WizardProgress({ steps, current, maxVisited, onJump }: WizardProgressProps) {
  return (
    <div className="wizard-progress">
      <div className="wizard-progress-head">
        <span className="mono">
          {current + 1} / {steps.length}
        </span>
        <span className="wizard-progress-title">{steps[current].title}</span>
      </div>
      <ol className="wizard-progress-bar">
        {steps.map((s, i) => {
          const state = i === current ? " current" : i < current ? " done" : "";
          const reachable = i <= maxVisited;
          return (
            <li key={s.key} className={`wizard-progress-seg${state}`}>
              <button
                type="button"
                disabled={!reachable || i === current}
                aria-current={i === current ? "step" : undefined}
                aria-label={`${i + 1}단계 ${s.title}`}
                onClick={() => onJump(i)}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
