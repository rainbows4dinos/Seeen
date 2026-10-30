import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in · Seeen",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-4 py-16">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Seeen</h1>
        <p className="text-muted">Your people. Your scenes.</p>
      </header>

      <section aria-labelledby="signin-heading" className="flex flex-col gap-4">
        <h2 id="signin-heading" className="text-lg font-semibold">
          Sign in
        </h2>
        <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
          <LoginForm />
        </Suspense>
        <p className="text-sm text-muted">
          Seeen is invite-only. Ask a bandmate to add you if you don&rsquo;t have an account.
        </p>
      </section>
    </main>
  );
}
