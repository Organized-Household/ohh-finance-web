import PublicBrandHeader from "@/components/public/public-brand-header";
import WelcomeScreen from "@/components/public/welcome-screen";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <PublicBrandHeader current="welcome" />

      <main className="mx-auto flex w-full flex-1 flex-col pb-10 pt-6 sm:pt-8">
        <WelcomeScreen />
      </main>
    </div>
  );
}
