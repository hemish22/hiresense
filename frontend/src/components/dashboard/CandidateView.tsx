"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { analyzeCandidate, getCandidateSummary } from "@/lib/api";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MinusCircle,
  XCircle,
  Code2,
  Star,
  GitFork,
  Users,
  Flame,
  Trophy,
  Mail,
  Phone,
  ExternalLink,
  Activity,
  Sparkles,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const chartConfig = {
  score: {
    label: "Score",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

// ---------- inline brand icons (removed from this lucide version) ----------

function Github({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.92 1.23 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
    </svg>
  );
}

function Linkedin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

// ---------- helpers ----------

// Transform category_scores object into recharts data array
function buildRadarData(categoryScores: Record<string, number> | undefined) {
  if (!categoryScores || Object.keys(categoryScores).length === 0) return [];

  const labelMap: Record<string, string> = {
    frontend: "Frontend",
    backend: "Backend",
    databases: "Databases",
    devops: "DevOps",
    cloud: "Cloud",
    ml_ai: "ML / AI",
    mobile: "Mobile",
    security: "Security",
    languages: "Languages",
    tools: "Tools",
  };

  return Object.entries(categoryScores).map(([key, value]) => ({
    category: labelMap[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    score: Math.round(value),
    fullMark: 100,
  }));
}

// Top N languages by byte share, with percentage
function topLanguages(languages: Record<string, number> | undefined, n = 6) {
  if (!languages || Object.keys(languages).length === 0) return [];
  const total = Object.values(languages).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, bytes]) => ({ name, pct: Math.round((bytes / total) * 100) }));
}

