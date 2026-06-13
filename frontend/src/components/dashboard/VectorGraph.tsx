"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, Stars } from "@react-three/drei";
import { getConstellation, searchCandidates } from "@/lib/api";
import { Loader2, Boxes, Users, RotateCw, Search, X } from "lucide-react";
import type { Mesh } from "three";

// Industry/project domain → color + label (matches legend)
const FIELD_COLORS: Record<string, string> = {
  web3_blockchain: "#c084fc",
  ai_ml: "#22d3ee",
  computer_vision: "#60a5fa",
  hardware_iot: "#fb923c",
  sustainability: "#34d399",
  web_development: "#f472b6",
  data_science: "#fbbf24",
  healthcare: "#f87171",
  social_impact: "#d6b370",
};

const FIELD_LABELS: Record<string, string> = {
  web3_blockchain: "Web3 & Blockchain",
  ai_ml: "AI & Machine Learning",
  computer_vision: "Computer Vision",
  hardware_iot: "Hardware & IoT",
  sustainability: "Sustainability",
  web_development: "Web Development",
  data_science: "Data Science",
  healthcare: "Healthcare",
  social_impact: "Social Impact",
};

const fieldColor = (f: string) => FIELD_COLORS[f] || "#94a3b8";
const fieldLabel = (f: string) =>
  FIELD_LABELS[f] || f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

type Point = {
  id: number;
  name: string;
  field: string;
  field_label: string;
  score: number;
  match_score: number;
  x: number;
  y: number;
  z: number;
  top_skills: string[];
  applied_job?: string | null;
  github_username?: string | null;
};

function Node({
  p,
  dimmed,
  onHover,
  onClick,
}: {
  p: Point;
  dimmed: boolean;
  onHover: (p: Point | null) => void;
  onClick: (p: Point) => void;
}) {
  const ref = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const radius = 0.28 + (p.score / 100) * 0.55;
  const color = fieldColor(p.field);

  return (
    <mesh
      ref={ref}
      position={[p.x, p.y, p.z]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover(p);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        onHover(null);
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(p);
      }}
      scale={hovered ? 1.35 : 1}
    >
      <sphereGeometry args={[radius, 24, 24]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={hovered ? 1.1 : dimmed ? 0.05 : 0.45}
        transparent
        opacity={dimmed ? 0.15 : 1}
        roughness={0.35}
        metalness={0.1}
      />
      {hovered && (
        <Html distanceFactor={12} position={[0, radius + 0.4, 0]} center>
          <div className="pointer-events-none whitespace-nowrap rounded-md bg-black/85 px-2 py-1 text-[11px] text-white shadow-lg">
            <span className="font-semibold">{p.name}</span>
            <span className="text-white/60"> · {p.score}</span>
          </div>
        </Html>
      )}
    </mesh>
  );
}

