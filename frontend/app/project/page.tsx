"use client";

import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Modal } from "@/components/Modal";
import { AppState, CompliancePolicy, Job, JobPriority, JobType, OptimizationProfile, Project, ReportingRegime } from "@/lib/types";
import { loadState, saveState, uid } from "@/lib/storage";
import { estimateProject } from "@/lib/estimation";

function Money(v: number) {
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
function Num(v: number, unit: string, digits = 1) {
  return `${v.toLocaleString(undefined, { maximumFractionDigits: digits })} ${unit}`;
}

function parseTags(s: string) {
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

export default function ProjectBuilderPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const [state, setState] = useState<AppState>(() => loadState());
  const projectId = (searchParams.projectId as string | undefined) ?? state.projects[0]?.id;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  useEffect(() => saveState(state), [state]);
  useEffect(() => document.documentElement.classList.toggle("dark", state.theme === "dark"), [state.theme]);

  const projectIndex = state.projects.findIndex((p) => p.id === projectId);
  const project = projectIndex >= 0 ? state.projects[projectIndex] : state.projects[0];

  const estimates = useMemo(() => {
    if (!project) return null;
    return estimateProject(project, state.defaults.defaultProfile, state.defaults.defaultCompliance);
  }, [project, state.defaults.defaultProfile, state.defaults.defaultCompliance]);

  function patchProject(patch: Partial<Project>) {
    if (!project) return;
    const nextProjects = state.projects.slice();
    nextProjects[projectIndex] = { ...project, ...patch };
    setState({ ...state, projects: nextProjects });
  }

  function updateCompliance(patch: Partial<CompliancePolicy>) {
    if (!project) return;
    patchProject({ compliance: { ...project.compliance, ...patch } });
  }

  function setProjectProfile(profile: OptimizationProfile) {
    patchProject({ profile });
  }

  function saveAsDefaults() {
    if (!project) return;
    setState({
      ...state,
      defaults: {
        ...state.defaults,
        defaultReportingRegime: project.reportingRegime,
        defaultProfile: project.profile,
        defaultCompliance: project.compliance,
      },
      audit: [{ id: uid("aud"), tsISO: new Date().toISOString(), actor: "Robin (You)", action: "Saved project settings as global defaults", target: project.name }, ...state.audit],
    });
    alert("Saved as global defaults (local-only).");
  }

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
    setState({
      ...state,
      projects: [p, ...state.projects],
      audit: [{ id: uid("aud"), tsISO: new Date().toISOString(), actor: "Robin (You)", action: "Created project", target: p.name }, ...state.audit],
    });
    window.location.href = `/project?projectId=${encodeURIComponent(id)}`;
  }

  const jobBeingEdited: Job | null = useMemo(() => {
    if (!project || !editingJobId) return null;
    return project.jobs.find((j) => j.id === editingJobId) ?? null;
  }, [project, editingJobId]);

  function upsertJob(job: Job) {
    if (!project) return;
    const idx = project.jobs.findIndex((j) => j.id === job.id);
    const nextJobs = idx >= 0 ? project.jobs.map((j) => (j.id === job.id ? job : j)) : [job, ...project.jobs];
    patchProject({ jobs: nextJobs });
  }

  function deleteJob(jobId: string) {
    if (!project) return;
    patchProject({ jobs: project.jobs.filter((j) => j.id !== jobId) });
  }

  if (!project) {
    return (
      <div>
        <TopBar state={state} setState={setState} onCreateProject={createProject} titleRight="Project Builder" />
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            No project found.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <TopBar state={state} setState={setState} onCreateProject={createProject} titleRight="Project Builder" />

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm text-zinc-600 dark:text-zinc-300">A) Project info</div>
                <div className="mt-1 text-xl font-semibold">{project.name}</div>
                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Create/edit project settings, compliance policy, and jobs with worst-case estimates.</div>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href="/" className="rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700">Dashboard</a>
                <a href={`/run?projectId=${encodeURIComponent(project.id)}`} className="rounded-xl border border-brand-green px-3 py-2 text-sm font-semibold text-brand-green">
                  Run
                </a>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-zinc-600 dark:text-zinc-300">Name</label>
                <input
                  value={project.name}
                  onChange={(e) => patchProject({ name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-600 dark:text-zinc-300">Reporting regime</label>
                <select
                  value={project.reportingRegime}
                  onChange={(e) => patchProject({ reportingRegime: e.target.value as ReportingRegime })}
                  className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <option value="CANADA">Canada</option>
                  <option value="EU">EU</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-zinc-600 dark:text-zinc-300">Description</label>
                <textarea
                  value={project.description ?? ""}
                  onChange={(e) => patchProject({ description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  rows={2}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-zinc-600 dark:text-zinc-300">Tags (comma-separated)</label>
                <input
                  value={project.tags.join(", ")}
                  onChange={(e) => patchProject({ tags: parseTags(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="text-sm font-semibold">B) Project settings</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs text-zinc-600 dark:text-zinc-300">Mode</span>
                <select
                  value={project.profile.mode}
                  onChange={(e) => {
                    const mode = e.target.value as "LITE" | "FULL";
                    if (mode === "LITE") setProjectProfile({ mode: "LITE", preset: "BALANCED" });
                    else setProjectProfile({ mode: "FULL", weights: { co2: 40, cost: 30, time: 30, power: 0 } });
                  }}
                  className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <option value="LITE">Lite</option>
                  <option value="FULL">Full</option>
                </select>

                <button
                  onClick={saveAsDefaults}
                  className="rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  Save as my default profile
                </button>
              </div>

              {project.profile.mode === "LITE" ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-zinc-600 dark:text-zinc-300">Preset</label>
                    <select
                      value={project.profile.preset}
                      onChange={(e) => setProjectProfile({ mode: "LITE", preset: e.target.value as any })}
                      className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                    >
                      <option value="GREENEST">Greenest</option>
                      <option value="CHEAPEST">Cheapest</option>
                      <option value="FASTEST">Fastest</option>
                      <option value="BALANCED">Balanced</option>
                    </select>
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Lite mode = quick UX. Worst-case estimates remain conservative regardless of preset.
                  </div>
                </div>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {(["co2", "cost", "time", "power"] as const).map((k) => (
                    <div key={k}>
                      <label className="text-xs text-zinc-600 dark:text-zinc-300">{k.toUpperCase()} weight (0–100)</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={project.profile.weights[k]}
                        onChange={(e) => setProjectProfile({ ...project.profile, weights: { ...project.profile.weights, [k]: Number(e.target.value) } })}
                        className="mt-1 w-full"
                      />
                      <div className="text-xs text-zinc-600 dark:text-zinc-300">{project.profile.weights[k]}</div>
                    </div>
                  ))}
                  <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs text-zinc-600 dark:text-zinc-300">Max budget (USD, optional)</label>
                      <input
                        type="number"
                        value={project.profile.hard?.maxBudgetUsd ?? ""}
                        onChange={(e) => setProjectProfile({ ...project.profile, hard: { ...project.profile.hard, maxBudgetUsd: e.target.value ? Number(e.target.value) : undefined } })}
                        className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-600 dark:text-zinc-300">Max CO₂ (kgCO₂e, optional)</label>
                      <input
                        type="number"
                        value={project.profile.hard?.maxCO2Kg ?? ""}
                        onChange={(e) => setProjectProfile({ ...project.profile, hard: { ...project.profile.hard, maxCO2Kg: e.target.value ? Number(e.target.value) : undefined } })}
                        className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="text-sm font-semibold">C) Compliance policy</div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-zinc-600 dark:text-zinc-300">Policy type</label>
                  <select
                    value={project.compliance.type}
                    onChange={(e) => updateCompliance({ type: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  >
                    <option value="WHITELIST">Whitelist</option>
                    <option value="BLACKLIST">Blacklist</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-600 dark:text-zinc-300">Regions/Countries (comma-separated; supports EU shortcut)</label>
                  <input
                    value={project.compliance.regions.join(", ")}
                    onChange={(e) => updateCompliance({ regions: parseTags(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={project.compliance.allowJobOverride}
                    onChange={(e) => updateCompliance({ allowJobOverride: e.target.checked })}
                  />
                  Allow job override
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={project.compliance.enforceDataResidency}
                    onChange={(e) => updateCompliance({ enforceDataResidency: e.target.checked })}
                  />
                  Enforce data residency
                </label>

                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={project.compliance.noCrossBorderTransfer}
                    onChange={(e) => updateCompliance({ noCrossBorderTransfer: e.target.checked })}
                  />
                  No cross-border transfer
                </label>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">D) Jobs</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Always showing worst-case (max) estimates.</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setEditingJobId(null);
                      setModalOpen(true);
                    }}
                    className="rounded-xl bg-brand-green px-3 py-2 text-sm font-semibold text-white"
                  >
                    Add Job
                  </button>
                </div>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead className="text-left text-zinc-600 dark:text-zinc-300">
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="py-2">Name</th>
                      <th className="py-2">Type</th>
                      <th className="py-2">Priority</th>
                      <th className="py-2">Deadline</th>
                      <th className="py-2">Compliance</th>
                      <th className="py-2">Max Cost</th>
                      <th className="py-2">Max CO₂</th>
                      <th className="py-2">Max Time</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.jobs.map((j) => {
                      const e = estimates?.perJob[j.id];
                      const compLabel = j.inheritCompliance ? "Inherit" : "Override";
                      return (
                        <tr key={j.id} className="border-b border-zinc-100 dark:border-zinc-900">
                          <td className="py-3">
                            <div className="font-medium">{j.name}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">{j.compute.gpuRequired ? `GPU ${j.compute.gpuClass}` : "CPU"} • {j.batchableShiftable ? "Batchable" : "Not batchable"}</div>
                          </td>
                          <td className="py-3">{j.type}</td>
                          <td className="py-3">{j.priority}</td>
                          <td className="py-3">{j.deadlineISO ?? "—"}</td>
                          <td className="py-3">{compLabel}</td>
                          <td className="py-3">{e ? Money(e.maxCostUsd) : "—"}</td>
                          <td className="py-3">{e ? Num(e.maxCO2Kg, "kg", 1) : "—"}</td>
                          <td className="py-3">{e ? Num(e.maxTimeHours, "h", 1) : "—"}</td>
                          <td className="py-3">{j.status}</td>
                          <td className="py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => { setEditingJobId(j.id); setModalOpen(true); }}
                                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  const copy: Job = { ...j, id: uid("job"), name: `${j.name} (copy)`, status: "IDLE" };
                                  upsertJob(copy);
                                }}
                                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700"
                              >
                                Duplicate
                              </button>
                              <button
                                onClick={() => deleteJob(j.id)}
                                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700"
                              >
                                Delete
                              </button>
                              <a
                                href={`/run?projectId=${encodeURIComponent(project.id)}&jobId=${encodeURIComponent(j.id)}`}
                                className="rounded-lg border border-brand-green px-3 py-1.5 text-xs font-semibold text-brand-green"
                              >
                                Run Job
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {project.jobs.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                          No jobs yet. Add one to see worst-case estimates.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {estimates && (
                <div className="mt-4 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="text-sm font-semibold">Project totals (sum of job maxima)</div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
                      <div className="text-xs text-zinc-600 dark:text-zinc-300">Max Cost</div>
                      <div className="mt-1 font-semibold">{Money(estimates.totals.maxCostUsd)}</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
                      <div className="text-xs text-zinc-600 dark:text-zinc-300">Max CO₂</div>
                      <div className="mt-1 font-semibold">{Num(estimates.totals.maxCO2Kg, "kgCO₂e", 1)}</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
                      <div className="text-xs text-zinc-600 dark:text-zinc-300">Max Power (peak)</div>
                      <div className="mt-1 font-semibold">{Num(estimates.totals.maxPowerKw, "kW", 1)}</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
                      <div className="text-xs text-zinc-600 dark:text-zinc-300">Max Time</div>
                      <div className="mt-1 font-semibold">{Num(estimates.totals.maxTimeHours, "h", 1)}</div>
                    </div>
                  </div>
                  <details className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <summary className="cursor-pointer">Assumptions (majorant policy)</summary>
                    <ul className="mt-2 list-disc pl-5">
                      {estimates.totals.assumptions.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </details>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-sm text-zinc-600 dark:text-zinc-300">Quick actions</div>

            <div className="mt-3 grid gap-2">
              <a
                href={`/run?projectId=${encodeURIComponent(project.id)}`}
                className="rounded-xl bg-brand-green px-4 py-2 text-sm font-semibold text-white text-center"
              >
                Run Project
              </a>
              <a
                href="/"
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm text-center dark:border-zinc-700"
              >
                Back to Dashboard
              </a>
            </div>

            <div className="mt-6">
              <div className="text-sm font-semibold">Audit log (local)</div>
              <div className="mt-2 max-h-64 overflow-auto rounded-2xl border border-zinc-200 p-3 text-xs dark:border-zinc-800">
                {state.audit.slice(0, 12).map((a) => (
                  <div key={a.id} className="border-b border-zinc-100 py-2 last:border-b-0 dark:border-zinc-900">
                    <div className="text-zinc-600 dark:text-zinc-300">{a.tsISO}</div>
                    <div className="font-medium">{a.actor}: {a.action}</div>
                    <div className="text-zinc-500 dark:text-zinc-400">{a.target}</div>
                  </div>
                ))}
                {state.audit.length === 0 && <div className="text-zinc-500 dark:text-zinc-400">No audit entries yet.</div>}
              </div>
            </div>

            <div className="mt-6">
              <div className="text-sm font-semibold">Project selection</div>
              <select
                value={project.id}
                onChange={(e) => window.location.href = `/project?projectId=${encodeURIComponent(e.target.value)}`}
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                {state.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </main>

      <Modal
        open={modalOpen}
        title={editingJobId ? "Edit Job" : "Add Job"}
        onClose={() => { setModalOpen(false); setEditingJobId(null); }}
      >
        <JobEditor
          project={project}
          defaults={state.defaults}
          job={jobBeingEdited}
          onSave={(job) => {
            upsertJob(job);
            setState({
              ...state,
              audit: [{ id: uid("aud"), tsISO: new Date().toISOString(), actor: "Robin (You)", action: editingJobId ? "Updated job" : "Created job", target: `${project.name} • ${job.name}` }, ...state.audit],
            });
            setModalOpen(false);
            setEditingJobId(null);
          }}
        />
      </Modal>
    </div>
  );
}

function JobEditor(props: {
  project: Project;
  defaults: AppState["defaults"];
  job: Job | null;
  onSave: (job: Job) => void;
}) {
  const isEdit = !!props.job;
  const [j, setJ] = useState<Job>(() => {
    if (props.job) return props.job;
    return {
      id: uid("job"),
      name: "New Job",
      type: "BATCH",
      priority: "MEDIUM",
      batchableShiftable: true,
      compute: { gpuRequired: false, gpuClass: "NONE", expectedRuntimeHours: 1.0 },
      inheritProjectSettings: true,
      inheritCompliance: true,
      status: "IDLE",
    };
  });

  useEffect(() => {
    if (props.job) setJ(props.job);
  }, [props.job]);

  const overrideAllowed = props.project.compliance.allowJobOverride;

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-zinc-600 dark:text-zinc-300">Name</label>
          <input
            value={j.name}
            onChange={(e) => setJ({ ...j, name: e.target.value })}
            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-600 dark:text-zinc-300">Type</label>
          <select
            value={j.type}
            onChange={(e) => setJ({ ...j, type: e.target.value as JobType })}
            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            {(["TRAINING","BATCH","CI","ETL","INFERENCE","CUSTOM"] as JobType[]).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-600 dark:text-zinc-300">Priority</label>
          <select
            value={j.priority}
            onChange={(e) => setJ({ ...j, priority: e.target.value as JobPriority })}
            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            {(["LOW","MEDIUM","HIGH","CRITICAL"] as JobPriority[]).map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-600 dark:text-zinc-300">Deadline (optional)</label>
          <input
            value={j.deadlineISO ?? ""}
            onChange={(e) => setJ({ ...j, deadlineISO: e.target.value || undefined })}
            placeholder="YYYY-MM-DD"
            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={j.batchableShiftable}
            onChange={(e) => setJ({ ...j, batchableShiftable: e.target.checked })}
          />
          Batchable / shiftable
        </label>

        <div className="grid gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={j.compute.gpuRequired}
              onChange={(e) => setJ({ ...j, compute: { ...j.compute, gpuRequired: e.target.checked, gpuClass: e.target.checked ? "L4" : "NONE" } })}
            />
            GPU required
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-zinc-600 dark:text-zinc-300">GPU class (mock)</label>
              <select
                value={j.compute.gpuClass}
                onChange={(e) => setJ({ ...j, compute: { ...j.compute, gpuClass: e.target.value as any } })}
                disabled={!j.compute.gpuRequired}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950"
              >
                {(["T4","L4","A10","A100","H100"] as const).map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-600 dark:text-zinc-300">Expected runtime (hours)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={j.compute.expectedRuntimeHours}
                onChange={(e) => setJ({ ...j, compute: { ...j.compute, expectedRuntimeHours: Number(e.target.value) } })}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
        <div className="text-sm font-semibold">Settings</div>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={j.inheritProjectSettings}
            onChange={(e) => setJ({ ...j, inheritProjectSettings: e.target.checked, overrideProfile: e.target.checked ? undefined : props.defaults.defaultProfile })}
          />
          Inherit project settings
        </label>
        {!j.inheritProjectSettings && (
          <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
            Override profile is simplified in MVP (uses global default profile as baseline).
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
        <div className="text-sm font-semibold">Compliance</div>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={j.inheritCompliance}
            onChange={(e) => setJ({ ...j, inheritCompliance: e.target.checked, overrideCompliance: e.target.checked ? undefined : props.project.compliance })}
            disabled={!overrideAllowed}
          />
          Inherit compliance policy
        </label>
        {!overrideAllowed && (
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Job override is disabled by project policy.
          </div>
        )}

        {!j.inheritCompliance && overrideAllowed && (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div>
              <label className="text-xs text-zinc-600 dark:text-zinc-300">Policy type</label>
              <select
                value={j.overrideCompliance?.type ?? "WHITELIST"}
                onChange={(e) => setJ({ ...j, overrideCompliance: { ...(j.overrideCompliance ?? props.project.compliance), type: e.target.value as any } })}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="WHITELIST">Whitelist</option>
                <option value="BLACKLIST">Blacklist</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-600 dark:text-zinc-300">Regions (comma-separated)</label>
              <input
                value={(j.overrideCompliance?.regions ?? []).join(", ")}
                onChange={(e) => setJ({ ...j, overrideCompliance: { ...(j.overrideCompliance ?? props.project.compliance), regions: e.target.value.split(",").map(x => x.trim()).filter(Boolean) } })}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => props.onSave(j)}
        className="mt-2 rounded-xl bg-brand-green px-4 py-2 text-sm font-semibold text-white"
      >
        {isEdit ? "Save Job" : "Create Job"}
      </button>
    </div>
  );
}
