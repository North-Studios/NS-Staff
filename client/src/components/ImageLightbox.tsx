import { useCallback, useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
const MIN_SCALE = 1;
const MAX_SCALE = 5;

export type ImageLightboxVariant = 'plain' | 'polaroid';

interface ImageLightboxProps {
  src: string;
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: ImageLightboxVariant;
}

type Point = { x: number; y: number };

function pointerDistance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function ImageLightbox({
  src,
  alt,
  open,
  onOpenChange,
  variant = 'plain',
}: ImageLightboxProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, Point>());
  const dragging = useRef(false);
  const lastPointer = useRef<Point>({ x: 0, y: 0 });
  const pinchStart = useRef<{ distance: number; scale: number } | null>(null);
  const scaleRef = useRef(1);

  const resetView = useCallback(() => {
    scaleRef.current = 1;
    setScale(1);
    setOffset({ x: 0, y: 0 });
    pinchStart.current = null;
    dragging.current = false;
    pointers.current.clear();
  }, []);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    if (!open) resetView();
  }, [open, resetView]);

  const close = () => onOpenChange(false);

  const closeIfBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) close();
  };

  const clampScale = (value: number) =>
    Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

  const applyScale = (next: number) => {
    const clamped = clampScale(next);
    scaleRef.current = clamped;
    setScale(clamped);
    if (clamped <= 1) setOffset({ x: 0, y: 0 });
  };

  const zoomBy = (delta: number) => {
    setScale((current) => {
      const next = clampScale(current + delta);
      if (next <= 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoomBy(e.deltaY > 0 ? -0.2 : 0.2);
  };

  const beginPinchIfNeeded = () => {
    if (pointers.current.size !== 2) {
      pinchStart.current = null;
      return;
    }
    const pts = [...pointers.current.values()];
    pinchStart.current = {
      distance: pointerDistance(pts[0], pts[1]),
      scale: scaleRef.current,
    };
    dragging.current = false;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      beginPinchIfNeeded();
      return;
    }

    if (pointers.current.size === 1 && scaleRef.current > 1) {
      dragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;

    const point = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, point);

    if (pointers.current.size === 2 && pinchStart.current) {
      e.preventDefault();
      const pts = [...pointers.current.values()];
      const distance = pointerDistance(pts[0], pts[1]);
      if (pinchStart.current.distance > 0) {
        applyScale(
          pinchStart.current.scale * (distance / pinchStart.current.distance),
        );
      }
      return;
    }

    if (pointers.current.size === 1 && dragging.current && scaleRef.current > 1) {
      const dx = point.x - lastPointer.current.x;
      const dy = point.y - lastPointer.current.y;
      lastPointer.current = point;
      setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* not captured */
    }

    if (pointers.current.size < 2) {
      pinchStart.current = null;
    }

    if (pointers.current.size === 0) {
      dragging.current = false;
    } else if (pointers.current.size === 1 && scaleRef.current > 1) {
      const remaining = [...pointers.current.values()][0];
      dragging.current = true;
      lastPointer.current = remaining;
    }
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      resetView();
    } else {
      setScale(2);
    }
  };

  const transformStyle = {
    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
    transformOrigin: 'center center',
    cursor: scale > 1 ? 'grab' : 'zoom-in',
  } as const;

  const mediaContent =
    variant === 'polaroid' ? (
      <div
        className="bg-white p-4 pb-16 shadow-2xl dark:!bg-white"
        style={{ filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3))' }}
      >
        <div className="aspect-square w-[min(85vw,20rem)] overflow-hidden bg-white dark:!bg-white md:w-80">
          <img
            src={src}
            alt={alt}
            draggable={false}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    ) : (
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="max-h-[min(85vh,calc(100vh-8rem))] max-w-[min(95vw,100%)] object-contain"
      />
    );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50 bg-black/90 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onClick={close}
        />
        <Dialog.Content
          className="fixed inset-0 z-50 flex flex-col outline-none"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <Dialog.Title className="sr-only">{alt}</Dialog.Title>
          <Dialog.Description className="sr-only">
            Image viewer with zoom
          </Dialog.Description>

          <Dialog.Close
            className="absolute right-3 top-3 z-[60] rounded-md p-2 text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Dialog.Close>

          <div
            className="flex flex-1 touch-none select-none overflow-hidden"
            style={{ touchAction: 'none' }}
            onClick={closeIfBackdrop}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onDoubleClick={handleDoubleClick}
          >
            <div
              className="flex h-full w-full items-center justify-center p-4 pb-24"
              onClick={closeIfBackdrop}
            >
              <div
                className="transition-transform duration-100"
                style={transformStyle}
                onClick={(e) => e.stopPropagation()}
              >
                {mediaContent}
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[60] flex justify-center gap-3 p-4 pb-8">
            <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-black/50 px-3 py-2 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => zoomBy(-0.5)}
                disabled={scale <= MIN_SCALE}
                className="rounded-full p-2.5 text-white/90 hover:bg-white/15 hover:text-white disabled:opacity-40"
                aria-label="Zoom out"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => zoomBy(0.5)}
                disabled={scale >= MAX_SCALE}
                className="rounded-full p-2.5 text-white/90 hover:bg-white/15 hover:text-white disabled:opacity-40"
                aria-label="Zoom in"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={resetView}
                className="rounded-full p-2.5 text-white/90 hover:bg-white/15 hover:text-white"
                aria-label="Reset zoom"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
