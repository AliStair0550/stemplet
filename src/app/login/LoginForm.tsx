"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { requestMagicLink, type LoginState } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

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
        <span className="text-[0.7rem] font-[400] uppercase tracking-[0.12em] text-slate">
          E-mail
        </span>
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
          className="border border-clay bg-parchment px-4 py-3 font-[200] text-[0.95rem] text-ink outline-none focus:border-terracotta"
        />
      </label>
      {state.error ? (
        <p className="text-[0.8rem] font-[200] text-rust">
          {state.error}
          {state.notFound ? (
            <>
              {" "}
              <Link
                href="/start"
                className="font-[400] text-terracotta underline underline-offset-2 hover:text-terracotta-dark"
              >
                Opret din butik gratis
              </Link>
              .
            </>
          ) : null}
        </p>
      ) : null}
      <SubmitButton variant="primary" size="lg" pendingText="Sender link...">
        Send login-link
      </SubmitButton>
    </form>
  );
}
