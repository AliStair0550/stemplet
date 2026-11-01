"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

// Letvægts QR-scanner i browseren. Bruger bagkameraet og jsQR.

// Kameraet deles mellem scanninger: ved kassen scannes kunde efter kunde, og at
// starte kameraet forfra koster 0,3-1 sek. hver gang paa iPhone. Efter en
// scanning holdes det kørende i et minut og slukkes saa, saa kameralampen ikke
// lyser, naar ingen scanner.
const IDLE_STOP_MS = 60_000;
let sharedStream: MediaStream | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;

function liveStream(): MediaStream | null {
  return sharedStream?.getVideoTracks().some((t) => t.readyState === "live") ? sharedStream : null;
}

function releaseStream() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    sharedStream?.getTracks().forEach((t) => t.stop());
    sharedStream = null;
    idleTimer = null;
  }, IDLE_STOP_MS);
}

// QR-koden sidder i midten af sigtefeltet: afkod kun et centreret kvadrat,
// nedskaleret til hoejst 480 px, ca. 15 gange i sekundet. Fuld opløsning i hver
// frame tog 20-150 ms paa hovedtraaden.
const DECODE_SIZE = 480;
const DECODE_EVERY_MS = 66;

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
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);
  const [status, setStatus] = useState<"starting" | "scanning" | "error">(
    "starting",
  );
  // Stiger, naar man trykker "Prøv igen": genstarter kamera-effekten.
  const [retryKey, setRetryKey] = useState(0);

  // Escape lukker overlayet (tastatur/desktop), som en rigtig dialog.
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    doneRef.current = false;

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
        if (idleTimer) {
          clearTimeout(idleTimer);
          idleTimer = null;
        }
        let stream = liveStream();
        if (!stream) {
          if (!navigator.mediaDevices?.getUserMedia) throw new Error("no-media");
          stream = await getStream();
          sharedStream = stream;
        }
        if (cancelled) {
          releaseStream();
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

    let lastDecode = 0;
    function tick(now = 0) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || doneRef.current || cancelled) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA && now - lastDecode >= DECODE_EVERY_MS) {
        lastDecode = now;
        const w = video.videoWidth;
        const h = video.videoHeight;
        // Centreret kvadrat (det, sigtefeltet viser), nedskaleret.
        const side = Math.min(w, h);
        const size = Math.min(side, DECODE_SIZE);
        if (canvas.width !== size) {
          canvas.width = size;
          canvas.height = size;
        }
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx && w && h) {
          ctx.drawImage(video, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size);
          const img = ctx.getImageData(0, 0, size, size);
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
    // Sikkerhedsnet: hvis getUserMedia hverken lykkes eller fejler (fx en
    // tilladelses-prompt der bare afvises paa nogle browsere), saa kameraet
    // "haenger", vis en paen fejl efter et stykke tid i stedet for evig venten.
    const startTimeout = setTimeout(() => {
      if (!cancelled && !doneRef.current) {
        setStatus((s) => (s === "starting" ? "error" : s));
      }
    }, 12000);
    return () => {
      cancelled = true;
      clearTimeout(startTimeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // Slukkes ikke straks: naeste scanning genbruger kameraet (se releaseStream).
      if (streamRef.current) releaseStream();
    };
    // Kameraet startes een gang (og ved "Prøv igen" via retryKey); ikke af
    // almindelige re-renders, som ellers ville rive kameraet ned midt i en scan.
  }, [retryKey]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scan QR-kode"
      className={`fixed inset-0 flex flex-col items-center justify-center bg-ink p-6 ${
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
      {onClose || status === "error" ? (
        <div className="mt-6 flex items-center gap-3">
          {status === "error" ? (
            <button
              type="button"
              onClick={() => {
                setStatus("starting");
                setRetryKey((k) => k + 1);
              }}
              className="rounded-full bg-parchment px-6 py-2.5 text-[0.78rem] font-[500] uppercase tracking-[0.12em] text-ink transition-opacity hover:opacity-80"
            >
              Prøv igen
            </button>
          ) : null}
          {onClose ? (
            <button
              type="button"
              autoFocus
              onClick={onClose}
              className="rounded-full border border-white/40 bg-transparent px-6 py-2.5 text-[0.78rem] font-[400] uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/10"
            >
              Luk
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
