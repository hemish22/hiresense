"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { analyzeTeamBulk, simulateTeam } from "@/lib/api";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Users,
  Loader2,
  AlertCircle,
  Briefcase,
  FileText,
  CheckCircle2,
  UploadCloud,
  X,
  File as FileIcon,
  Copy,
  ShieldAlert,
  TrendingUp,
  GraduationCap,
  GitCompare,
  Plus,
  UserPlus,
  Sparkles,
} from "lucide-react";

// ─────────────────────────── helpers ───────────────────────────

type Member = { name: string; skills: string[] };

function urgencyStyle(urgency: string) {
  switch (urgency?.toLowerCase()) {
    case "critical":
      return "text-red-600 bg-red-500/10 border-red-500/30 dark:text-red-400";
    case "high":
      return "text-orange-600 bg-orange-500/10 border-orange-500/30 dark:text-orange-400";
    case "medium":
      return "text-amber-600 bg-amber-500/10 border-amber-500/30 dark:text-amber-400";
    default:
      return "text-green-600 bg-green-500/10 border-green-500/30 dark:text-green-400";
  }
}

function coverageColor(score: number) {
  if (score >= 75) return "text-green-500";
  if (score >= 45) return "text-amber-500";
  return "text-red-500";
}

function riskStyle(level: string) {
  switch (level) {
    case "high":
      return "text-red-600 bg-red-500/10 border-red-500/30 dark:text-red-400";
    case "medium":
      return "text-amber-600 bg-amber-500/10 border-amber-500/30 dark:text-amber-400";
    default:
      return "text-green-600 bg-green-500/10 border-green-500/30 dark:text-green-400";
  }
}

// Reconstruct the full required-skill list from a result.
function requirementsFromResult(result: any): string[] {
  const set = new Set<string>();
  (result?.covered_skills || []).forEach((s: string) => set.add(s));
  (result?.gap_clusters || []).forEach((c: any) =>
    (c.skills || []).forEach((s: string) => set.add(s))
  );
  return Array.from(set);
}

// ─────────────────────────── component ───────────────────────────

