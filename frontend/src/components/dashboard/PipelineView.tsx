"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getCandidateList,
  updateCandidateStatus,
  deleteCandidate,
  getJobs,
  getJobCandidates,
} from "@/lib/api";
import {
  STAGES,
  STAGE_LABELS,
  STAGE_COLORS,
  fieldColor,
  fieldLabel,
  scoreColor,
  type Stage,
} from "@/lib/domains";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  GitCompare,
  X,
  Briefcase,
  Trophy,
  Trash2,
} from "lucide-react";

type Candidate = {
  id: number;
  candidate_name: string | null;
  email: string | null;
  overall_score: number;
  match_score: number;
  status: Stage;
  field: string;
  field_label: string;
  top_skills: string[];
};

export function PipelineView() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobId, setJobId] = useState<number | "all">("all");
  const [ranked, setRanked] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [compare, setCompare] = useState<Candidate[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [list, jobList] = await Promise.all([getCandidateList(), getJobs()]);
      setCandidates(list);
      setJobs(jobList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Per-job ranking mode
  useEffect(() => {
    (async () => {
      if (jobId === "all") {
        setRanked(null);
        return;
      }
      const res = await getJobCandidates(Number(jobId));
      setRanked(res.candidates);
    })();
  }, [jobId]);

  const move = async (c: Candidate, dir: 1 | -1) => {
    const idx = STAGES.indexOf(c.status);
    const next = STAGES[idx + dir];
    if (!next) return;
    setCandidates((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, status: next } : x))
    );
    try {
      await updateCandidateStatus(c.id, next);
    } catch {
      load(); // revert on failure
    }
  };

  const remove = async (c: Candidate) => {
    if (!confirm(`Delete ${c.candidate_name || c.email || `#${c.id}`} from the pipeline? This cannot be undone.`))
      return;
    const prev = candidates;
    setCandidates((p) => p.filter((x) => x.id !== c.id));
    setCompare((p) => p.filter((x) => x.id !== c.id));
    try {
      await deleteCandidate(c.id);
    } catch {
      setCandidates(prev); // revert on failure
    }
  };

  const toggleCompare = (c: Candidate) => {
    setCompare((prev) => {
      if (prev.find((x) => x.id === c.id)) return prev.filter((x) => x.id !== c.id);
      if (prev.length >= 3) return prev;
      return [...prev, c];
    });
  };

  const byStage = useMemo(() => {
    const map: Record<string, Candidate[]> = {};
    STAGES.forEach((s) => (map[s] = []));
    candidates.forEach((c) => (map[c.status] || map.applied).push(c));
    return map;
  }, [candidates]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-muted-foreground">
        <Loader2 className="h-7 w-7 animate-spin mr-3" /> Loading pipeline...
      </div>
    );
  }

  if (!candidates.length) {
    return (
      <div className="text-center py-24 border border-dashed rounded-xl bg-muted/20">
        <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-semibold">No candidates in the pipeline yet</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Candidates appear here once they apply or are analyzed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hiring Pipeline</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Move candidates through stages, or rank them against a specific role.
          </p>
        </div>
        <select
          value={jobId}
          onChange={(e) => setJobId(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="h-9 rounded-lg border bg-background px-3 text-sm"
        >
          <option value="all">Pipeline board (all stages)</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              Rank for: {j.title}
            </option>
          ))}
        </select>
      </div>

      {ranked ? (
        // ── Per-job ranked shortlist (#1) ──
        <Card>
          <CardContent className="p-0 divide-y">
            {ranked.map((c, i) => (
              <div key={c.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30">
                <div className="w-7 text-center font-bold text-muted-foreground">
                  {i === 0 ? <Trophy className="h-4 w-4 text-amber-500 mx-auto" /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/candidates/${c.id}`} className="font-medium hover:underline truncate block">
                    {c.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    overall {c.overall_score}% · {c.status}
                  </div>
                </div>
                {c.matched?.length > 0 && (
                  <div className="hidden md:flex gap-1 flex-wrap max-w-[40%] justify-end">
                    {c.matched.slice(0, 4).map((s: string, j: number) => (
                      <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 font-mono">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <div className="w-28 shrink-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">fit</span>
                    <span className="font-semibold" style={{ color: scoreColor(c.fit) }}>{c.fit}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${c.fit}%`, background: scoreColor(c.fit) }} />
                  </div>
                </div>
              </div>
            ))}
            {ranked.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">No candidates to rank.</div>
            )}
          </CardContent>
        </Card>
      ) : (
        // ── Kanban board (#2) ──
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAGES.map((stage) => (
            <div key={stage} className="rounded-xl border bg-muted/20 p-2 min-h-[120px]">
              <div className="flex items-center justify-between px-1.5 py-1 mb-2">
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: STAGE_COLORS[stage] }} />
                  {STAGE_LABELS[stage]}
                </span>
                <span className="text-[10px] text-muted-foreground">{byStage[stage].length}</span>
              </div>
              <div className="space-y-2">
                {byStage[stage].map((c) => {
                  const selected = !!compare.find((x) => x.id === c.id);
                  return (
                    <div
                      key={c.id}
                      className={`rounded-lg border bg-background p-2.5 shadow-sm ${
                        selected ? "ring-1 ring-primary" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <Link href={`/candidates/${c.id}`} className="text-sm font-medium hover:underline truncate flex items-center gap-1">
                          {c.candidate_name || c.email || `#${c.id}`}
                          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                        </Link>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: fieldColor(c.field) + "22", color: fieldColor(c.field) }}
                        >
                          {fieldLabel(c.field)}
                        </span>
                        <span className="text-xs font-bold ml-auto" style={{ color: scoreColor(c.overall_score) }}>
                          {c.overall_score}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t">
                        <div className="flex gap-1">
                          <button
                            onClick={() => move(c, -1)}
                            disabled={STAGES.indexOf(c.status) === 0}
                            className="p-1 rounded hover:bg-muted disabled:opacity-30"
                            title="Move back"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => move(c, 1)}
                            disabled={STAGES.indexOf(c.status) === STAGES.length - 1}
                            className="p-1 rounded hover:bg-muted disabled:opacity-30"
                            title="Move forward"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleCompare(c)}
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              selected ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                            }`}
                          >
                            {selected ? "✓" : "compare"}
                          </button>
                          <button
                            onClick={() => remove(c)}
                            className="p-1 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            title="Delete candidate"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Candidate compare (#11) ── */}
      {compare.length > 0 && (
        <Card className="border-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-primary" /> Compare ({compare.length}/3)
              </span>
              <Button variant="ghost" size="sm" onClick={() => setCompare([])}>Clear</Button>
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${compare.length}, minmax(0,1fr))` }}>
              {compare.map((c) => (
                <div key={c.id} className="rounded-xl border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <Link href={`/candidates/${c.id}`} className="font-semibold text-sm hover:underline truncate">
                      {c.candidate_name || `#${c.id}`}
                    </Link>
                    <button onClick={() => toggleCompare(c)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-2xl font-black" style={{ color: scoreColor(c.overall_score) }}>{c.overall_score}</div>
                      <span className="text-muted-foreground">overall</span>
                    </div>
                    <div>
                      <div className="text-2xl font-black" style={{ color: scoreColor(c.match_score) }}>{c.match_score}</div>
                      <span className="text-muted-foreground">JD match</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: fieldColor(c.field) + "22", color: fieldColor(c.field) }}>
                      {fieldLabel(c.field)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">Stage: {c.status}</div>
                  {c.top_skills?.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {c.top_skills.slice(0, 5).map((s, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-mono">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
