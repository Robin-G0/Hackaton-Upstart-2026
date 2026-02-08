import { Suspense } from "react";
import JobsClient from "./JobsClient";

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-6 text-sm text-zinc-700">
            Loading…
          </div>
        </main>
      }
    >
      <JobsClient />
    </Suspense>
  );
}