export function TeamView() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [projectDescription, setProjectDescription] = useState(
    "Building a scalable fintech application for real-time payments that requires high security and low latency."
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  // What-if editor state
  const [editor, setEditor] = useState<{ member: Member; active: boolean }[]>([]);
  const [sim, setSim] = useState<any | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSkills, setNewSkills] = useState("");

  // Compare tray (session-local, survives "New Analysis")
  const [compareList, setCompareList] = useState<any[]>([]);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter((f) =>
        f.name.toLowerCase().endsWith(".pdf")
      );
      setFiles((prev) => [...prev, ...newFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files).filter((f) =>
        f.name.toLowerCase().endsWith(".pdf")
      );
      setFiles((prev) => [...prev, ...newFiles]);
    }
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError("Please upload at least one team member's resume (PDF).");
      return;
    }
    if (!projectDescription.trim()) {
      setError("Please describe your project requirements.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("resumes", file));
      formData.append("project_description", projectDescription);
      formData.append("team_name", `Team (${files.length} resumes)`);

      const response = await analyzeTeamBulk(formData);
      setResult(response);
      setSim(null);
    } catch (err: any) {
      setError(err.message || "Failed to analyze team");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Seed the what-if editor whenever a new result arrives.
  useEffect(() => {
    if (result?.members) {
      setEditor(result.members.map((m: Member) => ({ member: m, active: true })));
    }
  }, [result]);

  // Run a debounced what-if simulation when the roster changes.
  const allRequirements = result ? requirementsFromResult(result) : [];
  useEffect(() => {
    if (!result || editor.length === 0) return;
    const activeMembers = editor.filter((e) => e.active).map((e) => e.member);
    // No change vs baseline → clear sim
    if (
      activeMembers.length === result.members?.length &&
      activeMembers.every((m, i) => m === result.members[i])
    ) {
      setSim(null);
      return;
    }
    const t = setTimeout(async () => {
      setSimulating(true);
      try {
        const res = await simulateTeam({
          team_name: "What-if Team",
          members: activeMembers.length
            ? activeMembers
            : [{ name: "Empty", skills: [] }],
          project_requirements: allRequirements,
        });
        setSim(res);
      } catch {
        /* keep last sim */
      } finally {
        setSimulating(false);
      }
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  const addHypotheticalMember = () => {
    const skills = newSkills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!newName.trim() || skills.length === 0) return;
    setEditor((prev) => [
      ...prev,
      { member: { name: `${newName.trim()} (hypothetical)`, skills }, active: true },
    ]);
    setNewName("");
    setNewSkills("");
  };

  const addToCompare = () => {
    if (!result) return;
    setCompareList((prev) => {
      const entry = {
        team_name: result.team_name || `Team ${prev.length + 1}`,
        coverage_score: result.coverage_score,
        weighted_coverage_score: result.weighted_coverage_score,
        gap_summary: result.gap_summary,
        top_gaps: (result.gap_clusters || []).slice(0, 3).map((c: any) => c.label),
        bus_risk: result.bus_factor?.risk_level,
        members: result.total_resumes_parsed || result.members?.length || 0,
        id: Date.now(),
      };
      return [...prev, entry];
    });
  };

  const loadingMessages = [
    "Securely parsing resume PDFs...",
    "Extracting technical proficiencies...",
    "Mapping per-member skill coverage...",
    "Clustering capability gaps by domain...",
    "Assessing key-person (bus-factor) risk...",
    "Generating context-aware Job Descriptions...",
  ];
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    if (!isSubmitting) return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % loadingMessages.length);
    }, 4500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitting]);

  // ─── derived display values (baseline vs simulated) ───
  const shownCoverage = sim ? sim.coverage_score : result?.coverage_score ?? 0;
  const shownWeighted = sim
    ? sim.weighted_coverage_score
    : result?.weighted_coverage_score ?? 0;
  const coverageDelta = sim
    ? Math.round((sim.coverage_score - result.coverage_score) * 10) / 10
    : 0;
  const radarData = (sim?.domain_coverage || result?.domain_coverage || []).map(
    (d: any) => ({ domain: d.label, coverage: d.coverage })
  );
  const busFactor = sim?.bus_factor || result?.bus_factor;

  return (
    <div className="space-y-8">
      {isSubmitting ? (
        <Card className="min-h-[60vh] flex flex-col items-center justify-center border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center text-center space-y-6 pt-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
              <div className="relative bg-background border rounded-2xl p-6 shadow-sm">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              </div>
            </div>
            <div className="space-y-2 max-w-sm">
              <h3 className="text-xl font-bold tracking-tight">AI Orchestration in Progress</h3>
              <p className="text-muted-foreground animate-pulse transition-opacity duration-500">
                {loadingMessages[loadingMsgIdx]}
              </p>
            </div>
            <div className="w-64 mt-4">
              <Progress value={(loadingMsgIdx / (loadingMessages.length - 1)) * 100} className="h-1.5" />
            </div>
          </CardContent>
        </Card>
      ) : !result ? (
        <Card>
          <CardHeader>
            <CardTitle>Team Gap Analysis</CardTitle>
            <CardDescription>
              Drop your team&apos;s resumes below and describe your project.
              The engine parses every PDF, maps per-member coverage, flags
              key-person risk, and computes exactly which roles you need to hire.
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

              <div>
                <Label className="mb-2 block">
                  Team Resumes (PDF) — {files.length} queued
                </Label>
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                    files.length > 0
                      ? "bg-primary/5 border-primary/30"
                      : "bg-muted/10 border-muted-foreground/20 hover:bg-muted/20 hover:border-muted-foreground/40"
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="p-3 bg-background rounded-full shadow-sm border">
                      <UploadCloud className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Click or drag PDF resumes here</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload multiple team member resumes at once
                      </p>
                    </div>
                  </div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    multiple
                    className="hidden"
                    onChange={handleFilesChange}
                  />
                </div>

                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-2.5 border group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileIcon className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-medium truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {(file.size / 1024).toFixed(0)} KB
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectDescription">Project Architecture &amp; Goals</Label>
                <Textarea
                  id="projectDescription"
                  placeholder="Describe what the team is building, required scalability, tech stack constraints, etc."
                  className="min-h-[120px] resize-y"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
                <Users className="mr-2 h-5 w-5" /> Analyze Team ({files.length} Resume
                {files.length !== 1 ? "s" : ""})
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Team Coverage Results</h2>
              <p className="text-muted-foreground mt-1">
                Strategic Gap Analysis
                {result.total_resumes_parsed && (
                  <span className="ml-2">
                    · {result.total_resumes_parsed} resumes parsed ·{" "}
                    {result.total_unique_skills} unique skills found
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={addToCompare}>
                <Plus className="mr-2 h-4 w-4" /> Add to Compare
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setFiles([]);
                  setSim(null);
                }}
              >
                New Analysis
              </Button>
            </div>
          </div>

          {/* ── Top row: coverage ring + risk-adjusted + radar ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coverage ring */}
            <Card className="border-primary/20 bg-primary/5 flex flex-col justify-center">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg text-muted-foreground">
                  Architectural Coverage
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="relative w-44 h-44 flex items-center justify-center mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor"
                      className="text-primary/10" strokeWidth="10" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor"
                      className="text-primary transition-all duration-700 ease-out"
                      strokeWidth="10" strokeDasharray={`${shownCoverage * 2.83} 283`} />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-black">{shownCoverage}%</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                      {sim ? "Simulated" : "Equipped"}
                    </span>
                  </div>
                </div>
                {sim && coverageDelta !== 0 && (
                  <Badge variant="outline" className={coverageDelta > 0 ? riskStyle("low") : riskStyle("high")}>
                    {coverageDelta > 0 ? "+" : ""}{coverageDelta}% vs current
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Risk-adjusted coverage (#4) */}
            <Card className="flex flex-col justify-center">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-500" /> Risk-Adjusted Coverage
                </CardTitle>
                <CardDescription className="text-xs">
                  Weights critical domains (security, devops) more heavily.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end gap-2">
                  <span className={`text-4xl font-black ${coverageColor(shownWeighted)}`}>
                    {shownWeighted}%
                  </span>
                  <span className="text-sm text-muted-foreground mb-1.5">weighted</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Raw {shownCoverage}%</span>
                    <span>Risk-adjusted {shownWeighted}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden relative">
                    <div className="absolute inset-y-0 left-0 bg-primary/40 rounded-full"
                      style={{ width: `${shownCoverage}%` }} />
                    <div className="absolute inset-y-0 left-0 bg-amber-500 rounded-full"
                      style={{ width: `${shownWeighted}%` }} />
                  </div>
                  {Math.abs(shownCoverage - shownWeighted) >= 8 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 pt-1">
                      Gaps concentrated in high-severity domains.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Composition radar (#9) */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Domain Composition
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[200px]">
                {radarData.length >= 3 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="75%">
                      <PolarGrid className="stroke-muted" />
                      <PolarAngleAxis dataKey="domain" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar dataKey="coverage" stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground text-center px-4">
                    Need at least 3 required domains to render the radar.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Parsed members ── */}
          {result.team_members && result.team_members.length > 0 && (
            <Card>
              <CardHeader className="pb-4 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Parsed Team Members
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {result.team_members.map((member: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
                      <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.skill_count} skill{member.skill_count !== 1 ? "s" : ""} extracted
                        </p>
                        {member.parse_error && (
                          <p className="text-xs text-destructive mt-1">Parse error</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Bus-factor (#3) + Upskill (#6) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bus-factor */}
            <Card>
              <CardHeader className="pb-4 border-b">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-amber-500" /> Key-Person Risk
                  </span>
                  {busFactor && (
                    <Badge variant="outline" className={riskStyle(busFactor.risk_level)}>
                      {busFactor.risk_level?.toUpperCase()} RISK
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <p className="text-sm text-muted-foreground">{busFactor?.summary}</p>
                {busFactor?.single_points_of_failure?.length > 0 ? (
                  <div className="space-y-2">
                    {busFactor.key_people?.map((kp: any, i: number) => (
                      <div key={i} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium">{kp.name}</span>
                          <span className="text-xs text-amber-600 dark:text-amber-400">
                            sole holder of {kp.count} skill{kp.count !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {kp.exclusive_skills.map((s: string, j: number) => (
                            <span key={j} className="text-xs px-2 py-0.5 bg-muted rounded font-mono">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" /> No single points of failure.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upskill suggestions */}
            <Card>
              <CardHeader className="pb-4 border-b">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" /> Upskill Instead of Hire
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {result.upskill_suggestions?.length > 0 ? (
                  <div className="space-y-3">
                    {result.upskill_suggestions.map((u: any, i: number) => (
                      <div key={i} className="rounded-lg border bg-muted/20 p-3">
                        <div className="flex items-center gap-2 text-sm font-medium mb-1">
                          <span>{u.member}</span>
                          <span className="text-muted-foreground font-mono text-xs">
                            {u.current_skill} → {u.target_skill}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{u.reason}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No quick upskill paths — remaining gaps need dedicated hires.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Domain gaps (fixed to gap_clusters) ── */}
          <Card>
            <CardHeader className="pb-4 border-b">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" /> Critical Domain Deficits
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {result.gap_clusters?.length > 0 ? (
                <div className="space-y-5">
                  {result.gap_clusters.map((gap: any, i: number) => (
                    <div key={i} className="flex flex-col space-y-2 border-l-2 border-muted pl-4 py-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-base">{gap.label}</h4>
                        <Badge variant="outline" className={urgencyStyle(gap.urgency)}>
                          {gap.urgency?.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{gap.reason}</p>
                      {gap.skills?.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-1">
                          {gap.skills.map((skill: string, j: number) => (
                            <span key={j} className="text-xs px-2 py-0.5 bg-muted rounded-md text-muted-foreground font-mono">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" /> No severe domain gaps detected.
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── What-if editor (#10) ── */}
          <Card className="border-primary/20">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> What-If Team Editor
                {simulating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </CardTitle>
              <CardDescription>
                Toggle members off (e.g. attrition) or add a hypothetical hire to see
                coverage recompute live.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {editor.map((row, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setEditor((prev) =>
                        prev.map((r, j) => (j === i ? { ...r, active: !r.active } : r))
                      )
                    }
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${
                      row.active ? "bg-primary/5 border-primary/30" : "bg-muted/30 opacity-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{row.member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.member.skills.length} skills
                      </p>
                    </div>
                    {row.active ? (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 items-end pt-2 border-t">
                <div className="flex-1 w-full space-y-1">
                  <Label className="text-xs">Hypothetical hire name</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Senior DevOps" className="h-9" />
                </div>
                <div className="flex-[2] w-full space-y-1">
                  <Label className="text-xs">Skills (comma-separated)</Label>
                  <Input value={newSkills} onChange={(e) => setNewSkills(e.target.value)}
                    placeholder="kubernetes, terraform, aws" className="h-9" />
                </div>
                <Button onClick={addHypotheticalMember} variant="secondary" className="h-9">
                  <UserPlus className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ── Hiring plan (no salary) ── */}
          <div>
            <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" /> Generated Hiring Plan
            </h3>
            <div className="grid grid-cols-1 space-y-6">
              {result.hire_plan?.map((role: any, i: number) => {
                const jdData = result.job_descriptions?.[i];
                return (
                  <Card key={i} className="overflow-hidden border-primary/20 shadow-sm relative group">
                    <div className="bg-gradient-to-r from-primary/5 via-transparent to-transparent px-6 py-5 flex flex-col sm:flex-row justify-between sm:items-center border-b gap-4">
                      <div>
                        <h4 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
                          {role.role}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5">
                          <Briefcase className="h-4 w-4" /> Priority {role.priority} · covers{" "}
                          {role.skills_covered?.join(", ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/dashboard?tab=talent&skills=${encodeURIComponent(
                                (role.skills_covered || []).join(",")
                              )}`
                            )
                          }
                        >
                          <Users className="h-4 w-4 mr-1.5" /> Find candidates
                        </Button>
                        <Badge variant="outline" className={urgencyStyle(role.urgency)}>
                          {role.urgency?.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="pt-6">
                      <div className="mb-6">
                        <h5 className="font-semibold text-sm text-primary/80 uppercase tracking-wide mb-2">
                          Strategic Justification
                        </h5>
                        <p className="text-sm text-foreground/90">{role.justification}</p>
                      </div>
                      <div>
                        <h5 className="font-semibold text-sm text-primary/80 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4" /> Ready-to-Post JD snippet
                        </h5>
                        <div className="bg-muted/40 p-5 rounded-xl text-sm whitespace-pre-wrap text-muted-foreground border border-muted-foreground/10 relative group/jd overflow-hidden shadow-inner">
                          {jdData?.description || "Formatting JD..."}
                          <Button variant="secondary" size="sm"
                            className="absolute top-3 right-3 opacity-0 group-hover/jd:opacity-100 transition-opacity shadow-sm bg-background/80 backdrop-blur"
                            onClick={() => navigator.clipboard.writeText(jdData?.description || "")}>
                            <Copy className="h-4 w-4 mr-2" /> Copy text
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {(!result.hire_plan || result.hire_plan.length === 0) && (
                <Card className="bg-muted/50 border-dashed">
                  <CardContent className="p-10 text-center text-muted-foreground">
                    Your current team is perfectly suited for the requested project
                    architecture. No hires recommended.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Compare tray (#11) ── */}
      {compareList.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader className="pb-4 border-b flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-primary" /> Team Comparison ({compareList.length})
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setCompareList([])}>
              Clear
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-2">
                {compareList.map((t) => (
                  <div key={t.id} className="min-w-[220px] rounded-xl border bg-muted/20 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold truncate">{t.team_name}</p>
                      <button
                        onClick={() => setCompareList((prev) => prev.filter((x) => x.id !== t.id))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className={`text-3xl font-black ${coverageColor(t.coverage_score)}`}>
                        {t.coverage_score}%
                      </span>
                      <span className="text-xs text-muted-foreground mb-1">coverage</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Risk-adjusted</span>
                        <span className={coverageColor(t.weighted_coverage_score)}>
                          {t.weighted_coverage_score}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gaps</span>
                        <span>{t.gap_summary?.gaps ?? "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Key-person risk</span>
                        <span className="capitalize">{t.bus_risk}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Members</span>
                        <span>{t.members}</span>
                      </div>
                    </div>
                    {t.top_gaps?.length > 0 && (
                      <div className="flex gap-1 flex-wrap pt-1">
                        {t.top_gaps.map((g: string, j: number) => (
                          <span key={j} className="text-[10px] px-1.5 py-0.5 bg-muted rounded">
                            {g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
