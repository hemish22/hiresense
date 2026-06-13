import {
  FileSearch,
  Users,
  Boxes,
  KanbanSquare,
  BarChart3,
  Briefcase,
  FileText,
  GitBranch,
  Brain,
  ArrowRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: FileSearch,
    title: "Candidate Evaluation",
    desc: "Parse a resume and score it against any JD — verified with GitHub and LeetCode signals, not just keywords.",
  },
  {
    icon: Users,
    title: "Team Gap Analysis",
    desc: "Upload your team's resumes, see coverage, key-person (bus-factor) risk, upskill paths, and a prioritized hire plan.",
  },
  {
    icon: Boxes,
    title: "3D Talent Map",
    desc: "Every applicant projected into a semantic vector space. Spot clusters and unique profiles, click to open the full evaluation.",
  },
  {
    icon: KanbanSquare,
    title: "Hiring Pipeline",
    desc: "Move candidates through stages, rank applicants per role, and compare shortlisted profiles side by side.",
  },
  {
    icon: BarChart3,
    title: "Recruiting Insights",
    desc: "Score distribution, pipeline funnel, and talent supply vs open-role demand — spot your hiring blind spots.",
  },
  {
    icon: Briefcase,
    title: "Applicant Portal",
    desc: "A public careers site where candidates apply year-round. Every application is auto-evaluated the moment it lands.",
  },
];

const STEPS = [
  {
    icon: FileText,
    title: "1 · Ingest",
    desc: "Resume parsed for skills, experience, and links. Candidate applies through the portal or is added by a recruiter.",
  },
  {
    icon: GitBranch,
    title: "2 · Verify",
    desc: "GitHub activity, project depth, and LeetCode problem-solving pulled in to verify claimed ability against real signals.",
  },
  {
    icon: Brain,
    title: "3 · Score",
    desc: "Semantic skill matching against the JD plus learning ability and credibility scores — fused into one overall verdict.",
  },
  {
    icon: Boxes,
    title: "4 · Map & Act",
    desc: "Stored instantly: ranked in the pipeline, plotted on the talent map, and ready for an AI hire verdict.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative bg-background py-24 border-t">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">Features</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            One platform, the whole hiring signal
          </h2>
          <p className="text-muted-foreground mt-4">
            From a single resume to your entire talent pool — evaluation, planning, and visualization in one place.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6 hover:shadow-md hover:border-primary/30 transition-all">
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AnalysisSection() {
  return (
    <section id="analysis" className="relative bg-muted/30 py-24 border-t">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">How it works</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Multi-signal analysis, end to end
          </h2>
          <p className="text-muted-foreground mt-4">
            Every candidate runs through the same four-stage pipeline — automatically.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border bg-background p-6">
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.desc}</p>
              {i < STEPS.length - 1 && (
                <ArrowRight className="hidden lg:block absolute -right-3 top-10 h-5 w-5 text-muted-foreground/40" />
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <a href="/dashboard" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
            Launch the platform <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
