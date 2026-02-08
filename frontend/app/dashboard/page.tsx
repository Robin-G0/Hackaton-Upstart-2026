"use client";

import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { AppState, Project } from "@/lib/types";
import { loadState, saveState, uid, downloadJson } from "@/lib/storage";
import { estimateProject } from "@/lib/estimation";

function Money(v: number) {
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
function Num(v: number, unit: string, digits = 1) {
  return `${v.toLocaleString(undefined, { maximumFractionDigits: digits })} ${unit}`;
}

export default function DashboardPage() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => state.projects[0]?.id ?? "");

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", state.theme === "dark");
  }, [state.theme]);

  const selectedProject: Project | undefined = useMemo(
    () => state.projects.find((p) => p.id === selectedProjectId) ?? state.projects[0],
    [state.projects, selectedProjectId]
  );

  const totals = useMemo(() => {
    if (!selectedProject) return null;
    return estimateProject(selectedProject, state.defaults.defaultProfile, state.defaults.defaultCompliance).totals;
  }, [selectedProject, state.defaults.defaultProfile, state.defaults.defaultCompliance]);

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
    setSelectedProjectId(id);
    window.location.href = `/project?projectId=${encodeURIComponent(id)}`;
  }

  return (
    <div>
      <TopBar state={state} setState={setState} onCreateProject={createProject} titleRight="Dashboard" />

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm text-zinc-600 dark:text-zinc-300">Selected project</div>
                <div className="truncate text-xl font-semibold">{selectedProject?.name ?? "—"}</div>
                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Worst-case estimates: maximum cost / emissions / power / time with conservative buffers.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                >
                  {state.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <a
                  href={selectedProject ? `/project?projectId=${encodeURIComponent(selectedProject.id)}` : "#"}
                  className="rounded-xl bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                >
                  Open
                </a>

                <a
                  href={selectedProject ? `/run?projectId=${encodeURIComponent(selectedProject.id)}` : "#"}
                  className="rounded-xl border border-brand-green px-4 py-2 text-sm font-semibold text-brand-green hover:bg-brand-green/10"
                >
                  Run
                </a>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="text-sm text-zinc-600 dark:text-zinc-300">Presence (mock)</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {state.workspace.membersMock.map((m) => (
                    <span
                      key={m.name}
                      className={[
                        "rounded-full border px-3 py-1 text-xs",
                        m.presence === "editing"
                          ? "border-brand-blue bg-brand-blue/20"
                          : m.presence === "viewing"
                            ? "border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
                            : "border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400",
                      ].join(" ")}
                    >
                      {m.name} • {m.role} • {m.presence}
                    </span>
                  ))}
                </div>
                <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                  Collaboration is represented via UI only (local-only storage).
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="text-sm text-zinc-600 dark:text-zinc-300">Compliance positioning</div>
                <div className="mt-2 text-sm">
                  Data residency and region policy applied by design (Canada/EU), with optional per-job overrides.
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-brand-green/15 px-3 py-1 text-brand-green dark:text-green-300">Worst-case totals</span>
                  <span className="rounded-full bg-brand-blue/20 px-3 py-1">Canada / EU aligned report formats</span>
                  <span className="rounded-full border border-zinc-300 px-3 py-1 dark:border-zinc-700">Local-only MVP</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-sm text-zinc-600 dark:text-zinc-300">KPI (project totals)</div>
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Hover assumptions in builder/run pages for details.</div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="text-xs text-zinc-600 dark:text-zinc-300">Max Cost</div>
                <div className="mt-1 text-xl font-semibold">{totals ? Money(totals.maxCostUsd) : "—"}</div>
              </div>
              <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="text-xs text-zinc-600 dark:text-zinc-300">Max CO₂</div>
                <div className="mt-1 text-xl font-semibold">{totals ? Num(totals.maxCO2Kg, "kgCO₂e", 1) : "—"}</div>
              </div>
              <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="text-xs text-zinc-600 dark:text-zinc-300">Max Power</div>
                <div className="mt-1 text-xl font-semibold">{totals ? Num(totals.maxPowerKw, "kW", 1) : "—"}</div>
              </div>
              <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="text-xs text-zinc-600 dark:text-zinc-300">Max Time</div>
                <div className="mt-1 text-xl font-semibold">{totals ? Num(totals.maxTimeHours, "h", 1) : "—"}</div>
              </div>
            </div>

            {selectedProject && (
              <button
                onClick={() => downloadJson(`project-${selectedProject.id}.json`, selectedProject)}
                className="mt-4 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                Export Selected Project (JSON)
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold">Projects</div>
              <div className="text-sm text-zinc-600 dark:text-zinc-300">Open, run simulation, or export locally.</div>
            </div>
            <a
              href="/project"
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Go to Builder
            </a>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="text-left text-zinc-600 dark:text-zinc-300">
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="py-2">Project</th>
                  <th className="py-2">Regime</th>
                  <th className="py-2">Jobs</th>
                  <th className="py-2">Compliance</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.projects.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-900">
                    <td className="py-3">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{p.description}</div>
                    </td>
                    <td className="py-3">{p.reportingRegime}</td>
                    <td className="py-3">{p.jobs.length}</td>
                    <td className="py-3">
                      {p.compliance.type} • {p.compliance.regions.join(", ")}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <a href={`/project?projectId=${encodeURIComponent(p.id)}`} className="rounded-lg bg-brand-green px-3 py-1.5 text-xs font-semibold text-white">
                          Open
                        </a>
                        <a href={`/run?projectId=${encodeURIComponent(p.id)}`} className="rounded-lg border border-brand-green px-3 py-1.5 text-xs font-semibold text-brand-green">
                          Run
                        </a>
                        <button
                          onClick={() => downloadJson(`project-${p.id}.json`, p)}
                          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700"
                        >
                          Export
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {state.projects.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                      No projects yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
