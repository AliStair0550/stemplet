"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestMagicLink, type LoginState } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export function LoginForm() {
  const [state, action] = useActionState<LoginState, FormData>(
    requestMagicLink,
    {},
  );

  return (
    <form action={action} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.7rem] font-[400] uppercase tracking-[0.12em] text-slate">
          E-mail
        </span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
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
