"use client";

// Sidste-udvej, hvis selve rod-layoutet fejler. Kan ikke laene sig op ad app'ens
// CSS, saa den bruger inline styles i brandets toner.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="da">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          background: "#FAF8F4",
          color: "#1A1A1A",
          fontFamily: "Arial, Helvetica, sans-serif",
          textAlign: "center",
          padding: "0 1.5rem",
        }}
      >
        <h1 style={{ fontWeight: 300, fontSize: "1.6rem", margin: 0 }}>
          Noget gik galt
        </h1>
        <p
          style={{
            maxWidth: "20rem",
            fontWeight: 300,
            fontSize: "0.9rem",
            lineHeight: 1.6,
            color: "#4A4A4A",
            margin: 0,
          }}
        >
          Vi kunne ikke vise siden lige nu. Prøv igen.
        </p>
        <button
          onClick={reset}
          style={{
            background: "#1A1A1A",
            color: "#FAF8F4",
            border: "none",
            padding: "0.8rem 1.8rem",
            fontSize: "0.82rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Prøv igen
        </button>
      </body>
    </html>
  );
}
