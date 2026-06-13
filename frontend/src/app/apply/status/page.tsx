"use client";

import { useState } from "react";
import Link from "next/link";
import { getApplicationStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STAGE_LABELS, STAGE_COLORS, type Stage } from "@/lib/domains";
import { Loader2, Search, ArrowLeft, Inbox } from "lucide-react";

const STAGE_HINT: Record<Stage, string> = {
  applied: "Received — under initial review",
  shortlisted: "Shortlisted — you passed the first screen",
  interview: "Interview stage — expect to hear from us",
  offer: "Offer stage 🎉",
  hired: "Hired — welcome aboard! 🎉",
  rejected: "Not moving forward this time",
};

export default function StatusPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getApplicationStatus(email.trim()));
    } catch (err: any) {
      setError(err.message || "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-xl px-4 py-12">
      <Link href="/apply" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to careers
      </Link>

      <h1 className="text-2xl font-bold tracking-tight">Check application status</h1>
      <p className="text-muted-foreground mt-2 mb-6">
        Enter the email on your resume to see where your application stands.
      </p>

      <form onSubmit={lookup} className="flex items-end gap-2 mb-8">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {data && (
        data.count === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
            <Inbox className="h-8 w-8 mx-auto mb-3" />
            No applications found for {data.email}.
          </div>
        ) : (
          <div className="space-y-3">
            {data.applications.map((app: any) => {
              const stage = (app.status || "applied") as Stage;
              return (
                <div key={app.id} className="rounded-xl border p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">{app.role}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Submitted {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : "—"}
                    </div>
                    <div className="text-xs mt-1.5">{STAGE_HINT[stage]}</div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                    style={{ background: STAGE_COLORS[stage] + "22", color: STAGE_COLORS[stage] }}>
                    {STAGE_LABELS[stage]}
                  </span>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
