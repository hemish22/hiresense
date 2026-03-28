"use client";

import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Suspense } from 'react';

function DashboardContent() {
    const searchParams = useSearchParams();
    const defaultTab = searchParams.get('tab') === 'team' ? 'team' : 'candidate';

    return (
        <div className="max-w-6xl mx-auto w-full flex-1">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Evaluation Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                    Analyze candidate resumes against job descriptions, or evaluate your engineering team's current coverage constraints.
                </p>
            </div>

            <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8 bg-muted/50 p-1">
                    <TabsTrigger value="candidate">Candidate Evaluation</TabsTrigger>
                    <TabsTrigger value="team">Team Gap Analysis</TabsTrigger>
                </TabsList>
                <TabsContent value="candidate" className="space-y-4">
                    <div className="p-12 border rounded-xl border-dashed bg-muted/5 text-center mt-8 text-muted-foreground"> 
                        CandidateView Integration Placeholder 
                    </div>
                </TabsContent>
                <TabsContent value="team" className="space-y-4">
                    <div className="p-12 border rounded-xl border-dashed bg-muted/5 text-center mt-8 text-muted-foreground"> 
                        TeamView Integration Placeholder 
                    </div>
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
