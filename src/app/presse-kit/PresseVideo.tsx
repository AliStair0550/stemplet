"use client";

import { useEffect, useRef, useState } from "react";
import { btnClass } from "@/components/ui";

// Downloadbar produkt-animation (canvas, saa browseren kan optage den til en
// videofil). ~9 sek, hurtige klip, dopamin: scan QR -> se stempelkort -> tryk
// Tilfoej -> Wallet aabner og stemplerne popper ind. Kaffebar-eksempel i brandets
// farver. DOM/CSS kan ikke optages af MediaRecorder, derfor tegnes alt paa canvas.

const W = 1080;
const H = 1350;
const LOOP = 9.0; // sekunder pr. gennemloeb (og laengden af den optagne video)

// ── Palette (brand) ───────────────────────────────────────────────────
const PARCH = "#FAF8F4";
const INK = "#1C1917";
const RUST = "#A6502E";
const RUST_HI = "#A9572F";
const RUST_LO = "#974829";
const CREAM = "#F7EFE6";
const GOLD = "#C9A24B";

// Antal stempler i videoen (4 kolonner x 2 raekker).
const STAMPS = 8;
const COLS = 4;
// Kamera-baggrund under scanningen: samme billede som paa kaffebar-branchesiden.
const SCAN_BG = "/brancher/kaffebar-scene.png";

