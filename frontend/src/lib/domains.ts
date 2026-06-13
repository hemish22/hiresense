// Industry/project domains — colors + labels shared across views.

export const FIELD_COLORS: Record<string, string> = {
  web3_blockchain: "#c084fc",
  ai_ml: "#22d3ee",
  computer_vision: "#60a5fa",
  hardware_iot: "#fb923c",
  sustainability: "#34d399",
  web_development: "#f472b6",
  data_science: "#fbbf24",
  healthcare: "#f87171",
  social_impact: "#d6b370",
};

export const FIELD_LABELS: Record<string, string> = {
  web3_blockchain: "Web3 & Blockchain",
  ai_ml: "AI & Machine Learning",
  computer_vision: "Computer Vision",
  hardware_iot: "Hardware & IoT",
  sustainability: "Sustainability",
  web_development: "Web Development",
  data_science: "Data Science",
  healthcare: "Healthcare",
  social_impact: "Social Impact",
};

export const fieldColor = (f: string) => FIELD_COLORS[f] || "#94a3b8";
export const fieldLabel = (f: string) =>
  FIELD_LABELS[f] || (f || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// Hiring pipeline stages
export const STAGES = [
  "applied",
  "shortlisted",
  "interview",
  "offer",
  "hired",
  "rejected",
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  applied: "Applied",
  shortlisted: "Shortlisted",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

export const STAGE_COLORS: Record<Stage, string> = {
  applied: "#94a3b8",
  shortlisted: "#60a5fa",
  interview: "#a78bfa",
  offer: "#fbbf24",
  hired: "#34d399",
  rejected: "#f87171",
};

export const scoreColor = (v: number) =>
  v >= 75 ? "#34d399" : v >= 50 ? "#fbbf24" : "#f87171";
