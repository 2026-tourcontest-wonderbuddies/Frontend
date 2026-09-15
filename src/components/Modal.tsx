import { useRef, useState, type PointerEvent, type ReactNode, type TransitionEvent } from "react";

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

type DragPhase = "idle" | "dragging" | "snapping" | "closing";

export default function Modal({ title, subtitle, onClose, children, wide }: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
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
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
