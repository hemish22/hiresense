"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { analyzeTeamBulk } from "@/lib/api";
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
} from "lucide-react";

export function TeamView() {
  // Bulk PDF upload state
  const [files, setFiles] = useState<File[]>([]);
  const [location, setLocation] = useState("San Francisco, CA");
  const [projectDescription, setProjectDescription] = useState(
    "Building a scalable fintech application for real-time payments that requires high security and low latency."
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter((f) =>
        f.name.toLowerCase().endsWith(".pdf")
      );
      setFiles((prev) => [...prev, ...newFiles]);
    }
    // Reset input so re-selecting the same files works
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
      formData.append("market_location", location);
      formData.append("team_name", `Team (${files.length} resumes)`);

      const response = await analyzeTeamBulk(formData);
      setResult(response);
    } catch (err: any) {
      setError(err.message || "Failed to analyze team");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toUpperCase()) {
      case "HIGH":
        return "text-destructive bg-destructive/10 border-destructive/20";
      case "MEDIUM":
        return "text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400 dark:bg-amber-400/10";
      default:
        return "text-green-600 bg-green-500/10 border-green-500/20 dark:text-green-400 dark:bg-green-400/10";
    }
  };

  const loadingMessages = [
    "Securely parsing resume PDFs...",
    "Extracting technical proficiencies...",
    "Aggregating team architectural coverage...",
    "Benchmarking missing capabilities...",
    "Estimating competitive salary requirements...",
    "Generating context-aware Job Descriptions...",
  ];
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    if (!isSubmitting) return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % loadingMessages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isSubmitting]);

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
              The engine will parse every PDF, aggregate capabilities, and compute
              exactly which roles you need to hire.
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

              {/* Drag-and-drop file zone */}
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
                      <p className="text-sm font-medium">
                        Click or drag PDF resumes here
                      </p>
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

                {/* File list */}
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-2.5 border group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileIcon className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {file.name}
                          </span>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="location">
                    Market Location (For Salary Benchmarks)
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g. Remote, San Francisco, London"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectDescription">
                  Project Architecture &amp; Goals
                </Label>
                <Textarea
                  id="projectDescription"
                  placeholder="Describe what the team is building, required scalability, tech stack constraints, etc."
                  className="min-h-[120px] resize-y"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Parsing {files.length} Resume{files.length !== 1 ? "s" : ""} &amp; Computing Gaps...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-5 w-5" /> Analyze Team ({files.length}{" "}
                    Resume{files.length !== 1 ? "s" : ""})
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Team Coverage Results
              </h2>
              <p className="text-muted-foreground mt-1">
                Strategic Gap Analysis for {location}
                {result.total_resumes_parsed && (
                  <span className="ml-2">
                    · {result.total_resumes_parsed} resumes parsed ·{" "}
                    {result.total_unique_skills} unique skills found
                  </span>
                )}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setFiles([]);
              }}
            >
              New Analysis
            </Button>
          </div>

          {/* Team Members Parsed (if bulk) */}
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
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20"
                    >
                      <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.skill_count} skill{member.skill_count !== 1 ? "s" : ""}{" "}
                          extracted
                        </p>
                        {member.parse_error && (
                          <p className="text-xs text-destructive mt-1">
                            Parse error
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Master Coverage Ring */}
            <Card className="lg:col-span-1 border-primary/20 bg-primary/5 flex flex-col justify-center">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg text-muted-foreground">
                  Architectural Coverage
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="relative w-48 h-48 flex items-center justify-center mb-4">
                  <svg
                    className="w-full h-full transform -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      className="text-primary/10"
                      strokeWidth="10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      className="text-primary transition-all duration-1000 ease-out"
                      strokeWidth="10"
                      strokeDasharray={`${result.coverage_score * 2.83} 283`}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-5xl font-black">
                      {result.coverage_score}%
                    </span>
                    <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                      Equipped
                    </span>
                  </div>
                </div>
                <p className="text-center text-sm font-medium text-foreground px-4">
                  {result.coverage_score > 70
                    ? "Your current team has strong core capability."
                    : "Significant vulnerabilities detected."}
                </p>
              </CardContent>
            </Card>

            {/* Domain Gaps */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-4 border-b">
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" /> Critical
                  Domain Deficits
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ScrollArea className="h-[250px] pr-4">
                  {result.domain_gaps?.length > 0 ? (
                    <div className="space-y-6">
                      {result.domain_gaps.map((gap: any, i: number) => (
                        <div
                          key={i}
                          className="flex flex-col space-y-2 border-l-2 pl-4 py-1"
                          style={{
                            borderColor:
                              gap.urgency === "HIGH"
                                ? "var(--radius)"
                                : "currentColor",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-base">
                              {gap.domain}
                            </h4>
                            <Badge
                              variant="outline"
                              className={getUrgencyColor(gap.urgency)}
                            >
                              {gap.urgency} URGENCY
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {gap.description}
                          </p>
                          {gap.missing_skills &&
                            gap.missing_skills.length > 0 && (
                              <div className="flex gap-2 flex-wrap mt-2">
                                {gap.missing_skills.map(
                                  (skill: string, j: number) => (
                                    <span
                                      key={j}
                                      className="text-xs px-2 py-0.5 bg-muted rounded-md text-muted-foreground font-mono"
                                    >
                                      {skill}
                                    </span>
                                  )
                                )}
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />{" "}
                      No severe domain gaps detected.
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Hiring Plan Generation */}
          <div>
            <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" /> Generated Hiring
              Plan
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
                      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4" />
                        Est. Salary: {role.salary?.formatted || "Competitive"}
                      </p>
                    </div>
                    <Badge variant="secondary" className="w-fit py-1.5 px-3 border-primary/20 bg-background shadow-sm">
                      {location}
                    </Badge>
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
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute top-3 right-3 opacity-0 group-hover/jd:opacity-100 transition-opacity shadow-sm bg-background/80 backdrop-blur"
                          onClick={() => navigator.clipboard.writeText(jdData?.description || "")}
                        >
                          <Copy className="h-4 w-4 mr-2" /> Copy text
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )})}

              {(!result.hire_plan || result.hire_plan.length === 0) && (
                <Card className="bg-muted/50 border-dashed">
                  <CardContent className="p-10 text-center text-muted-foreground">
                    Your current team is perfectly suited for the requested
                    project architecture. No hires recommended.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
