import Header from "@/app/components/landing/Header";
import Hero from "@/app/components/landing/Hero";
import OurWork from "@/app/components/landing/OurWork";
import FeaturesGrid from "@/app/components/landing/FeaturesGrid";
import Pricing from "@/app/components/landing/Pricing";

export default function Home() {
  return (
    <>
      <Header />
      <main className="space-y-32">
        <Hero />
        <OurWork />
        <FeaturesGrid />
        <Pricing />
      </main>
    </>
  );
}
