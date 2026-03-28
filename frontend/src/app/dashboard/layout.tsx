import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto max-w-6xl flex h-14 items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                            H
                        </div>
                        <span className="font-semibold tracking-tight">HireSense AI</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </header>
            <main className="flex-1 flex flex-col p-4 md:p-8">
                {children}
            </main>
        </div>
    );
}
