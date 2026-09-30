import { useRef, useState, type PointerEvent, type ReactNode, type TransitionEvent } from "react";

interface ModalProps {
  title: string;
  /** 제목 바로 옆에 붙는 짧은 꼬리표. 제목이 짧을 때 한 줄을 같이 쓴다. */
  titleAside?: ReactNode;
  subtitle?: ReactNode;
  /** 닫기 버튼 왼쪽에 붙는 버튼(예: 저장). */
  headAction?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  /** 본문을 맨 위까지 스크롤한 상태에서 아래로 더 끌면(핸들 없이도) 닫히게 한다. */
  swipeBodyToClose?: boolean;
}

type DragPhase = "idle" | "dragging" | "snapping" | "closing";

export default function Modal({ title, titleAside, subtitle, headAction, onClose, children, wide, swipeBodyToClose }: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const startYRef = useRef(0);
  // 연속으로 들어오는 pointer 이벤트 사이에서 React state는 아직 커밋 전일 수 있어(스테일 클로저),
  // 제스처 판정(끄는 중인지, 얼마나 끌었는지)은 ref로 동기 처리하고 state는 렌더링(transform/transition)에만 쓴다.
  const draggingRef = useRef(false);
  const dragYRef = useRef(0);
  const [phase, setPhase] = useState<DragPhase>("idle");
  const [dragY, setDragY] = useState(0);

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    // 끌어서 닫기는 손가락 제스처다. 마우스로 누르고 끄는 건 닫기가 아니라 그냥 클릭·드래그로 남겨둔다.
    if (e.pointerType === "mouse") return;
    // 데스크톱은 중앙 모달이라 끌어서 닫는 동작이 없다. (창 폭만으로 판단하므로 모바일 폭의 창을 열어둔
    // 데스크톱에서도 손가락이 아니라 창 폭이 좁을 때만 걸린다 — 위 마우스 제외 체크와 함께 써야 안전하다.)
    if (window.matchMedia("(min-width:641px)").matches) return;
    draggingRef.current = true;
    startYRef.current = e.clientY;
    dragYRef.current = 0;
    setPhase("dragging");
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    dragYRef.current = Math.max(0, e.clientY - startYRef.current);
    setDragY(dragYRef.current);
  }

  // 핸들과 같은 로직을 쓰되, 본문이 맨 위(scrollTop 0)일 때 아래로 끄는 제스처만 가로채 닫기로 넘긴다.
  // 그 전까지는 아무것도 건드리지 않아 평소 스크롤이 그대로 동작한다.
  function handleBodyPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse") return; // 마우스 드래그로는 닫히지 않게 — 손가락 제스처 전용.
    if (window.matchMedia("(min-width:641px)").matches) return;
    startYRef.current = e.clientY;
  }

  function handleBodyPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (draggingRef.current) {
      // 실기기에서는 여기서 막지 않으면 브라우저가 이 손짓을 여전히 "스크롤 바운스"로도 같이 처리해서,
      // 우리가 그리는 translateY와 네이티브 바운스가 서로 싸워 실제로는 안 끌리는 것처럼 보인다.
      e.preventDefault();
      handlePointerMove(e);
      return;
    }
    if (e.pointerType === "mouse") return;
    if (window.matchMedia("(min-width:641px)").matches) return;
    if ((bodyRef.current?.scrollTop ?? 0) > 0) return;
    const delta = e.clientY - startYRef.current;
    if (delta <= 0) return; // 위로 움직였거나 그대로면 더 스크롤할 여지가 없으니 그냥 둔다(닫기 의도가 아님).
    // 맨 위에서 아래로 끄는 중 — 여기서부터 막아야 실기기에서 브라우저의 스크롤 바운스가 끼어들지 않는다.
    // 8px 문턱보다 먼저 막는 이유: 문턱을 넘긴 뒤에 막으면 이미 브라우저가 바운스를 시작해버린 뒤라 늦다.
    e.preventDefault();
    if (delta < 8) return;
    draggingRef.current = true;
    startYRef.current = e.clientY; // 여기서 기준점을 다시 잡아 패널이 튀지 않게 한다.
    dragYRef.current = 0;
    setPhase("dragging");
    setDragY(0);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function endDrag() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const panelHeight = panelRef.current?.offsetHeight ?? 0;
    if (dragYRef.current > panelHeight * 0.3) {
      setPhase("closing");
      setDragY(panelHeight + 40);
    } else {
      setPhase("snapping");
      setDragY(0);
    }
  }

  function handleTransitionEnd(e: TransitionEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
    if (phase === "closing") onClose();
    else if (phase === "snapping") setPhase("idle");
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={panelRef}
        className={`modal-panel${wide ? " wide" : ""}`}
        style={phase === "idle" ? undefined : { transform: `translateY(${dragY}px)`, transition: phase === "dragging" ? "none" : undefined }}
        onTransitionEnd={handleTransitionEnd}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          className="modal-drag-handle"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />
        <div className="modal-head">
          <div className="modal-head-text">
            <h3>{title}</h3>
            {titleAside && <span className="modal-title-aside">{titleAside}</span>}
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          <div className="modal-head-actions">
            {headAction}
            <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
              ✕
            </button>
          </div>
        </div>
        <div
          className="modal-body"
          ref={bodyRef}
          {...(swipeBodyToClose
            ? {
                onPointerDown: handleBodyPointerDown,
                onPointerMove: handleBodyPointerMove,
                onPointerUp: endDrag,
                onPointerCancel: endDrag,
              }
            : {})}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
