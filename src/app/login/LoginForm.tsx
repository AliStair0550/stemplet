"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { requestMagicLink, type LoginState } from "./actions";
import { useFormStatus } from "react-dom";

function SubmitLabel() {
  const { pending } = useFormStatus();
  return <>{pending ? "Sender link" : "Send login-link"}</>;
}

// Vi husker selv den sidst brugte e-mail. Magic-link-login har ingen adgangskode,
// saa Safari/iOS gemmer den ikke automatisk som ved en password-formular. Ved at
// gemme i localStorage kommer e-mailen frem naeste gang, saa butikken slipper for
// at taste den hver gang.
const EMAIL_KEY = "stemplet:lastEmail";

export function LoginForm() {
  const [state, action] = useActionState<LoginState, FormData>(
    requestMagicLink,
    {},
  );
  const [email, setEmail] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(EMAIL_KEY);
      if (saved) setEmail(saved);
    } catch {
      // localStorage kan vaere blokeret (privat browsing) - så husker vi bare ikke.
    }
  }, []);

  return (
    <form action={action} className="flex w-full flex-col gap-4">
      <label htmlFor="login-email" className="flex flex-col gap-1.5">
        <span className="text-[14px] font-medium text-[#0B1628]/60">E-mail</span>
        <input
          id="login-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={email}
          onChange={(e) => {
            const v = e.target.value;
            setEmail(v);
            try {
              localStorage.setItem(EMAIL_KEY, v);
            } catch {
              // ignore
            }
          }}
          placeholder="din@mail.dk"
          className="min-h-[52px] rounded-[14px] bg-[#F2F5F9] px-4 text-[17px] text-[#0B1628] outline-none placeholder:text-[#0B1628]/35 focus:ring-2 focus:ring-[#1B5EAE]"
        />
      </label>
      {state.error ? (
        <p className="text-[15px] text-rust">
          {state.error}
          {state.notFound ? (
            <>
              {" "}
              <Link
                href="/start"
                className="font-medium text-[#0B1628] underline underline-offset-2"
              >
                Opret din butik gratis
              </Link>
              .
            </>
          ) : null}
        </p>
      ) : null}
      <button
        type="submit"
        className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[#061C3D] px-8 text-[17px] font-semibold text-white transition-[transform,background-color] hover:bg-[#0A2D5A] active:scale-[0.98] disabled:opacity-60"
      >
        <SubmitLabel />
      </button>
    </form>
  );
}
