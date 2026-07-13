"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

// Letvægts QR-scanner i browseren. Bruger bagkameraet og jsQR.
export function Scanner({
  onResult,
  onClose,
  hint,
  overlayClassName,
}: {
  onResult: (text: string) => void;
  onClose?: () => void;
  hint?: string;
  /** Overstyr overlayets z-index (fx naar scanneren skal ligge over kioskmodus). */
  overlayClassName?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const doneRef = useRef(false);
  // onResult i en ref, saa kamera-effekten kan koere med [] og ALDRIG rives ned
  // igen af en re-render eller en ny callback-identitet (det lukkede kameraet).
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const [status, setStatus] = useState<"starting" | "scanning" | "error">(
    "starting",
  );

  useEffect(() => {
    let cancelled = false;

    async function getStream(): Promise<MediaStream> {
      // Foerst bagkameraet; falder tilbage til et hvilket som helst kamera,
      // hvis "environment" ikke findes (fx laptops eller streng iOS-adfaerd).
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch {
        return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
    }

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("no-media");
        const stream = await getStream();
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        // iOS kan afvise play() hvis den afbrydes; ignorer og lad tick vente
        // paa data i stedet for at gaa i fejl-tilstand.
        try {
          await video.play();
        } catch {
          /* tick() venter paa HAVE_ENOUGH_DATA uanset */
        }
        if (cancelled) return;
        setStatus("scanning");
        tick();
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || doneRef.current || cancelled) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const w = video.videoWidth;
        const h = video.videoHeight;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx && w && h) {
          ctx.drawImage(video, 0, 0, w, h);
          const img = ctx.getImageData(0, 0, w, h);
          const code = jsQR(img.data, img.width, img.height, {
            inversionAttempts: "dontInvert",
          });
          if (code && code.data) {
            doneRef.current = true;
            onResultRef.current(code.data);
            return;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    start();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // Bevidst tom: kameraet startes een gang og lukkes kun ved unmount.
  }, []);

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center bg-ink/95 p-6 ${
        overlayClassName ?? "z-50"
      }`}
    >
      <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-lg bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />
        {/* sigtefelt */}
        <div className="pointer-events-none absolute inset-8 rounded-lg border-2 border-parchment/70" />
      </div>
      <p className="mt-6 max-w-xs text-center text-[0.85rem] font-[200] text-parchment/80">
        {status === "error"
          ? "Vi kunne ikke åbne kameraet. Giv adgang i browseren og prøv igen."
          : status === "starting"
            ? "Åbner kamera..."
            : (hint ?? "Ret kameraet mod QR-koden.")}
      </p>
      {onClose ? (
        <button
          onClick={onClose}
          className="mt-6 rounded-full border border-parchment/30 px-6 py-2.5 text-[0.78rem] font-[400] uppercase tracking-[0.12em] text-parchment/90 transition-colors hover:bg-parchment/10"
        >
          Luk
        </button>
      ) : null}
    </div>
  );
}
