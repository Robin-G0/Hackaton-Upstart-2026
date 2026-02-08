import { AppState, Project } from "./types";

const nowISO = () => new Date().toISOString();

const sampleProject: Project = {
  id: "proj_seed_001",
  name: "LLM Fine-Tuning — Customer Support Bot",
  description: "Carbon-aware orchestration mockup: worst-case estimates, compliance constraints, and audit-style reporting.",
  tags: ["LLM", "GPU", "Customer Support", "Compliance"],
  reportingRegime: "BOTH",
  profile: {
    mode: "FULL",
    weights: { co2: 50, cost: 30, time: 20, power: 0 },
    hard: { maxBudgetUsd: 2500 },
    scheduling: { batchableShiftable: true },
    provider: { allowedProviders: ["AWS", "GCP", "Azure", "OVHcloud"], allowedInstanceFamilies: ["General", "Compute", "GPU"] },
    dataHandling: { enforceDataResidency: true, noCrossBorderTransfer: true },
  },
  compliance: {
    type: "WHITELIST",
    regions: ["EU", "CA"],
    allowJobOverride: true,
    enforceDataResidency: true,
    noCrossBorderTransfer: true,
  },
  jobs: [
    {
      id: "job_001",
      name: "Data preprocessing",
      type: "BATCH",
      priority: "LOW",
      batchableShiftable: true,
      compute: { gpuRequired: false, gpuClass: "NONE", expectedRuntimeHours: 3.5 },
      inheritProjectSettings: true,
      inheritCompliance: true,
      status: "IDLE",
      notes: "Batchable; prefer low-carbon window.",
    },
    {
      id: "job_002",
      name: "Training run",
      type: "TRAINING",
      priority: "CRITICAL",
      deadlineISO: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString().slice(0, 10),
      batchableShiftable: false,
      compute: { gpuRequired: true, gpuClass: "A100", expectedRuntimeHours: 11.0 },
      inheritProjectSettings: true,
      inheritCompliance: true,
      status: "IDLE",
      notes: "GPU required; deadline constrained.",
    },
    {
      id: "job_003",
      name: "Evaluation + benchmarks",
      type: "BATCH",
      priority: "MEDIUM",
      batchableShiftable: true,
      compute: { gpuRequired: true, gpuClass: "L4", expectedRuntimeHours: 2.8 },
      inheritProjectSettings: true,
      inheritCompliance: true,
      status: "IDLE",
      notes: "Batchable; can shift to greener window.",
    },
    {
      id: "job_004",
      name: "Packaging + artifact export",
      type: "CI",
      priority: "LOW",
      batchableShiftable: true,
      compute: { gpuRequired: false, gpuClass: "NONE", expectedRuntimeHours: 1.2 },
      inheritProjectSettings: true,
      inheritCompliance: true,
      status: "IDLE",
      notes: "CI-style job; low compute.",
    },
  ],
  seedEstimates: {
    perJob: {
      job_001: { maxCostUsd: 180, maxCO2Kg: 8.6, maxPowerKw: 1.2, maxTimeHours: 5.0, confidence: "MED", assumptions: ["Mock rates & grid factors", "Includes conservative buffer"] },
      job_002: { maxCostUsd: 2200, maxCO2Kg: 210, maxPowerKw: 5.5, maxTimeHours: 16.0, confidence: "HIGH", assumptions: ["GPU price worst-case", "Highest plausible grid intensity within allowed regions + buffer"] },
      job_003: { maxCostUsd: 320, maxCO2Kg: 22, maxPowerKw: 3.2, maxTimeHours: 4.2, confidence: "MED", assumptions: ["Batch window could shift; max assumes unfavorable window"] },
      job_004: { maxCostUsd: 75, maxCO2Kg: 2.1, maxPowerKw: 0.9, maxTimeHours: 2.0, confidence: "HIGH", assumptions: ["Short CI workload", "Conservative time buffer"] },
    },
    projectTotals: { maxCostUsd: 2775, maxCO2Kg: 242.7, maxPowerKw: 5.5, maxTimeHours: 27.2, confidence: "MED", assumptions: ["Project totals = sum of job maxima", "Not probabilistic; deliberately conservative"] },
  },
};

export function makeSeedState(): AppState {
  return {
    version: 1,
    theme: "light",
    workspace: {
      id: "ws_local_001",
      name: "Hackathon Workspace",
      membersMock: [
        { name: "Robin (You)", role: "Owner", presence: "editing" },
        { name: "Alex", role: "Editor", presence: "viewing" },
        { name: "Sam", role: "Viewer", presence: "offline" },
      ],
    },
    defaults: {
      defaultReportingRegime: "BOTH",
      defaultProfile: {
        mode: "LITE",
        preset: "BALANCED",
      },
      defaultCompliance: {
        type: "WHITELIST",
        regions: ["EU", "CA"],
        allowJobOverride: true,
        enforceDataResidency: true,
        noCrossBorderTransfer: true,
      },
      allowJobOverrideByDefault: true,
    },
    projects: [sampleProject],
    audit: [
      { id: "aud_001", tsISO: nowISO(), actor: "System", action: "Seed data initialized", target: sampleProject.name },
    ],
  };
}
