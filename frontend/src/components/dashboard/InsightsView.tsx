"use client";

import { useEffect, useState } from "react";
import { getAnalytics } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fieldLabel, fieldColor, STAGE_COLORS, STAGE_LABELS, type Stage } from "@/lib/domains";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Cell,
  Legend,
} from "recharts";
import { Loader2, Users, Briefcase, Gauge, Target, TrendingUp, Scale } from "lucide-react";

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: any; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
        <div>
          <div className="text-2xl font-black leading-none">{value}</div>
          <div className="text-xs text-muted-foreground mt-1">{label}{sub ? ` · ${sub}` : ""}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function InsightsView() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setData(await getAnalytics());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-muted-foreground">
        <Loader2 className="h-7 w-7 animate-spin mr-3" /> Crunching analytics...
      </div>
    );
  }
  if (!data) return <div className="text-center py-20 text-destructive">Failed to load analytics.</div>;

  const supplyDemand = (data.supply_vs_demand || []).map((d: any) => ({
    label: fieldLabel(d.domain),
    Supply: d.supply,
    Demand: d.demand,
  }));
  const undersupplied = (data.supply_vs_demand || []).filter((d: any) => d.demand > d.supply);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Recruiting Insights</h2>
        <p className="text-muted-foreground text-sm mt-1">Pipeline health and talent supply vs open-role demand.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={<Users className="h-5 w-5" />} label="Candidates" value={data.total_candidates} />
        <Stat icon={<Briefcase className="h-5 w-5" />} label="Open roles" value={data.total_jobs} />
        <Stat icon={<Gauge className="h-5 w-5" />} label="Avg overall" value={`${data.avg_overall_score}%`} />
        <Stat icon={<Target className="h-5 w-5" />} label="Avg JD match" value={`${data.avg_match_score}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score distribution */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Score Distribution</CardTitle></CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.score_distribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pipeline funnel */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Pipeline Stages</CardTitle></CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.by_status} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="status" width={80}
                  tickFormatter={(s) => STAGE_LABELS[s as Stage] || s} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {data.by_status.map((s: any, i: number) => (
                    <Cell key={i} fill={STAGE_COLORS[s.status as Stage] || "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Talent by domain */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Talent by Domain</CardTitle></CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(data.by_domain || []).map((d: any) => ({ label: fieldLabel(d.domain), count: d.count, domain: d.domain }))}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {(data.by_domain || []).map((d: any, i: number) => (
                    <Cell key={i} fill={fieldColor(d.domain)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Supply vs demand (#8) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" /> Supply vs Demand
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supplyDemand}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Supply" radius={[4, 4, 0, 0]} fill="#60a5fa" />
                <Bar dataKey="Demand" radius={[4, 4, 0, 0]} fill="#fb923c" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Undersupplied callout */}
      {undersupplied.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold">Hiring blind spots:</span>{" "}
              {undersupplied.map((d: any) => fieldLabel(d.domain)).join(", ")} —
              open roles exist but few or no applicants have applied. Consider targeted sourcing.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications over time */}
      {data.over_time?.length > 1 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Applications Over Time</CardTitle></CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.over_time}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
