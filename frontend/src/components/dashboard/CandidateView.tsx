"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { analyzeCandidate } from "@/lib/api";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, MinusCircle, XCircle } from "lucide-react";
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
  ResponsiveContainer,
} from "recharts";

const chartConfig = {
  score: {
    label: "Score",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

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

export function CandidateView() {
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

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

  const radarData = buildRadarData(result?.scoring?.skill_match?.category_scores);

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
                  file ? 'bg-primary/5 border-primary/30' : 'bg-muted/10 border-muted-foreground/20 hover:bg-muted/20'
                }`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('resume-upload')?.click()}
              >
                <div className="flex flex-col items-center justify-center space-y-3 relative">
                  <div className="p-3 bg-background rounded-full shadow-sm border">
                    {file ? <FileText className="h-6 w-6 text-primary" /> : <UploadCloud className="h-6 w-6 text-muted-foreground" />}
                  </div>
                  {file ? (
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Analysis Complete</h2>
              <p className="text-muted-foreground">Evaluation for {file?.name}</p>
            </div>
            
            {/* Verification Badges */}
            <div className="flex flex-wrap gap-2">
              <div 
                title={result.scoring?.skill_match?.details?.engine === "gemini" || result.details?.engine === "gemini" ? "Gemini Semantic Engine Active" : "API Key Missing: Local DB Fallback"}
                className="flex items-center gap-1.5 text-sm text-muted-foreground border rounded-full px-3 py-1 bg-muted/20 shadow-sm cursor-help"
              >
                <span className="font-semibold text-xs tracking-wide">GEMINI</span>
                {result.scoring?.skill_match?.details?.engine === "gemini" || result.details?.engine === "gemini" 
                  ? <CheckCircle2 className="h-4 w-4 text-green-500" /> 
                  : <XCircle className="h-4 w-4 text-destructive" />}
              </div>
              <div 
                title={!result.github_analysis?.error && !result.github_analysis?.user_not_found ? "GitHub Data Found" : result.github_analysis?.user_not_found ? "No GitHub Given" : "GitHub Scrape Error"}
                className="flex items-center gap-1.5 text-sm text-muted-foreground border rounded-full px-3 py-1 bg-muted/20 shadow-sm cursor-help"
              >
                <span className="font-semibold text-xs tracking-wide">GITHUB</span>
                {!result.github_analysis?.error && !result.github_analysis?.user_not_found 
                  ? <CheckCircle2 className="h-4 w-4 text-green-500" /> 
                  : result.github_analysis?.user_not_found 
                    ? <MinusCircle className="h-4 w-4 text-amber-500" /> 
                    : <XCircle className="h-4 w-4 text-destructive" />}
              </div>
              <div 
                title={!result.leetcode_analysis?.error && !result.leetcode_analysis?.user_not_found ? "LeetCode Data Found" : result.leetcode_analysis?.user_not_found ? "No LeetCode Given" : "LeetCode Scrape Error"}
                className="flex items-center gap-1.5 text-sm text-muted-foreground border rounded-full px-3 py-1 bg-muted/20 shadow-sm cursor-help"
              >
                <span className="font-semibold text-xs tracking-wide">LEETCODE</span>
                {!result.leetcode_analysis?.error && !result.leetcode_analysis?.user_not_found 
                  ? <CheckCircle2 className="h-4 w-4 text-green-500" /> 
                  : result.leetcode_analysis?.user_not_found 
                    ? <MinusCircle className="h-4 w-4 text-amber-500" /> 
                    : <XCircle className="h-4 w-4 text-destructive" />}
              </div>
            </div>

            <Button variant="outline" onClick={() => { setResult(null); setFile(null); setJd(""); }}>
              Analyze Another
            </Button>
          </div>

          {/* Score + Executive Summary + Radar Chart row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Match Score Card */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Match Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-extrabold tracking-tighter flex items-baseline gap-1">
                  {result.scoring?.scores?.match_score ?? result.match_score} <span className="text-2xl text-muted-foreground">/100</span>
                </div>
                <Progress value={result.scoring?.scores?.match_score ?? result.match_score} className="h-2 mt-4" />
                <div className="mt-4 inline-flex">
                  <Badge variant={result.scoring?.recommendation === "Strong Hire" || result.scoring?.recommendation === "Hire" || result.recommendation === "HIRE" ? "default" : result.scoring?.recommendation === "Pass" || result.recommendation === "NO HIRE" ? "destructive" : "secondary"} className="text-sm px-3 py-1">
                    {result.scoring?.recommendation || result.recommendation || "Needs Review"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Executive Summary */}
            <Card className={radarData.length > 0 ? "" : "lg:col-span-2"}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed">
                  {(() => {
                    const text = result.scoring?.explanation || result.rationale || result.explanation || "No rationale provided by the engine.";
                    return typeof text === 'string' ? text.replace(/\s*\(\d+\/100\)/g, '') : text;
                  })()}
                </p>
              </CardContent>
            </Card>

            {/* Radar Chart — only if category_scores are available */}
            {radarData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Skill Radar</CardTitle>
                  <CardDescription className="text-xs">
                    Technical depth across key domains
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center pb-0">
                  <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square w-full max-h-[260px]"
                  >
                    <RadarChart data={radarData}>
                      <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                      <PolarAngleAxis 
                        dataKey="category" 
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      />
                      <PolarGrid 
                        stroke="hsl(var(--border))"
                        strokeOpacity={0.8}
                      />
                      <Radar
                        dataKey="score"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.4}
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{
                          r: 4,
                          fillOpacity: 1,
                          fill: "hsl(var(--primary))",
                        }}
                      />
                    </RadarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Skill Geography</CardTitle>
              <CardDescription>Capabilities matched and gaps identified against the JD</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Matched Skills */}
                {(result.scoring?.skill_match?.matched_skills || result.matched_skills) && (result.scoring?.skill_match?.matched_skills || result.matched_skills).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" /> Matched Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(result.scoring?.skill_match?.matched_skills || result.matched_skills).map((skill: string, i: number) => (
                        <Badge key={i} variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400 hover:bg-green-500/20">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Skills */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" /> Critical Missing Skills
                  </h4>
                  {(result.scoring?.skill_match?.missing_skills || result.skill_gaps || result.missing_skills) && (result.scoring?.skill_match?.missing_skills || result.skill_gaps || result.missing_skills).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {(result.scoring?.skill_match?.missing_skills || result.skill_gaps || result.missing_skills).map((gap: string, i: number) => (
                        <Badge key={i} variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">
                          {gap}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No significant skill gaps detected.</p>
                  )}
                </div>

                {/* Bonus Skills */}
                {(result.scoring?.skill_match?.bonus_skills || result.bonus_skills) && (result.scoring?.skill_match?.bonus_skills || result.bonus_skills).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-500" /> Bonus Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(result.scoring?.skill_match?.bonus_skills || result.bonus_skills).map((skill: string, i: number) => (
                        <Badge key={i} variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {(result.scoring?.learning_analysis?.explanation || result.learning_ability) && (
                   <div>
                     <h4 className="text-sm font-semibold mb-2">Projected Learning Velocity</h4>
                     <p className="text-sm text-foreground">{result.scoring?.learning_analysis?.explanation || result.learning_ability}</p>
                   </div>
                )}

                {/* Semantic Matches (AI reasoning) */}
                {(result.scoring?.skill_match?.details?.semantic_matches || result.details?.semantic_matches) && (result.scoring?.skill_match?.details?.semantic_matches || result.details?.semantic_matches).length > 0 && (result.scoring?.skill_match?.details?.engine === "gemini" || result.details?.engine === "gemini") && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3">AI Semantic Reasoning</h4>
                    <div className="space-y-2">
                      {(result.scoring?.skill_match?.details?.semantic_matches || result.details?.semantic_matches).slice(0, 6).map((match: any, i: number) => (
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
