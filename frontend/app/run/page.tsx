"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Tabs } from "@/components/Tabs";
import { AppState, Project, ReportingRegime, RunResult } from "@/lib/types";
import { loadState, saveState, uid, downloadJson } from "@/lib/storage";
import { estimateProject } from "@/lib/estimation";
import { buildExecutionPlan } from "@/lib/plan";

function Money(v: number) {
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
function Num(v: number, unit: string, digits = 1) {
  return `${v.toLocaleString(undefined, { maximumFractionDigits: digits })} ${unit}`;
}

function hash32(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function RunPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const [state, setState] = useState<AppState>(() => loadState());
  const projectId = (searchParams.projectId as string | undefined) ?? state.projects[0]?.id;
  const jobId = (searchParams.jobId as string | undefined) ?? null;

  const [compareMode, setCompareMode] = useState<"AUTO" | "GREENEST" | "CHEAPEST" | "FASTEST">("AUTO");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<RunResult | null>(null);

  const [tab, setTab] = useState<"EXEC" | "METH" | "BREAK" | "COMP" | "EXP">("EXEC");
  const [regime, setRegime] = useState<ReportingRegime>("BOTH");

  const timerRef = useRef<number | null>(null);

  useEffect(() => saveState(state), [state]);
  useEffect(() => document.documentElement.classList.toggle("dark", state.theme === "dark"), [state.theme]);

  const project: Project | undefined = useMemo(
    () => state.projects.find((p) => p.id === projectId) ?? state.projects[0],
    [state.projects, projectId]
  );

  useEffect(() => {
    if (project) setRegime(project.reportingRegime);
  }, [project?.id]);

  const estimates = useMemo(() => {
    if (!project) return null;
    return estimateProject(project, state.defaults.defaultProfile, state.defaults.defaultCompliance);
  }, [project, state.defaults.defaultProfile, state.defaults.defaultCompliance]);

  const plan = useMemo(() => {
    if (!project) return [];
    const jobs = jobId ? project.jobs.filter((j) => j.id === jobId) : project.jobs;
    const scoped: Project = { ...project, jobs };
    return buildExecutionPlan(scoped, state.defaults.defaultProfile, state.defaults.defaultCompliance, compareMode);
  }, [project, jobId, compareMode, state.defaults.defaultProfile, state.defaults.defaultCompliance]);

  function createProject() {
    const id = uid("proj");
    const p: Project = {
      id,
      name: "New Project",
      description: "",
      tags: [],
      reportingRegime: state.defaults.defaultReportingRegime,
      profile: state.defaults.defaultProfile,
      compliance: state.defaults.defaultCompliance,
      jobs: [],
    };
    const next: AppState = {
      ...state,
      projects: [p, ...state.projects],
      audit: [{ id: uid("aud"), tsISO: new Date().toISOString(), actor: "Robin (You)", action: "Created project", target: p.name }, ...state.audit],
    };
    setState(next);
    window.location.href = `/project?projectId=${encodeURIComponent(id)}`;
  }

  function startRun() {
    if (!project || !estimates) return;
    setRunning(true);
    setProgress(0);
    setLogs([]);
    setResult(null);
    setTab("EXEC");

    const seed = hash32(project.id + (jobId ?? "ALL") + compareMode);
    const rnd = mulberry32(seed);

    const fakeLogs = [
      "Initializing carbon-aware scheduler...",
      "Loading local compliance policy (whitelist/blacklist)...",
      "Computing worst-case guardrails (majorant buffers)...",
      "Selecting eligible regions/providers under constraints...",
      "Generating execution plan rationale tags...",
      "Queuing jobs...",
    ];

    const durationMs = 18000; // 18s MVP
    const tickMs = 450;
    const steps = Math.ceil(durationMs / tickMs);
    let i = 0;

    timerRef.current = window.setInterval(() => {
      i++;
      setProgress(Math.min(100, Math.round((i / steps) * 100)));

      if (i % 2 === 0) {
        const msg = fakeLogs[Math.min(fakeLogs.length - 1, Math.floor(i / 2) - 1)] ?? `Running... (${i}/${steps})`;
        setLogs((prev) => [...prev, `[${new Date().toISOString()}] ${msg}`]);
      } else {
        setLogs((prev) => [...prev, `[${new Date().toISOString()}] Job status tick: Queued → Running → Done (simulated).`]);
      }

      if (i >= steps) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = null;

        // Simulated actuals as fraction of maxima (stable pseudo-random)
        const scopedJobs = jobId ? project.jobs.filter((j) => j.id === jobId) : project.jobs;

        const jobsActuals = scopedJobs.map((j) => {
          const e = estimates.perJob[j.id];
          const frac = 0.55 + rnd() * 0.3; // 0.55..0.85
          const planItem = plan.find((x) => x.jobId === j.id);

          return {
            jobId: j.id,
            actualCostUsd: +(e.maxCostUsd * frac).toFixed(2),
            actualCO2Kg: +(e.maxCO2Kg * frac).toFixed(2),
            actualPowerKw: +(e.maxPowerKw * (0.85 + rnd() * 0.2)).toFixed(2),
            actualTimeHours: +(e.maxTimeHours * (0.7 + rnd() * 0.25)).toFixed(2),
            region: planItem?.region ?? "EU",
            provider: planItem?.provider ?? "OVHcloud",
            timeWindowLabel: planItem?.timeWindowLabel ?? "Immediate window",
            rationaleTags: planItem?.rationaleTags ?? [],
          };
        });

        const rr: RunResult = {
          id: uid("run"),
          projectId: project.id,
          tsISO: new Date().toISOString(),
          regime,
          jobs: jobsActuals,
          logs: [...fakeLogs.map((x) => `[${new Date().toISOString()}] ${x}`), `[${new Date().toISOString()}] Completed.`],
        };

        setResult(rr);
        setRunning(false);
        setTab("EXEC");
      }
    }, tickMs);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const totalsActual = useMemo(() => {
    if (!result) return null;
    const sum = result.jobs.reduce(
      (acc, j) => {
        acc.cost += j.actualCostUsd;
        acc.co2 += j.actualCO2Kg;
        acc.time += j.actualTimeHours;
        acc.peakPower = Math.max(acc.peakPower, j.actualPowerKw);
        return acc;
      },
      { cost: 0, co2: 0, time: 0, peakPower: 0 }
    );
    return sum;
  }, [result]);

  if (!project) {
    return (
      <div>
        <TopBar state={state} setState={setState} onCreateProject={createProject} titleRight="Run + Report" />
        <main className="mx-auto max-w-6xl px-4 py-8">No project found.</main>
      </div>
    );
  }

  const reportLabel =
    regime === "CANADA" ? "Canada — GHG reporting aligned format"
      : regime === "EU" ? "EU — CSRD/ESRS aligned format"
      : "Canada + EU — aligned formats";

  return (
    <div>
      <TopBar state={state} setState={setState} onCreateProject={createProject} titleRight="Run + Report" />

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm text-zinc-600 dark:text-zinc-300">Project</div>
            <div className="truncate text-xl font-semibold">{project.name}</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{reportLabel}</div>
            {jobId && <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Scope: single job run</div>}
          </div>

          <div className="flex flex-wrap gap-2">
            <a href={`/project?projectId=${encodeURIComponent(project.id)}`} className="rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700">
              Builder
            </a>
            <a href="/" className="rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700">
              Dashboard
            </a>

            <select
              value={regime}
              onChange={(e) => setRegime(e.target.value as ReportingRegime)}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              title="Report template selection (aligned format, not legal certification)"
            >
              <option value="CANADA">Canada</option>
              <option value="EU">EU</option>
              <option value="BOTH">Both</option>
            </select>

            <button
              onClick={startRun}
              disabled={running || !estimates || (jobId ? project.jobs.filter(j => j.id === jobId).length === 0 : false)}
              className="rounded-xl bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {running ? "Running..." : "Run"}
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">1) Execution Plan (pre-run)</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Selected region/provider/time window is based on objectives + compliance constraints (mocked).</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["AUTO","GREENEST","CHEAPEST","FASTEST"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setCompareMode(m)}
                  className={[
                    "rounded-xl px-3 py-2 text-sm border",
                    compareMode === m
                      ? "border-brand-blue bg-brand-blue/20"
                      : "border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900",
                  ].join(" ")}
                >
                  {m === "AUTO" ? "Auto" : m[0] + m.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {plan.map((it) => (
              <div key={it.jobId} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{it.jobName}</div>
                    <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                      Region: <span className="font-medium">{it.region}</span> • Provider: <span className="font-medium">{it.provider}</span>
                    </div>
                    <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Time window: {it.timeWindowLabel}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {it.rationaleTags.map((t) => (
                      <span key={t} className="rounded-full bg-brand-green/15 px-3 py-1 text-xs text-brand-green dark:text-green-300">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {plan.length === 0 && (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">No jobs in scope.</div>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-sm font-semibold">2) Running simulation</div>
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className="h-full bg-brand-blue" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{running ? "Simulating execution and logs..." : "Idle / completed."}</div>

            <div className="mt-3 max-h-64 overflow-auto rounded-2xl border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950">
              {logs.length === 0 ? (
                <div className="text-zinc-500 dark:text-zinc-400">Logs will appear here during run.</div>
              ) : (
                logs.map((l, idx) => <div key={idx} className="border-b border-zinc-100 py-1 last:border-b-0 dark:border-zinc-900">{l}</div>)
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-sm font-semibold">Worst-case guardrails</div>
            <div className="mt-2 grid gap-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-zinc-600 dark:text-zinc-300">Max Cost</span><span className="font-semibold">{estimates ? Money(estimates.totals.maxCostUsd) : "—"}</span></div>
              <div className="flex items-center justify-between"><span className="text-zinc-600 dark:text-zinc-300">Max CO₂</span><span className="font-semibold">{estimates ? Num(estimates.totals.maxCO2Kg, "kg", 1) : "—"}</span></div>
              <div className="flex items-center justify-between"><span className="text-zinc-600 dark:text-zinc-300">Max Power (peak)</span><span className="font-semibold">{estimates ? Num(estimates.totals.maxPowerKw, "kW", 1) : "—"}</span></div>
              <div className="flex items-center justify-between"><span className="text-zinc-600 dark:text-zinc-300">Max Time</span><span className="font-semibold">{estimates ? Num(estimates.totals.maxTimeHours, "h", 1) : "—"}</span></div>
            </div>

            <details className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              <summary className="cursor-pointer">Assumptions</summary>
              <ul className="mt-2 list-disc pl-5">
                {(estimates?.totals.assumptions ?? []).map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </details>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">3) Report Viewer (post-run)</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Aligned format labels; not a legal certification.</div>
            </div>

            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { key: "EXEC", label: "Executive Summary" },
                { key: "METH", label: "Methodology" },
                { key: "BREAK", label: "Breakdown" },
                { key: "COMP", label: "Compliance" },
                { key: "EXP", label: "Exports" },
              ]}
            />
          </div>

          {!result && (
            <div className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              Run the project to generate a report.
            </div>
          )}

          {result && (
            <div className="mt-4">
              {tab === "EXEC" && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                    <div className="text-sm font-semibold">Totals — Max vs Actual</div>
                    <div className="mt-3 grid gap-2 text-sm">
                      <Row label="Cost" max={estimates ? Money(estimates.totals.maxCostUsd) : "—"} act={totalsActual ? Money(totalsActual.cost) : "—"} />
                      <Row label="CO₂" max={estimates ? Num(estimates.totals.maxCO2Kg, "kgCO₂e", 1) : "—"} act={totalsActual ? Num(totalsActual.co2, "kgCO₂e", 1) : "—"} />
                      <Row label="Power (peak)" max={estimates ? Num(estimates.totals.maxPowerKw, "kW", 1) : "—"} act={totalsActual ? Num(totalsActual.peakPower, "kW", 1) : "—"} />
                      <Row label="Time" max={estimates ? Num(estimates.totals.maxTimeHours, "h", 1) : "—"} act={totalsActual ? Num(totalsActual.time, "h", 1) : "—"} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                    <div className="text-sm font-semibold">Summary notes</div>
                    <ul className="mt-3 list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-300">
                      <li>Worst-case totals are conservative guardrails (majorant buffers).</li>
                      <li>Actuals are simulated within a stable fraction of maxima for demo purposes.</li>
                      <li>Report regime: <span className="font-medium">{reportLabel}</span>.</li>
                    </ul>
                  </div>
                </div>
              )}

              {tab === "METH" && (
                <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="text-sm font-semibold">Methodology</div>
                  <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                    This MVP uses deterministic, conservative (majorant) estimates and a mocked execution planner.
                    Assumptions include worst-provider pricing, highest plausible grid intensity within allowed regions, and fixed safety buffers.
                  </div>
                  <div className="mt-3 text-sm font-semibold">Accounting notes (demo)</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-300">
                    <li>Energy = power (kW) × runtime (h).</li>
                    <li>CO₂ = energy (kWh) × grid intensity (g/kWh) ÷ 1000, plus buffer.</li>
                    <li>Costs use mocked hourly rates and worst-provider multipliers.</li>
                  </ul>
                </div>
              )}

              {tab === "BREAK" && (
                <div className="grid gap-3">
                  {result.jobs.map((j) => {
                    const e = estimates?.perJob[j.jobId];
                    const jobName = project.jobs.find(x => x.id === j.jobId)?.name ?? j.jobId;
                    return (
                      <div key={j.jobId} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold">{jobName}</div>
                            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                              Region: {j.region} • Provider: {j.provider} • Window: {j.timeWindowLabel}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {j.rationaleTags.map((t) => (
                              <span key={t} className="rounded-full bg-brand-blue/20 px-3 py-1 text-xs">{t}</span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                          <div className="rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
                            <div className="text-xs text-zinc-600 dark:text-zinc-300">Max (worst-case)</div>
                            <div className="mt-1 text-sm">
                              Cost: <b>{e ? Money(e.maxCostUsd) : "—"}</b> • CO₂: <b>{e ? Num(e.maxCO2Kg, "kg", 1) : "—"}</b>
                              <br />
                              Power: <b>{e ? Num(e.maxPowerKw, "kW", 1) : "—"}</b> • Time: <b>{e ? Num(e.maxTimeHours, "h", 1) : "—"}</b>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
                            <div className="text-xs text-zinc-600 dark:text-zinc-300">Actual (simulated)</div>
                            <div className="mt-1 text-sm">
                              Cost: <b>{Money(j.actualCostUsd)}</b> • CO₂: <b>{Num(j.actualCO2Kg, "kg", 1)}</b>
                              <br />
                              Power: <b>{Num(j.actualPowerKw, "kW", 1)}</b> • Time: <b>{Num(j.actualTimeHours, "h", 1)}</b>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {tab === "COMP" && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                    <div className="text-sm font-semibold">Policy summary</div>
                    <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                      {project.compliance.type} • Regions: {project.compliance.regions.join(", ")}
                      <br />
                      Data residency: {project.compliance.enforceDataResidency ? "On" : "Off"} • No cross-border transfer: {project.compliance.noCrossBorderTransfer ? "On" : "Off"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                    <div className="text-sm font-semibold">Audit excerpt (local)</div>
                    <div className="mt-2 max-h-48 overflow-auto rounded-2xl border border-zinc-200 p-3 text-xs dark:border-zinc-800">
                      {state.audit.slice(0, 8).map((a) => (
                        <div key={a.id} className="border-b border-zinc-100 py-2 last:border-b-0 dark:border-zinc-900">
                          <div className="text-zinc-600 dark:text-zinc-300">{a.tsISO}</div>
                          <div className="font-medium">{a.actor}: {a.action}</div>
                          <div className="text-zinc-500 dark:text-zinc-400">{a.target}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tab === "EXP" && (
                <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="text-sm font-semibold">Exports</div>
                  <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                    PDF export is a mock action (print-to-PDF). JSON export is a real download.
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => window.print()}
                      className="rounded-xl border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
                    >
                      Export PDF (mock)
                    </button>
                    <button
                      onClick={() => downloadJson(`report-${project.id}-${result.id}.json`, { project, estimates, runResult: result, regime })}
                      className="rounded-xl bg-brand-green px-4 py-2 text-sm font-semibold text-white"
                    >
                      Export JSON (real)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Row(props: { label: string; max: string; act: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-800">
      <div className="text-zinc-600 dark:text-zinc-300">{props.label}</div>
      <div className="text-right">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">Max</div>
        <div className="font-semibold">{props.max}</div>
      </div>
      <div className="text-right">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">Actual</div>
        <div className="font-semibold">{props.act}</div>
      </div>
    </div>
  );
}