export function VectorGraph() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<Point | null>(null);
  const [activeFields, setActiveFields] = useState<Set<string>>(new Set());
  const [minScore, setMinScore] = useState(0);
  // Search (#5) + gap-bridge highlight (#3)
  const [query, setQuery] = useState("");
  const [highlightIds, setHighlightIds] = useState<Set<number> | null>(null);
  const [highlightLabel, setHighlightLabel] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getConstellation();
      setData(res);
      setActiveFields(new Set(res.fields || []));
    } catch (err: any) {
      setError(err.message || "Failed to load talent map");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const points: Point[] = data?.points || [];
  const fields: string[] = data?.fields || [];

  // Gap-bridge: ?skills=kubernetes,terraform highlights matching candidates
  useEffect(() => {
    const skillsParam = searchParams.get("skills");
    if (skillsParam && points.length) {
      const wanted = skillsParam.toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
      const ids = new Set(
        points
          .filter((p) => (p.top_skills || []).some((s) => wanted.includes(s.toLowerCase())))
          .map((p) => p.id)
      );
      setHighlightIds(ids);
      setHighlightLabel(`Gap match: ${wanted.join(", ")}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, data]);

  const runSearch = async () => {
    if (!query.trim()) {
      clearHighlight();
      return;
    }
    try {
      const res = await searchCandidates(query);
      setHighlightIds(new Set((res.results || []).map((r: any) => r.id)));
      setHighlightLabel(`Search: "${query}"`);
    } catch {
      /* ignore */
    }
  };

  const clearHighlight = () => {
    setHighlightIds(null);
    setHighlightLabel(null);
    setQuery("");
  };

  const isVisible = (p: Point) =>
    activeFields.has(p.field) && p.score >= minScore;

  const isActive = (p: Point) =>
    isVisible(p) && (highlightIds === null || highlightIds.has(p.id));

  const toggleField = (f: string) => {
    setActiveFields((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };

  const visibleCount = useMemo(
    () => points.filter(isVisible).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [points, activeFields, minScore]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-3" />
        Projecting candidates into vector space...
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-24 text-destructive">{error}</div>;
  }

  if (!points.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center border border-dashed rounded-xl bg-muted/20">
        <Boxes className="h-10 w-10 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No candidates yet</h3>
        <p className="text-muted-foreground text-sm max-w-sm mt-2">
          Once candidates apply through the applicant portal, they&apos;ll appear
          here as a 3D semantic map you can explore.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Boxes className="h-6 w-6 text-primary" /> Talent Map
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {data.layout === "semantic"
              ? "Candidates positioned by skill-embedding similarity (PCA). Outliers are the most unique profiles."
              : "Candidates grouped by field, height by overall score."}{" "}
            · {visibleCount} of {points.length} shown
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="Search e.g. react dev strong dsa"
              className="h-9 w-56 rounded-lg border bg-background pl-8 pr-3 text-sm"
            />
          </div>
          <button onClick={runSearch} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted/50">
            Find
          </button>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted/50"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative w-full h-[68vh] rounded-2xl border bg-[#05060a] overflow-hidden">
        <Canvas camera={{ position: [0, 6, 22], fov: 50 }} dpr={[1, 2]}>
          <color attach="background" args={["#05060a"]} />
          <ambientLight intensity={0.7} />
          <pointLight position={[15, 15, 15]} intensity={1.2} />
          <pointLight position={[-15, -10, -10]} intensity={0.5} />
          <Stars radius={80} depth={40} count={1500} factor={3} fade speed={0.5} />
          {points.map((p) => (
            <Node
              key={p.id}
              p={p}
              dimmed={!isActive(p)}
              onHover={setHover}
              onClick={(pt) => router.push(`/candidates/${pt.id}`)}
            />
          ))}
          <OrbitControls
            enablePan
            enableZoom
            autoRotate
            autoRotateSpeed={0.4}
            minDistance={6}
            maxDistance={60}
          />
        </Canvas>

        {/* Highlight banner (search / gap bridge) */}
        {highlightLabel && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 backdrop-blur px-3 py-1.5 text-xs text-white">
            <span>{highlightLabel}</span>
            <span className="text-white/60">·</span>
            <span>{points.filter((p) => highlightIds?.has(p.id)).length} match</span>
            <button onClick={clearHighlight} className="ml-1 hover:text-primary">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Hover detail card */}
        {hover && (
          <div className="absolute top-4 left-4 w-64 rounded-xl border border-white/10 bg-black/70 backdrop-blur p-4 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <span className="font-semibold truncate">{hover.name}</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: fieldColor(hover.field) + "33", color: fieldColor(hover.field) }}
              >
                {hover.field_label || fieldLabel(hover.field)}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-white/70">
              <div>
                <div className="text-white text-lg font-bold">{hover.score}</div>
                overall
              </div>
              <div>
                <div className="text-white text-lg font-bold">{hover.match_score}</div>
                JD match
              </div>
            </div>
            {hover.top_skills?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {hover.top_skills.slice(0, 5).map((s, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-mono">
                    {s}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-2 text-[11px] text-white/50">Click node to open full evaluation →</p>
          </div>
        )}

        {/* Score filter */}
        <div className="absolute top-4 right-4 w-48 rounded-xl border border-white/10 bg-black/60 backdrop-blur p-3 text-white">
          <label className="text-[11px] text-white/60 uppercase tracking-wide">
            Min score: {minScore}
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-full mt-1 accent-primary"
          />
        </div>

        {/* Legend / field filters */}
        <div className="absolute bottom-4 left-4 rounded-xl border border-white/10 bg-black/60 backdrop-blur p-3 text-white max-w-[220px]">
          <div className="text-[11px] text-white/60 uppercase tracking-wide mb-2">
            Field — click to filter
          </div>
          <div className="flex flex-col gap-1.5">
            {fields.map((f) => {
              const active = activeFields.has(f);
              return (
                <button
                  key={f}
                  onClick={() => toggleField(f)}
                  className={`flex items-center gap-2 text-xs transition-opacity ${
                    active ? "opacity-100" : "opacity-35"
                  }`}
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: fieldColor(f) }}
                  />
                  {fieldLabel(f)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Count badge */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 backdrop-blur px-3 py-1.5 text-xs text-white">
          <Users className="h-3.5 w-3.5" /> {points.length} candidates
        </div>
      </div>
    </div>
  );
}
