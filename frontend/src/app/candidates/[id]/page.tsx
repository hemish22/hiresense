"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { getCandidateAnalysis } from "@/lib/api";
import { CandidateView } from "@/components/dashboard/CandidateView";
import { Loader2, ArrowLeft } from "lucide-react";

export default function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getCandidateAnalysis(id);
        // The stored analysis_result blob is a superset of what CandidateView renders.
        const blob = data.analysis_result || {};
        if (active) setResult({ id: data.id, ...blob });
      } catch (err: any) {
        if (active) setError(err.message || "Failed to load candidate");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-6xl flex h-14 items-center justify-between px-4">
          <Link href="/dashboard?tab=talent" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Talent Map
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              H
            </div>
            <span className="font-semibold tracking-tight">HireSense AI</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-4 md:p-8">
        <div className="max-w-6xl mx-auto w-full flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              Loading candidate evaluation...
            </div>
          ) : error ? (
            <div className="text-center py-32 text-destructive">{error}</div>
          ) : (
            <CandidateView initialResult={result} />
          )}
        </div>
      </main>
    </div>
  );
}
