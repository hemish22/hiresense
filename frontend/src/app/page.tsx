import { HeroSection } from "@/components/blocks/hero-section-1";
import { BackgroundPaths } from "@/components/ui/background-paths";

export default function Home() {
  return (
    <div className="relative">
      <div className="absolute inset-0 z-0">
        <BackgroundPaths title="" />
      </div>
      <div className="relative z-10">
        <HeroSection />
      </div>
    </div>
  );
}
