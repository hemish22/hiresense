"use client";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChartLineUp } from "@phosphor-icons/react";
import { UserCheck, ShieldCheck, Zap, ChevronRight, FileSearch } from "lucide-react";
import Link from "next/link";
import { TextEffect } from "@/components/ui/text-effect";
import { AnimatedGroup } from "@/components/ui/animated-group";

function Header() {
  return (
    <header className="absolute top-0 w-full z-50 p-4">
      <div className="container mx-auto max-w-6xl flex items-center justify-between mt-2">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            H
          </div>
          <span className="font-semibold text-lg tracking-tight">HireSense AI</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="#analysis" className="text-muted-foreground hover:text-foreground transition-colors">
            Analysis
          </Link>
          <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Launch Platform
          </Link>
          <Button asChild size="sm">
            <Link href="/dashboard">
              Get Started <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function HeroSection() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden selection:bg-primary/20">
      <Header />
      
      {/* Background gradients */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-accent opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>

      <main className="relative z-10 container mx-auto px-4 md:px-6 pt-32 pb-16 min-h-screen flex flex-col items-center justify-center text-center">
        <AnimatedGroup preset="fade" className="max-w-4xl mx-auto flex flex-col items-center">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all mb-8 shadow-sm"
          >
            <span className="flex h-2 w-2 rounded-full bg-primary relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            </span>
            HireSense v1.0 is live
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
          
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight mb-6 text-foreground text-balance">
            <TextEffect preset="blur" per="word">
              Intelligence beyond
            </TextEffect>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60 block mt-2">
              the resume.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl text-balance">
            <TextEffect preset="fade" per="line" delay={0.4}>
              Evaluate true coding ability, verify skills against GitHub signals, 
              and map team coverage instantly without the guesswork.
            </TextEffect>
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mt-4">
            <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base shadow-lg shadow-primary/20" asChild>
              <Link href="/dashboard">
                <FileSearch className="mr-2 w-5 h-5" strokeWidth={2.5} /> Analyze Candidate
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base bg-background/50 backdrop-blur-sm" asChild>
              <Link href="/dashboard?tab=team">
                <ChartLineUp className="mr-2 w-5 h-5" /> Team Gap Analysis
              </Link>
            </Button>
          </div>

          <div className="mt-16 pt-8 border-t border-border w-full flex flex-col items-center">
            <p className="text-sm font-medium text-muted-foreground mb-6">Trusted evaluation pipeline</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <div className="flex items-center gap-2"><UserCheck className="w-6 h-6" /> <span className="font-semibold text-lg tracking-tight">GitHub</span></div>
              <div className="flex items-center gap-2"><ShieldCheck className="w-6 h-6" /> <span className="font-semibold text-lg tracking-tight">LeetCode</span></div>
              <div className="flex items-center gap-2"><Zap className="w-6 h-6" /> <span className="font-semibold text-lg tracking-tight">Semantic Engine</span></div>
            </div>
          </div>
        </AnimatedGroup>
      </main>

      {/* Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
        <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-accent to-primary opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>
    </div>
  );
}