// ── Smaa hjaelpere ────────────────────────────────────────────────────
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
// Fremdrift i intervallet [a,b] -> 0..1
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeBack = (t: number) => {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Deterministisk QR-agtigt moenster (ikke scanbart, kun til visning).
function buildQR() {
  const n = 21;
  const cells: boolean[][] = [];
  for (let i = 0; i < n; i++) {
    cells[i] = [];
    for (let j = 0; j < n; j++) {
      cells[i][j] = ((i * 7 + j * 13 + i * j * 3) % 5) % 2 === 0;
    }
  }
  // Finder-firkanter i tre hjOerner
  const finder = (r: number, c: number) => {
    for (let i = -1; i <= 7; i++)
      for (let j = -1; j <= 7; j++) {
        const ii = r + i,
          jj = c + j;
        if (ii < 0 || jj < 0 || ii >= n || jj >= n) continue;
        const border = i === 0 || i === 6 || j === 0 || j === 6;
        const core = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        cells[ii][jj] = i >= 0 && i <= 6 && j >= 0 && j <= 6 && (border || core);
        if (i === -1 || i === 7 || j === -1 || j === 7) cells[ii][jj] = false;
      }
  };
  finder(0, 0);
  finder(0, n - 7);
  finder(n - 7, 0);
  return { n, cells };
}

// Lille kaffekop-glyf (rust) centreret i (x,y) med stOrrelse s.
function drawCoffee(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  color: string,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = s * 0.11;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const w = s * 0.72;
  const h = s * 0.6;
  roundRect(ctx, x - w / 2, y - h / 2, w * 0.82, h, s * 0.14);
  ctx.stroke();
  // haank
  ctx.beginPath();
  ctx.arc(x + w * 0.28, y - h * 0.05, h * 0.28, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  // damp
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.14, y - h * 0.72);
  ctx.quadraticCurveTo(x - w * 0.02, y - h * 0.86, x - w * 0.14, y - h);
  ctx.moveTo(x + w * 0.12, y - h * 0.72);
  ctx.quadraticCurveTo(x + w * 0.24, y - h * 0.86, x + w * 0.12, y - h);
  ctx.stroke();
  ctx.restore();
}

// Fire-takket glimt (dopamin).
function sparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha: number,
) {
  if (alpha <= 0 || r <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.translate(x, y);
  ctx.beginPath();
  for (let k = 0; k < 4; k++) {
    ctx.rotate(Math.PI / 2);
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(r * 0.28, r * 0.28, 0, r);
    ctx.quadraticCurveTo(-r * 0.28, r * 0.28, 0, 0);
  }
  ctx.fill();
  ctx.restore();
}

// Tegn et billede saa det daekker (cover) omraadet, beskaeret proportionalt.
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const ir = img.naturalWidth / img.naturalHeight;
  const r = w / h;
  let dw = w;
  let dh = h;
  let dx = x;
  let dy = y;
  if (ir > r) {
    dh = h;
    dw = h * ir;
    dx = x - (dw - w) / 2;
  } else {
    dw = w;
    dh = w / ir;
    dy = y - (dh - h) / 2;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
}

// Faelles stempel-layout, saa selve tegningen og glimt-positionerne passer sammen.
function stampLayout(cardW: number, cardH: number) {
  const gx = cardW * 0.14;
  const gap = (cardW - gx * 2) / (COLS - 1);
  return { gx, gap, r: gap * 0.3, gridTop: cardH * 0.37, rowGap: cardH * 0.3 };
}

type QR = ReturnType<typeof buildQR>;

// Selve tegne-funktionen: t = loop-tid i sekunder (0..LOOP).
function draw(
  ctx: CanvasRenderingContext2D,
  t: number,
  qr: QR,
  bgImg: HTMLImageElement | null,
) {
  ctx.clearRect(0, 0, W, H);

  // Baggrund: varm pergament + bloedt terracotta-skaer der aander.
  ctx.fillStyle = PARCH;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(
    W / 2,
    H * 0.44,
    60,
    W / 2,
    H * 0.44,
    W * 0.7,
  );
  const gp = 0.10 + 0.03 * Math.sin(t * 1.1);
  glow.addColorStop(0, `rgba(166,80,46,${gp})`);
  glow.addColorStop(1, "rgba(166,80,46,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const intro = easeOut(seg(t, 0, 0.4));

  // Ordmaerke Ooverst.
  ctx.save();
  ctx.globalAlpha = intro;
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = "700 62px 'Instrument Sans', system-ui, sans-serif";
  const mark = "Stemplet";
  const mw = ctx.measureText(mark).width;
  ctx.fillText(mark, W / 2 - 12, 132);
  ctx.fillStyle = RUST;
  ctx.beginPath();
  ctx.arc(W / 2 - 12 + mw / 2 + 20, 128, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── Telefon ─────────────────────────────────────────────────────────
  const pw = 520;
  const ph = 1030;
  const px = (W - pw) / 2;
  const py = 190;
  ctx.save();
  ctx.globalAlpha = intro;
  // skygge
  ctx.shadowColor = "rgba(28,25,23,0.28)";
  ctx.shadowBlur = 70;
  ctx.shadowOffsetY = 40;
  ctx.fillStyle = "#0f0d0c";
  roundRect(ctx, px, py, pw, ph, 74);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.restore();

  // Skaerm-region (klip alt skaerm-indhold hertil).
  const sx = px + 20;
  const sy = py + 20;
  const sw = pw - 40;
  const sh = ph - 40;
  ctx.save();
  ctx.globalAlpha = intro;
  roundRect(ctx, sx, sy, sw, sh, 56);
  ctx.clip();

  // Faser
  const camA = t < 2.3 ? 1 : 1 - seg(t, 2.3, 2.8);
  const inWallet = seg(t, 3.9, 4.4); // 0..1 overgang til Wallet (efter "Tilfoej")
  // Skaerm-baggrund: kamera (moerk) -> pergament -> wallet (let graa-varm)
  const bgLight = seg(t, 2.35, 2.85);
  // Kamera-baggrund: kaffebar-billedet (som paa branchesiden) med et let moerkt
  // slOr for QR-kontrast. Falder tilbage til moerk, hvis billedet ikke er klar.
  if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
    drawCover(ctx, bgImg, sx, sy, sw, sh);
    ctx.fillStyle = "rgba(18,16,14,0.42)";
    ctx.fillRect(sx, sy, sw, sh);
  } else {
    ctx.fillStyle = "#141210";
    ctx.fillRect(sx, sy, sw, sh);
  }
  if (bgLight > 0) {
    ctx.globalAlpha = bgLight;
    ctx.fillStyle = mixWallet(inWallet);
    ctx.fillRect(sx, sy, sw, sh);
    ctx.globalAlpha = 1;
  }

  // ── Fase A: kamera + QR + scanning ─────────────────────────────────
  if (camA > 0) {
    ctx.save();
    ctx.globalAlpha = camA;
    // "kamera"-vignet
    const cx = sx + sw / 2;
    const qy = sy + sh * 0.4;
    const qs = sw * 0.56;
    // hvidt QR-felt
    ctx.fillStyle = "#fff";
    roundRect(ctx, cx - qs / 2 - 22, qy - qs / 2 - 22, qs + 44, qs + 44, 28);
    ctx.fill();
    // moduler
    const n = qr.n;
    const cell = qs / n;
    ctx.fillStyle = INK;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        if (qr.cells[i][j])
          ctx.fillRect(
            cx - qs / 2 + j * cell,
            qy - qs / 2 + i * cell,
            cell + 0.6,
            cell + 0.6,
          );
    // hjOrne-parenteser (terracotta)
    const b = qs / 2 + 46;
    const bl = 54;
    ctx.strokeStyle = RUST;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    const corner = (dx: number, dy: number) => {
      ctx.beginPath();
      ctx.moveTo(cx + dx * b, qy + dy * b - dy * bl);
      ctx.lineTo(cx + dx * b, qy + dy * b);
      ctx.lineTo(cx + dx * b - dx * bl, qy + dy * b);
      ctx.stroke();
    };
    corner(-1, -1);
    corner(1, -1);
    corner(-1, 1);
    corner(1, 1);
    // scan-linje sweeper
    const sweep = seg(t, 0.5, 1.9);
    const ly = qy - qs / 2 + easeInOut(sweep) * qs;
    const grad = ctx.createLinearGradient(0, ly - 40, 0, ly + 40);
    grad.addColorStop(0, "rgba(166,80,46,0)");
    grad.addColorStop(0.5, "rgba(166,80,46,0.85)");
    grad.addColorStop(1, "rgba(166,80,46,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(cx - qs / 2 - 20, ly - 3, qs + 40, 6);
    // "laast" glimt naar scan er faerdig
    const lock = seg(t, 1.9, 2.3);
    if (lock > 0) {
      ctx.globalAlpha = camA * (1 - lock);
      sparkle(ctx, cx, qy, 40 * lock + 10, RUST, 1);
    }
    ctx.restore();
  }

  // ── Kortet (fra scan og resten) ────────────────────────────────────
  const cardIn = seg(t, 2.3, 2.8); // kortet (+ Tilfoej) kommer ind efter scan
  if (cardIn > 0) {
    const cardW = sw * 0.82;
    const cardH = cardW * 0.62;
    const cx = sx + sw / 2;
    // y: settler midt paa skaermen; i wallet loeftes den lidt op
    const restY = sy + sh * 0.32;
    const walletY = sy + sh * 0.26;
    const cy = mix(restY, walletY, easeInOut(inWallet));
    const s = mix(0.86, 1, easeBack(cardIn));
    const floaty = Math.sin(t * 1.6) * 5 * (1 - inWallet) * cardIn;

    // Kortet starter TOMT; stemplerne poppes 0 -> 8 EFTER "Tilfoej".
    const stampsPop: { i: number; p: number }[] = [];
    let filled = 0;
    for (let k = 0; k < STAMPS; k++) {
      const ps = 4.5 + k * 0.26;
      const p = seg(t, ps, ps + 0.3);
      if (p > 0) {
        filled = k + 1;
        if (p < 1) stampsPop.push({ i: k, p });
      }
    }
    // Nulstilling til sidst: kortet toemmes til 0, saa man ser "starter forfra".
    const clear = seg(t, 8.2, 8.8);
    // Beloenningen afsloeres i guld naar kortet er fuldt, og fader ved nulstilling.
    const rewardGlow = seg(t, 6.7, 7.4) * (1 - seg(t, 8.2, 8.7));

    ctx.save();
    ctx.globalAlpha = cardIn;
    ctx.translate(cx, cy + floaty);
    ctx.scale(s, s);
    drawCard(ctx, cardW, cardH, filled, stampsPop, t, rewardGlow, clear);
    ctx.restore();

    // dopamin: glimt naar hvert stempel lander
    for (const sp of stampsPop) {
      const pos = stampPos(cx, cy + floaty, cardW, cardH, sp.i);
      const a = 1 - sp.p;
      for (let a2 = 0; a2 < 6; a2++) {
        const ang = (a2 / 6) * Math.PI * 2;
        const d = easeOut(sp.p) * cardW * 0.16;
        sparkle(
          ctx,
          pos.x + Math.cos(ang) * d,
          pos.y + Math.sin(ang) * d,
          10 * a + 3,
          a2 % 2 ? GOLD : RUST,
          a,
        );
      }
    }
  }

  // Beloennings-tekst i midten, naar kortet er fuldt (dopamin). Fader ved reset.
  const rewardTextA = seg(t, 6.8, 7.4) * (1 - seg(t, 8.2, 8.6));
  if (rewardTextA > 0.01) {
    const tx = sx + sw / 2;
    const ty = sy + sh * 0.62;
    const sc = easeBack(seg(t, 6.8, 7.4));
    ctx.save();
    ctx.globalAlpha = clamp(rewardTextA);
    const gg = ctx.createRadialGradient(tx, ty, 8, tx, ty, sw * 0.55);
    gg.addColorStop(0, "rgba(201,162,75,0.32)");
    gg.addColorStop(1, "rgba(201,162,75,0)");
    ctx.fillStyle = gg;
    ctx.fillRect(sx, ty - sh * 0.2, sw, sh * 0.4);
    ctx.translate(tx, ty);
    ctx.scale(sc, sc);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = INK;
    ctx.font = "700 44px 'Instrument Sans', system-ui, sans-serif";
    ctx.fillText("En valgfri", 0, -28);
    ctx.fillText("gratis kaffe", 0, 28);
    ctx.restore();
  }

  // ── "Tilfoej"-ark + tap: kommer SAMMEN med kortet, fader ved Wallet ──
  const addIn = seg(t, 2.5, 2.9) * (1 - seg(t, 3.8, 4.2));
  if (addIn > 0.01) {
    const barH = 150;
    const by = mix(sy + sh, sy + sh - barH, easeOut(seg(t, 2.5, 2.9)));
    ctx.save();
    ctx.globalAlpha = clamp(addIn);
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    roundRect(ctx, sx + 26, by, sw - 52, barH + 60, 40);
    ctx.fill();
    // knap
    const tap = seg(t, 3.3, 3.7);
    const press = 1 - 0.06 * Math.sin(clamp(tap) * Math.PI);
    const bw = sw - 120;
    const bh = 84;
    const bx = sx + sw / 2 - bw / 2;
    const bby = by + 26;
    ctx.save();
    ctx.translate(sx + sw / 2, bby + bh / 2);
    ctx.scale(press, press);
    ctx.translate(-(sx + sw / 2), -(bby + bh / 2));
    ctx.fillStyle = INK;
    roundRect(ctx, bx, bby, bw, bh, 44);
    ctx.fill();
    ctx.fillStyle = PARCH;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "600 34px 'Instrument Sans', system-ui, sans-serif";
    ctx.fillText("Tilføj", sx + sw / 2, bby + bh / 2 + 2);
    ctx.restore();
    // tap-ringe
    if (tap > 0 && tap < 1) {
      const rr = easeOut(tap) * 90;
      ctx.globalAlpha = clamp(addIn) * (1 - tap);
      ctx.strokeStyle = RUST;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(sx + sw / 2 + bw * 0.28, bby + bh / 2, rr, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore(); // skaerm-klip

  // ── Afsluttende dopamin-bloom (naar kortet er fyldt + beloenning) ──
  const fin = seg(t, 6.7, 8.0);
  if (fin > 0) {
    const a = Math.sin(clamp(fin) * Math.PI);
    const bloom = ctx.createRadialGradient(
      W / 2,
      H * 0.42,
      20,
      W / 2,
      H * 0.42,
      W * 0.5,
    );
    bloom.addColorStop(0, `rgba(201,162,75,${0.18 * a})`);
    bloom.addColorStop(1, "rgba(201,162,75,0)");
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, W, H);
    for (let k = 0; k < 14; k++) {
      const ang = (k / 14) * Math.PI * 2 + fin;
      const d = easeOut(fin) * 320 + 40;
      sparkle(
        ctx,
        W / 2 + Math.cos(ang) * d,
        H * 0.42 + Math.sin(ang) * d * 0.8,
        14 * a + 4,
        k % 2 ? GOLD : RUST,
        a,
      );
    }
  }
}

function mixWallet(w: number): string {
  // pergament -> let varm graa (wallet-agtig)
  const r = Math.round(mix(250, 236, w));
  const g = Math.round(mix(248, 233, w));
  const b = Math.round(mix(244, 227, w));
  return `rgb(${r},${g},${b})`;
}

// Position (canvas-koordinater) for stempel nr. i paa kortet centreret i (cx,cy).
function stampPos(
  cx: number,
  cy: number,
  cardW: number,
  cardH: number,
  i: number,
) {
  const L = stampLayout(cardW, cardH);
  const row = Math.floor(i / COLS);
  const col = i % COLS;
  return {
    x: cx - cardW / 2 + L.gx + col * L.gap,
    y: cy - cardH / 2 + L.gridTop + row * L.rowGap,
  };
}

// Tegn stempelkortet centreret i (0,0) (kalder transformeret).
function drawCard(
  ctx: CanvasRenderingContext2D,
  cardW: number,
  cardH: number,
  filled: number,
  pops: { i: number; p: number }[],
  t: number,
  rewardGlow = 0,
  clear = 0,
) {
  const x = -cardW / 2;
  const y = -cardH / 2;
  ctx.save();
  ctx.shadowColor = "rgba(28,25,23,0.35)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 22;
  const g = ctx.createLinearGradient(0, y, 0, y + cardH);
  g.addColorStop(0, RUST_HI);
  g.addColorStop(1, RUST_LO);
  ctx.fillStyle = g;
  roundRect(ctx, x, y, cardW, cardH, 34);
  ctx.fill();
  ctx.shadowColor = "transparent";

  // glimt-sweep henover kortet
  const sweep = ((t * 0.5) % 1);
  const sg = ctx.createLinearGradient(
    x + sweep * cardW - cardW * 0.25,
    0,
    x + sweep * cardW + cardW * 0.25,
    0,
  );
  sg.addColorStop(0, "rgba(255,255,255,0)");
  sg.addColorStop(0.5, "rgba(255,255,255,0.10)");
  sg.addColorStop(1, "rgba(255,255,255,0)");
  roundRect(ctx, x, y, cardW, cardH, 34);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = sg;
  ctx.fillRect(x, y, cardW, cardH);
  ctx.restore();

  // top: kun butikkens navn (stempel-taeller er bevidst fjernet)
  ctx.fillStyle = CREAM;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.font = "700 30px 'Instrument Sans', system-ui, sans-serif";
  ctx.fillText("Nord Kaffebar", x + cardW * 0.08, y + cardH * 0.2);

  // stempler (4x2)
  const L = stampLayout(cardW, cardH);
  const r = L.r;
  for (let i = 0; i < STAMPS; i++) {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    const px = x + L.gx + col * L.gap;
    const py = y + L.gridTop + row * L.rowGap;
    const pop = pops.find((p) => p.i === i);
    const isFilled = i < filled;
    const s = pop ? easeBack(pop.p) : 1;
    ctx.save();
    ctx.translate(px, py);
    // Tom ring tegnes ALTID, saa den viser sig igen, naar kortet nulstilles.
    ctx.strokeStyle = "rgba(247,239,230,0.4)";
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // Fyldt stempel ovenpaa; fader ud igen ved nulstilling (clear).
    if (isFilled && clear < 1) {
      ctx.globalAlpha = 1 - clear;
      ctx.scale(s, s);
      ctx.fillStyle = CREAM;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      drawCoffee(ctx, 0, 1, r * 1.25, RUST);
    }
    ctx.restore();
  }

  // fod: beloenning "En gratis kaffe" - afsloeres i guld naar kortet er fuldt
  const rxLeft = x + cardW * 0.08;
  if (rewardGlow > 0) {
    const gg = ctx.createRadialGradient(
      x + cardW * 0.4,
      y + cardH * 0.9,
      4,
      x + cardW * 0.4,
      y + cardH * 0.9,
      cardW * 0.5,
    );
    gg.addColorStop(0, `rgba(201,162,75,${0.4 * rewardGlow})`);
    gg.addColorStop(1, "rgba(201,162,75,0)");
    ctx.fillStyle = gg;
    ctx.fillRect(x, y + cardH * 0.72, cardW, cardH * 0.28);
  }
  ctx.fillStyle = CREAM;
  ctx.globalAlpha = 0.6;
  ctx.textAlign = "left";
  ctx.font = "600 14px 'Instrument Sans', system-ui, sans-serif";
  ctx.fillText("BELØNNING", rxLeft, y + cardH * 0.86);
  ctx.globalAlpha = 1;
  ctx.fillStyle = rewardGlow > 0.25 ? GOLD : CREAM;
  ctx.font = `${rewardGlow > 0.25 ? "600" : "300"} 22px 'Instrument Sans', system-ui, sans-serif`;
  ctx.fillText("En valgfri gratis kaffe", rxLeft, y + cardH * 0.95);
  ctx.restore();
}

export function PresseVideo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recStartRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const [recording, setRecording] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const qr = buildQR();
    // Preload kaffebar-baggrunden (samme-origin, saa canvas ikke "taintes" og
    // optagelsen stadig virker).
    const bg = new Image();
    bg.src = SCAN_BG;
    let raf = 0;
    startRef.current = performance.now();
    // Vent paa fonts, saa canvas-teksten bruger Instrument Sans.
    document.fonts?.ready?.catch(() => {});
    const frame = (now: number) => {
      const base = recStartRef.current ?? startRef.current;
      const t = ((now - base) / 1000) % LOOP;
      draw(ctx, t, qr, bg.complete && bg.naturalWidth > 0 ? bg : null);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!("MediaRecorder" in window) || !canvas.captureStream) {
      setNote(
        "Din browser kan ikke optage. Prøv Chrome eller Safari, eller skærmoptag animationen.",
      );
      return;
    }
    const mimes = [
      "video/mp4;codecs=avc1.42E01E",
      "video/mp4",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];
    const mime =
      mimes.find((m) => {
        try {
          return MediaRecorder.isTypeSupported(m);
        } catch {
          return false;
        }
      }) || "";
    const ext = mime.includes("mp4") ? "mp4" : "webm";
    const stream = canvas.captureStream(30);
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(
        stream,
        mime ? { mimeType: mime, videoBitsPerSecond: 9_000_000 } : undefined,
      );
    } catch {
      setNote("Kunne ikke starte optagelse i denne browser.");
      return;
    }
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: mime || "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stemplet-stempelkort.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      recStartRef.current = null;
      setRecording(false);
      setNote(
        ext === "webm"
          ? "Hentet som .webm. LinkedIn foretrækker mp4, konvertér evt., eller skærmoptag animationen for mp4."
          : "Hentet som .mp4, klar til LinkedIn.",
      );
    };
    // Nulstil tidslinjen, saa videoen starter rent fra begyndelsen.
    recStartRef.current = performance.now();
    setRecording(true);
    setNote(null);
    rec.start();
    window.setTimeout(() => rec.state !== "inactive" && rec.stop(), LOOP * 1000 + 120);
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full max-w-[19rem] rounded-[2rem] shadow-hero"
      />
      <button
        type="button"
        onClick={download}
        disabled={recording}
        className={`${btnClass("primary", "md")} disabled:opacity-60`}
      >
        {recording ? "Optager... (ca. 9 sek.)" : "Download video"}
      </button>
      {note ? (
        <p className="max-w-xs text-center text-[0.8rem] font-[300] leading-relaxed text-stone">
          {note}
        </p>
      ) : null}
    </div>
  );
}
