'use client';

import { useEffect, useMemo, useState } from "react";

type HelloResponse = {
  message: string;
  apiPrefix?: string;
  nextPublicApiUrl?: string | null;
};

export default function Page() {
  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
    []
  );

  const [data, setData] = useState<HelloResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = `${apiBase}/api/hello`;
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as HelloResponse;
      })
      .then(setData)
      .catch((e) => setError(String(e)));
  }, [apiBase]);

  return (
    <main style={{ maxWidth: 900 }}>
      <h1>Hackathon Starter</h1>
      <p>Frontend: Next.js | Backend: FastAPI | DB: Postgres</p>

      <section style={{ marginTop: 24, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
        <h2>Backend check</h2>
        <p><strong>NEXT_PUBLIC_API_URL</strong>: {apiBase}</p>
        {error && <p style={{ color: "crimson" }}>Error: {error}</p>}
        {!error && !data && <p>Loading...</p>}
        {data && (
          <pre style={{ background: "#f7f7f7", padding: 12, borderRadius: 8, overflowX: "auto" }}>
{JSON.stringify(data, null, 2)}
          </pre>
        )}
      </section>
    </main>
  );
}
