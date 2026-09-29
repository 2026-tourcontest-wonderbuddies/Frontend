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
    // 데스크톱은 중앙 모달이라 끌어서 닫는 동작이 없다.
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
    if (window.matchMedia("(min-width:641px)").matches) return;
    startYRef.current = e.clientY;
  }

  function handleBodyPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (draggingRef.current) {
      handlePointerMove(e);
      return;
    }
    if (window.matchMedia("(min-width:641px)").matches) return;
    if ((bodyRef.current?.scrollTop ?? 0) > 0) return;
    if (e.clientY - startYRef.current < 8) return;
    draggingRef.current = true;
    startYRef.current = e.clientY; // 여기서 기준점을 다시 잡아 패널이 튀지 않게 한다.
    dragYRef.current = 0;
    setPhase("dragging");
    setDragY(0);
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
