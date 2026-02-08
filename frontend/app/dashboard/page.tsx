"use client";

import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/TopBar";
import type { AppState, Project } from "@/lib/types";
import { loadState, saveState, uid } from "@/lib/storage";
import { makeSeedState } from "@/lib/seed";
import { loadUiMode, type UIMode } from "@/lib/uiMode";

function cls(...x: Array<string | false | null | undefined>) {
  return x.filter(Boolean).join(" ");
}

export default function DashboardPage() {
  // Deterministic initial render (server + client) => avoids hydration mismatch
  const [state, setState] = useState<AppState>(() => makeSeedState());
  const [hydrated, setHydrated] = useState(false);

  // Lite/Full affects dashboard rendering
  const [uiMode, setUiMode] = useState<UIMode>("LITE");

  useEffect(() => {
    // After mount: load real localStorage state and UI mode
    const s = loadState();
    setState(s);
    setUiMode(loadUiMode());
    setHydrated(true);

    document.documentElement.classList.toggle("dark", s.theme === "dark");
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState(state);
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("dark", state.theme === "dark");
  }, [state.theme, hydrated]);

  const projects = state.projects;

  const stats = useMemo(() => {
    const jobCount = projects.reduce((acc, p) => acc + p.jobs.length, 0);
    return { projectCount: projects.length, jobCount };
  }, [projects]);

  function createProject() {
    const p: Project = {
      id: uid("proj"),
      name: "New Project",
      description: "",
      tags: [],
      reportingRegime: state.defaults.defaultReportingRegime,
      profile: state.defaults.defaultProfile,
      compliance: state.defaults.defaultCompliance,
      jobs: [],
    };

    setState({
      ...state,
      projects: [p, ...state.projects],
      audit: [
        { id: uid("aud"), tsISO: new Date().toISOString(), actor: "Robin (You)", action: "Created project", target: p.name },
        ...state.audit,
      ],
    });
  }

  return (
    <div>
      <TopBar
        state={state}
        setState={setState}
        onCreateProject={createProject}
        titleRight="Dashboard"
        onUiModeChange={setUiMode}
      />

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-emerald-50 to-white p-6 dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-950">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm text-zinc-600 dark:text-zinc-300">Workspace</div>
              <div className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-white">{state.workspace.name}</div>
              <div className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-300">
                Manage projects locally. Details (compliance, settings, jobs, reports) will live in the Project page.
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Overview</div>
              <div className="mt-1 text-sm font-semibold">{stats.projectCount} project(s)</div>
              <div className="text-sm text-zinc-600 dark:text-zinc-300">{stats.jobCount} job(s)</div>
              <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                UI mode: <span className="font-medium">{uiMode}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-zinc-900 dark:text-white">Projects</div>
              <div className="text-sm text-zinc-600 dark:text-zinc-300">
                {uiMode === "LITE"
                  ? "Lite view: minimal project list."
                  : "Full view: includes a bit more context (still not the full details)."}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <div
                key={p.id}
                className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold text-zinc-900 dark:text-white">{p.name}</div>
                    {uiMode === "FULL" && (
                      <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                        {p.description?.trim() ? p.description : "No description"}
                      </div>
                    )}
                  </div>

                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200">
                    {p.reportingRegime}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-zinc-200 px-3 py-1 text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                    {p.jobs.length} job(s)
                  </span>

                  {uiMode === "FULL" && (
                    <>
                      <span className="rounded-full border border-zinc-200 px-3 py-1 text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                        Compliance: {p.compliance.type}
                      </span>
                      <span className="rounded-full border border-zinc-200 px-3 py-1 text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                        Regions: {p.compliance.regions.join(", ")}
                      </span>
                    </>
                  )}
                </div>

                {uiMode === "FULL" && p.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {p.tags.slice(0, 6).map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  {/* These routes will be created in the next steps. Keeping buttons for UX continuity. */}
                  <a
                    href={`/project?projectId=${encodeURIComponent(p.id)}`}
                    className={cls(
                      "rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-sm",
                      "bg-gradient-to-r from-emerald-700 to-green-800 hover:opacity-95"
                    )}
                  >
                    Open
                  </a>
                  <a
                    href={`/run?projectId=${encodeURIComponent(p.id)}`}
                    className={cls(
                      "rounded-2xl px-4 py-2 text-sm font-semibold",
                      "border border-emerald-700 text-emerald-800 hover:bg-emerald-50",
                      "dark:border-emerald-500 dark:text-emerald-200 dark:hover:bg-emerald-900/20"
                    )}
                  >
                    Run
                  </a>

                  {uiMode === "FULL" && (
                    <div className="ml-auto text-[11px] text-zinc-400 dark:text-zinc-500">
                      ID: {p.id}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {projects.length === 0 && (
              <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 sm:col-span-2">
                No projects yet. Use “Create Project”.
              </div>
            )}
          </div>
        </div>

        {uiMode === "FULL" && (
          <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-sm font-semibold text-zinc-900 dark:text-white">Recent activity</div>
            <div className="mt-2 max-h-48 overflow-auto rounded-2xl border border-zinc-200 p-3 text-xs dark:border-zinc-800">
              {state.audit.slice(0, 10).map((a) => (
                <div key={a.id} className="border-b border-zinc-100 py-2 last:border-b-0 dark:border-zinc-900">
                  <div className="text-zinc-600 dark:text-zinc-300">{a.tsISO}</div>
                  <div className="font-medium">{a.actor}: {a.action}</div>
                  <div className="text-zinc-500 dark:text-zinc-400">{a.target}</div>
                </div>
              ))}
              {state.audit.length === 0 && <div className="text-zinc-500 dark:text-zinc-400">No audit entries yet.</div>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
