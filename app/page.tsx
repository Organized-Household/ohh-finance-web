import PublicBrandHeader from "@/components/public/public-brand-header";
import WelcomeScreen from "@/components/public/welcome-screen";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <PublicBrandHeader current="welcome" />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 pb-10 pt-12 sm:pt-16">
        <WelcomeScreen />
      </main>
    </div>
  );
}
