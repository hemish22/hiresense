"use client";

import { useEffect, useRef, useState } from "react";
import { getJobs, applyCandidate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  UploadCloud,
  File as FileIcon,
  X,
  CheckCircle2,
  Briefcase,
  MapPin,
  AlertCircle,
} from "lucide-react";

type Job = {
  id: number;
  title: string;
  department?: string;
  location?: string;
  employment_type?: string;
  is_open_application: boolean;
};

export default function ApplyPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [github, setGithub] = useState("");
  const [leetcode, setLeetcode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getJobs();
        setJobs(data);
        const open = data.find((j: Job) => j.is_open_application) || data[0];
        if (open) setSelectedJob(open.id);
      } catch {
        /* jobs list optional */
      }
    })();
  }, []);

  const onFile = (f: FileList | null) => {
    if (f && f[0] && f[0].name.toLowerCase().endsWith(".pdf")) setFile(f[0]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please upload your resume (PDF).");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("resume", file);
      if (selectedJob != null) fd.append("job_id", String(selectedJob));
      if (github.trim()) fd.append("github_username", github.trim());
      if (leetcode.trim()) fd.append("leetcode_username", leetcode.trim());
      const res = await applyCandidate(fd);
      setDone(res);
    } catch (err: any) {
      setError(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-20 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mb-6">
          <CheckCircle2 className="h-9 w-9 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Application received</h1>
        <p className="text-muted-foreground mt-3">
          Thanks{done.candidate_name ? `, ${done.candidate_name}` : ""}! Your profile
          for <span className="font-medium text-foreground">{done.applied_job?.title}</span> has
          been submitted. Our team will review it and reach out if there&apos;s a fit.
        </p>
        <Button
          variant="outline"
          className="mt-8"
          onClick={() => {
            setDone(null);
            setFile(null);
            setGithub("");
            setLeetcode("");
          }}
        >
          Submit another application
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Join HireSense</h1>
        <p className="text-muted-foreground mt-3">
          Submit your resume below. Apply to a specific role, or send an open
          application and we&apos;ll keep you in mind year-round.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-8">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {/* Role selection */}
        <div>
          <Label className="mb-3 block text-base">Choose a role</Label>
          <div className="grid gap-3">
            {jobs.map((j) => (
              <button
                key={j.id}
                type="button"
                onClick={() => setSelectedJob(j.id)}
                className={`text-left rounded-xl border p-4 transition-all ${
                  selectedJob === j.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    {j.title}
                  </span>
                  {j.is_open_application && (
                    <span className="text-[10px] uppercase tracking-wide bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Year-round
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                  {j.department && <span>{j.department}</span>}
                  {j.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {j.location}
                    </span>
                  )}
                  {j.employment_type && j.employment_type !== "Any" && (
                    <span>{j.employment_type}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Resume upload */}
        <div>
          <Label className="mb-3 block text-base">Your resume (PDF)</Label>
          {!file ? (
            <div
              className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer bg-muted/10 hover:bg-muted/20 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onFile(e.dataTransfer.files);
              }}
            >
              <div className="inline-flex p-3 bg-background rounded-full shadow-sm border mb-3">
                <UploadCloud className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Click or drag your PDF resume here</p>
              <p className="text-xs text-muted-foreground mt-1">PDF only · max ~5MB</p>
              <Input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => onFile(e.target.files)}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileIcon className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-medium truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
              </div>
              <button type="button" onClick={() => setFile(null)} className="p-1 rounded hover:bg-destructive/10">
                <X className="h-4 w-4 text-destructive" />
              </button>
            </div>
          )}
        </div>

        {/* Optional profiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="gh" className="text-sm">GitHub username <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="gh" placeholder="e.g. torvalds" value={github} onChange={(e) => setGithub(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lc" className="text-sm">LeetCode username <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="lc" placeholder="e.g. johndoe" value={leetcode} onChange={(e) => setLeetcode(e.target.value)} />
          </div>
        </div>

        <Button type="submit" className="w-full h-12 text-base" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Reviewing your profile...
            </>
          ) : (
            "Submit Application"
          )}
        </Button>
        {submitting && (
          <p className="text-center text-xs text-muted-foreground">
            We&apos;re analyzing your resume and public profiles — this can take up to a minute.
          </p>
        )}
      </form>
    </div>
  );
}