function daysAgo(iso?: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

function scoreColor(v: number) {
  return v >= 75 ? "bg-green-500" : v >= 50 ? "bg-amber-500" : "bg-red-500";
}

// Derive quick positive / concern signals from the whole result
function buildSignals(result: any): { positives: string[]; concerns: string[] } {
  const positives: string[] = [];
  const concerns: string[] = [];

  const match = result?.scoring?.scores?.match_score ?? result?.match_score;
  if (typeof match === "number") {
    if (match >= 75) positives.push("Strong JD fit");
    else if (match < 50) concerns.push("Weak JD fit");
  }

  const missing =
    result?.scoring?.skill_match?.missing_skills || result?.skill_gaps || result?.missing_skills;
  if (Array.isArray(missing) && missing.length >= 4) concerns.push(`${missing.length} critical skill gaps`);

  const gh = result?.github_analysis;
  if (gh && !gh.user_not_found && !gh.error) {
    const s = gh.scores || {};
    const d = gh.details || {};
    if (s.recency >= 80) positives.push("Actively coding on GitHub");
    else if (s.recency < 30) concerns.push("Stale GitHub activity");
    if (s.consistency >= 75) positives.push("Consistent committer");
    if (s.project_depth >= 70) positives.push("High-impact projects");
    if (s.tech_breadth >= 75) positives.push("Versatile tech stack");
    if ((d.total_stars ?? 0) >= 100) positives.push(`${d.total_stars}+ GitHub stars`);
  }

  const lc = result?.leetcode_analysis;
  if (lc && !lc.user_not_found && !lc.error) {
    const s = lc.scores || {};
    const p = lc.problems || {};
    if (s.problem_solving >= 70) positives.push("Strong DSA / problem solving");
    if ((p.hard ?? 0) >= 20) positives.push(`${p.hard} hard problems solved`);
    if (s.difficulty_balance < 40 && (p.total_solved ?? 0) > 0)
      concerns.push("LeetCode skewed to easy problems");
  }

  return { positives, concerns };
}

// Plain-text report for clipboard / ATS / email
function buildReportText(result: any, fileName?: string): string {
  const c = result?.candidate || {};
  const match = result?.scoring?.scores?.match_score ?? result?.match_score ?? "—";
  const rec = result?.scoring?.recommendation || result?.recommendation || "—";
  const lines: string[] = [];
  lines.push(`HireSense AI — Candidate Report`);
  if (c.name) lines.push(`Name: ${c.name}`);
  if (c.email) lines.push(`Email: ${c.email}`);
  lines.push(`Match Score: ${match}/100  |  Recommendation: ${rec}`);

  const gh = result?.github_analysis;
  if (gh && !gh.user_not_found && !gh.error) {
    const d = gh.details || {};
    const s = gh.scores || {};
    lines.push("");
    lines.push(`GitHub (@${gh.username}): ${d.total_repos ?? 0} repos, ${d.total_stars ?? 0} stars`);
    lines.push(
      `  Consistency ${s.consistency} | Depth ${s.project_depth} | Breadth ${s.tech_breadth} | Recency ${s.recency} | Overall ${s.overall}`
    );
  }

  const lc = result?.leetcode_analysis;
  if (lc && !lc.user_not_found && !lc.error) {
    const p = lc.problems || {};
    lines.push("");
    lines.push(
      `LeetCode (@${lc.username}): ${p.total_solved} solved (${p.easy}E / ${p.medium}M / ${p.hard}H)`
    );
  }
  return lines.join("\n");
}

// ---------- small presentational components ----------

function ScoreBar({ label, value, hint }: { label: string; value: number; hint?: string }) {
  const v = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{Math.round(v)}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${scoreColor(v)} transition-all`} style={{ width: `${v}%` }} />
      </div>
      {hint && <p className="text-xs text-muted-foreground leading-snug">{hint}</p>}
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border bg-muted/20 px-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="leading-tight min-w-0">
        <div className="text-sm font-semibold tabular-nums truncate">{value}</div>
        <div className="text-[11px] text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

// ---------- main component ----------

export function CandidateView({ initialResult }: { initialResult?: any } = {}) {
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(initialResult ?? null);
  const [copied, setCopied] = useState(false);
  const [aiSummary, setAiSummary] = useState<{ summary: string; engine: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const generateVerdict = async () => {
    if (!result?.id) return;
    setAiLoading(true);
    try {
      setAiSummary(await getCandidateSummary(result.id));
    } catch {
      setAiSummary({ summary: "Could not generate verdict.", engine: "error" });
    } finally {
      setAiLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Please upload a resume (PDF)");
      return;
    }
    if (!jd.trim()) {
      setError("Please provide a job description");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("job_description", jd);

      const response = await analyzeCandidate(formData);
      setResult(response);
    } catch (err: any) {
      setError(err.message || "Failed to analyze candidate");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(buildReportText(result, file?.name));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const radarData = buildRadarData(result?.scoring?.skill_match?.category_scores);

  // Engine detection (groq / gemini / local fallback)
  const engine: string =
    result?.scoring?.skill_match?.details?.engine || result?.details?.engine || "local";
  const engineLabel = engine.includes("groq")
    ? "GROQ"
    : engine.includes("gemini")
    ? "GEMINI"
    : "LOCAL";
  const engineActive = engine.includes("groq") || engine.includes("gemini");

  const candidate = result?.candidate || {};
  const gh = result?.github_analysis;
  const lc = result?.leetcode_analysis;
  const ghValid = gh && !gh.user_not_found && !gh.error;
  const lcValid = lc && !lc.user_not_found && !lc.error;
  const signals = result ? buildSignals(result) : { positives: [], concerns: [] };

  return (
    <div className="space-y-8">
      {!result ? (
        <Card>
          <CardHeader>
            <CardTitle>Submit Candidate</CardTitle>
            <CardDescription>
              Upload a resume and paste the job description. Our semantic AI will deep map their capabilities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  file ? "bg-primary/5 border-primary/30" : "bg-muted/10 border-muted-foreground/20 hover:bg-muted/20"
                }`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById("resume-upload")?.click()}
              >
                <div className="flex flex-col items-center justify-center space-y-3 relative">
                  <div className="p-3 bg-background rounded-full shadow-sm border">
                    {file ? (
                      <FileText className="h-6 w-6 text-primary" />
                    ) : (
                      <UploadCloud className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  {file ? (
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium">Click or drag PDF resume here</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF max 5MB</p>
                    </div>
                  )}
                  <Input
                    id="resume-upload"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jd">Job Description</Label>
                <Textarea
                  id="jd"
                  placeholder="Paste the full job description requirements here..."
                  className="min-h-[150px] resize-y"
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing Neural Signals...
                  </>
                ) : (
                  "Evaluate Candidate"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* ---------- Candidate identity header ---------- */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                {candidate.name || "Analysis Complete"}
              </h2>
              <p className="text-muted-foreground text-sm">{file?.name}</p>

              {/* Contact links */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {candidate.email && (
                  <a
                    href={`mailto:${candidate.email}`}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary border rounded-full px-2.5 py-1 transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" /> {candidate.email}
                  </a>
                )}
                {candidate.phone && (
                  <a
                    href={`tel:${candidate.phone}`}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary border rounded-full px-2.5 py-1 transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" /> {candidate.phone}
                  </a>
                )}
                {candidate.linkedin_url && (
                  <a
                    href={candidate.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary border rounded-full px-2.5 py-1 transition-colors"
                  >
                    <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                  </a>
                )}
                {candidate.github_username && (
                  <a
                    href={`https://github.com/${candidate.github_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary border rounded-full px-2.5 py-1 transition-colors"
                  >
                    <Github className="h-3.5 w-3.5" /> {candidate.github_username}
                  </a>
                )}
                {candidate.leetcode_username && (
                  <a
                    href={`https://leetcode.com/${candidate.leetcode_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary border rounded-full px-2.5 py-1 transition-colors"
                  >
                    <Code2 className="h-3.5 w-3.5" /> {candidate.leetcode_username}
                  </a>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Engine badge (dynamic) */}
              <div
                title={engineActive ? `${engineLabel} semantic engine active` : "API key missing: local DB fallback"}
                className="flex items-center gap-1.5 text-sm text-muted-foreground border rounded-full px-3 py-1 bg-muted/20 shadow-sm cursor-help"
              >
                <span className="font-semibold text-xs tracking-wide">{engineLabel}</span>
                {engineActive ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-amber-500" />
                )}
              </div>

              {/* GitHub badge — only if a username was present */}
              {gh && (
                <div
                  title={ghValid ? "GitHub data found" : gh.user_not_found ? "GitHub profile not found" : "GitHub scrape error"}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground border rounded-full px-3 py-1 bg-muted/20 shadow-sm cursor-help"
                >
                  <span className="font-semibold text-xs tracking-wide">GITHUB</span>
                  {ghValid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : gh.user_not_found ? (
                    <MinusCircle className="h-4 w-4 text-amber-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
              )}

              {/* LeetCode badge — only if a username was present */}
              {lc && (
                <div
                  title={lcValid ? "LeetCode data found" : lc.user_not_found ? "LeetCode profile not found" : "LeetCode scrape error"}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground border rounded-full px-3 py-1 bg-muted/20 shadow-sm cursor-help"
                >
                  <span className="font-semibold text-xs tracking-wide">LEETCODE</span>
                  {lcValid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : lc.user_not_found ? (
                    <MinusCircle className="h-4 w-4 text-amber-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
              )}

              <Button variant="outline" size="sm" onClick={handleCopyReport}>
                {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                {copied ? "Copied" : "Copy Report"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setResult(null);
                  setFile(null);
                  setJd("");
                }}
              >
                Analyze Another
              </Button>
            </div>
          </div>

          {/* ---------- Signal Highlights ---------- */}
          {(signals.positives.length > 0 || signals.concerns.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {signals.positives.map((s, i) => (
                <Badge
                  key={`p-${i}`}
                  variant="outline"
                  className="bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400 gap-1.5 py-1"
                >
                  <Sparkles className="h-3.5 w-3.5" /> {s}
                </Badge>
              ))}
              {signals.concerns.map((s, i) => (
                <Badge
                  key={`c-${i}`}
                  variant="outline"
                  className="bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400 gap-1.5 py-1"
                >
                  <AlertTriangle className="h-3.5 w-3.5" /> {s}
                </Badge>
              ))}
            </div>
          )}

          {/* ---------- AI Hire Verdict ---------- */}
          {result?.id && (
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Sparkles className="h-4 w-4 text-primary" /> AI Hire Verdict
                    {aiSummary?.engine && aiSummary.engine !== "error" && (
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground border rounded px-1.5 py-0.5">
                        {aiSummary.engine}
                      </span>
                    )}
                  </div>
                  <Button size="sm" onClick={generateVerdict} disabled={aiLoading}>
                    {aiLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-1.5" />
                    )}
                    {aiSummary ? "Regenerate" : "Generate"}
                  </Button>
                </div>
                {aiSummary && (
                  <p className="text-sm text-foreground/90 mt-3 leading-relaxed">{aiSummary.summary}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* ---------- Score + Executive Summary + Radar ---------- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Match Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-extrabold tracking-tighter flex items-baseline gap-1">
                  {result.scoring?.scores?.match_score ?? result.match_score}{" "}
                  <span className="text-2xl text-muted-foreground">/100</span>
                </div>
                <Progress value={result.scoring?.scores?.match_score ?? result.match_score} className="h-2 mt-4" />
                <div className="mt-4 inline-flex">
                  <Badge
                    variant={
                      result.scoring?.recommendation === "Strong Hire" ||
                      result.scoring?.recommendation === "Hire" ||
                      result.recommendation === "HIRE"
                        ? "default"
                        : result.scoring?.recommendation === "Pass" || result.recommendation === "NO HIRE"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-sm px-3 py-1"
                  >
                    {result.scoring?.recommendation || result.recommendation || "Needs Review"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className={radarData.length > 0 ? "" : "lg:col-span-2"}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed">
                  {(() => {
                    const text =
                      result.scoring?.explanation ||
                      result.rationale ||
                      result.explanation ||
                      "No rationale provided by the engine.";
                    return typeof text === "string" ? text.replace(/\s*\(\d+\/100\)/g, "") : text;
                  })()}
                </p>
              </CardContent>
            </Card>

            {radarData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Skill Radar</CardTitle>
                  <CardDescription className="text-xs">Technical depth across key domains</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center pb-0">
                  <ChartContainer config={chartConfig} className="mx-auto aspect-square w-full max-h-[260px]">
                    <RadarChart data={radarData}>
                      <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                      <PolarAngleAxis
                        dataKey="category"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      />
                      <PolarGrid gridType="polygon" stroke="rgba(0,0,0,0.15)" strokeWidth={1} />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tickCount={6}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                        axisLine={false}
                      />
                      <Radar
                        dataKey="score"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.4}
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 4, fillOpacity: 1, fill: "hsl(var(--primary))" }}
                      />
                    </RadarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ---------- GitHub + LeetCode insight cards ---------- */}
          {(ghValid || lcValid) && (
            <div className={`grid grid-cols-1 ${ghValid && lcValid ? "lg:grid-cols-2" : ""} gap-6`}>
              {/* GitHub */}
              {ghValid && (
                <Card>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      {gh.profile?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={gh.profile.avatar_url}
                          alt={gh.username}
                          className="h-12 w-12 rounded-full border shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full border bg-muted flex items-center justify-center shrink-0">
                          <Github className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Github className="h-4 w-4" /> GitHub Activity
                        </CardTitle>
                        <a
                          href={`https://github.com/${gh.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {gh.profile?.name || gh.username}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {gh.profile?.bio && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{gh.profile.bio}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-3xl font-extrabold tracking-tight tabular-nums">
                          {Math.round(gh.scores?.overall ?? 0)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">overall</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Quick stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <StatPill icon={FileText} label="public repos" value={gh.details?.total_repos ?? gh.profile?.public_repos ?? 0} />
                      <StatPill icon={Star} label="total stars" value={gh.details?.total_stars ?? 0} />
                      <StatPill icon={Code2} label="languages" value={Object.keys(gh.details?.languages || {}).length} />
                      <StatPill icon={Users} label="followers" value={gh.profile?.followers ?? 0} />
                      <StatPill icon={Activity} label="active days" value={gh.details?.active_days ?? 0} />
                      {(() => {
                        const d = daysAgo(gh.details?.top_repos?.[0]?.updated_at);
                        return <StatPill icon={Flame} label="last active" value={d == null ? "—" : `${d}d ago`} />;
                      })()}
                    </div>

                    <Separator />

                    {/* Quality scores */}
                    <div className="space-y-3">
                      <ScoreBar label="Consistency" value={gh.scores?.consistency ?? 0} hint={gh.explanations?.consistency} />
                      <ScoreBar label="Project Depth" value={gh.scores?.project_depth ?? 0} hint={gh.explanations?.project_depth} />
                      <ScoreBar label="Tech Breadth" value={gh.scores?.tech_breadth ?? 0} hint={gh.explanations?.tech_breadth} />
                      <ScoreBar label="Recency" value={gh.scores?.recency ?? 0} hint={gh.explanations?.recency} />
                    </div>

                    {/* Languages */}
                    {topLanguages(gh.details?.languages).length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Top Languages</h4>
                          <div className="space-y-1.5">
                            {topLanguages(gh.details?.languages).map((l) => (
                              <div key={l.name} className="flex items-center gap-2">
                                <span className="text-xs w-24 shrink-0 truncate">{l.name}</span>
                                <div className="h-2 rounded-full bg-muted flex-1 overflow-hidden">
                                  <div className="h-full rounded-full bg-primary" style={{ width: `${l.pct}%` }} />
                                </div>
                                <span className="text-xs text-muted-foreground tabular-nums w-9 text-right">
                                  {l.pct}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Top repos */}
                    {Array.isArray(gh.details?.top_repos) && gh.details.top_repos.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Top Repositories</h4>
                          <div className="space-y-2">
                            {gh.details.top_repos.slice(0, 5).map((r: any) => (
                              <a
                                key={r.name}
                                href={`https://github.com/${gh.username}/${r.name}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between gap-2 text-sm rounded-lg border px-3 py-2 hover:bg-muted/30 transition-colors"
                              >
                                <span className="font-medium truncate">{r.name}</span>
                                <span className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                                  {r.language && <span>{r.language}</span>}
                                  <span className="inline-flex items-center gap-1">
                                    <Star className="h-3 w-3" /> {r.stars}
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <GitFork className="h-3 w-3" /> {r.forks}
                                  </span>
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* LeetCode */}
              {lcValid && (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Code2 className="h-4 w-4" /> LeetCode Problem Solving
                        </CardTitle>
                        <a
                          href={`https://leetcode.com/${lc.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {lc.username}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {lc.profile?.ranking ? (
                          <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                            <Trophy className="h-3.5 w-3.5" /> Global rank #{lc.profile.ranking.toLocaleString()}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-3xl font-extrabold tracking-tight tabular-nums">
                          {Math.round(lc.scores?.overall ?? 0)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">overall</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Total + difficulty breakdown */}
                    <div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-4xl font-extrabold tabular-nums">
                          {lc.problems?.total_solved ?? 0}
                        </span>
                        <span className="text-sm text-muted-foreground">problems solved</span>
                      </div>

                      {/* Segmented E/M/H bar */}
                      {(() => {
                        const p = lc.problems || {};
                        const total = Math.max(p.total_solved ?? 0, 1);
                        const seg = (n: number) => `${((n / total) * 100).toFixed(1)}%`;
                        return (
                          <>
                            <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                              <div className="bg-green-500" style={{ width: seg(p.easy ?? 0) }} />
                              <div className="bg-amber-500" style={{ width: seg(p.medium ?? 0) }} />
                              <div className="bg-red-500" style={{ width: seg(p.hard ?? 0) }} />
                            </div>
                            <div className="flex justify-between mt-2 text-xs">
                              <span className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-green-500" /> Easy {p.easy ?? 0}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-amber-500" /> Medium {p.medium ?? 0}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-red-500" /> Hard {p.hard ?? 0}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <Separator />

                    {/* Scores */}
                    <div className="space-y-3">
                      <ScoreBar label="Problem Solving" value={lc.scores?.problem_solving ?? 0} hint={lc.explanations?.problem_solving} />
                      <ScoreBar label="Difficulty Balance" value={lc.scores?.difficulty_balance ?? 0} hint={lc.explanations?.difficulty_balance} />
                    </div>

                    <Separator />

                    {/* Streak / active days */}
                    <div className="grid grid-cols-2 gap-2">
                      <StatPill icon={Flame} label="day streak" value={lc.details?.streak ?? 0} />
                      <StatPill icon={Activity} label="active days" value={lc.details?.total_active_days ?? 0} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ---------- Skill geography ---------- */}
          <Card>
            <CardHeader>
              <CardTitle>Skill Geography</CardTitle>
              <CardDescription>Capabilities matched and gaps identified against the JD</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Matched Skills */}
                {(result.scoring?.skill_match?.matched_skills || result.matched_skills) &&
                  (result.scoring?.skill_match?.matched_skills || result.matched_skills).length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" /> Matched Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(result.scoring?.skill_match?.matched_skills || result.matched_skills).map(
                          (skill: string, i: number) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400 hover:bg-green-500/20"
                            >
                              {skill}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Missing Skills */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" /> Critical Missing Skills
                  </h4>
                  {(result.scoring?.skill_match?.missing_skills || result.skill_gaps || result.missing_skills) &&
                  (result.scoring?.skill_match?.missing_skills || result.skill_gaps || result.missing_skills).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {(result.scoring?.skill_match?.missing_skills || result.skill_gaps || result.missing_skills).map(
                        (gap: string, i: number) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
                          >
                            {gap}
                          </Badge>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No significant skill gaps detected.</p>
                  )}
                </div>

                {/* Bonus Skills */}
                {(result.scoring?.skill_match?.bonus_skills || result.bonus_skills) &&
                  (result.scoring?.skill_match?.bonus_skills || result.bonus_skills).length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-blue-500" /> Bonus Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(result.scoring?.skill_match?.bonus_skills || result.bonus_skills).map(
                          (skill: string, i: number) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400"
                            >
                              {skill}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {(result.scoring?.learning_analysis?.explanation || result.learning_ability) && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Projected Learning Velocity</h4>
                    <p className="text-sm text-foreground">
                      {result.scoring?.learning_analysis?.explanation || result.learning_ability}
                    </p>
                  </div>
                )}

                {/* Semantic Matches (AI reasoning) */}
                {(result.scoring?.skill_match?.details?.semantic_matches || result.details?.semantic_matches) &&
                  (result.scoring?.skill_match?.details?.semantic_matches || result.details?.semantic_matches).length > 0 &&
                  engineActive && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3">AI Semantic Reasoning</h4>
                      <div className="space-y-2">
                        {(result.scoring?.skill_match?.details?.semantic_matches || result.details?.semantic_matches)
                          .slice(0, 6)
                          .map((match: any, i: number) => (
                            <div key={i} className="flex items-start gap-3 text-sm border rounded-lg p-3 bg-muted/30">
                              <Badge variant="secondary" className="shrink-0 mt-0.5 text-xs">
                                {match.match_type}
                              </Badge>
                              <div className="min-w-0">
                                <span className="font-medium">{match.jd_requirement}</span>
                                <span className="text-muted-foreground mx-1">↔</span>
                                <span className="font-medium text-primary">{match.candidate_skill}</span>
                                {match.reasoning && (
                                  <p className="text-xs text-muted-foreground mt-1">{match.reasoning}</p>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
