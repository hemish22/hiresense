"use client";

import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { CandidateView } from '@/components/dashboard/CandidateView';
import { TeamView } from '@/components/dashboard/TeamView';
import { PipelineView } from '@/components/dashboard/PipelineView';
import { InsightsView } from '@/components/dashboard/InsightsView';

// WebGL canvas must be client-only — disable SSR.
const VectorGraph = dynamic(
    () => import('@/components/dashboard/VectorGraph').then((m) => m.VectorGraph),
    { ssr: false, loading: () => <div className="py-24 text-center text-muted-foreground">Loading talent map...</div> }
);

const VALID_TABS = ['candidate', 'team', 'talent', 'pipeline', 'insights'];

function DashboardContent() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');
    const defaultTab = VALID_TABS.includes(tabParam || '') ? (tabParam as string) : 'candidate';

    return (
        <div className="max-w-6xl mx-auto w-full flex-1">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Evaluation Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                    Analyze candidate resumes against job descriptions, or evaluate your engineering team's current coverage constraints.
                </p>
            </div>

            <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 max-w-[820px] mb-8 bg-muted/50 p-1">
                    <TabsTrigger value="candidate">Candidate</TabsTrigger>
                    <TabsTrigger value="team">Team Gap</TabsTrigger>
                    <TabsTrigger value="talent">Talent Map</TabsTrigger>
                    <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
                    <TabsTrigger value="insights">Insights</TabsTrigger>
                </TabsList>
                <TabsContent value="candidate" className="space-y-4 pt-4">
                    <CandidateView />
                </TabsContent>
                <TabsContent value="team" className="space-y-4 pt-4">
                    <TeamView />
                </TabsContent>
                <TabsContent value="talent" className="space-y-4 pt-4">
                    <VectorGraph />
                </TabsContent>
                <TabsContent value="pipeline" className="space-y-4 pt-4">
                    <PipelineView />
                </TabsContent>
                <TabsContent value="insights" className="space-y-4 pt-4">
                    <InsightsView />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>}>
            <DashboardContent />
        </Suspense>
    );
}
