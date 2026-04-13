import PublicBrandHeader from "@/components/public/public-brand-header";
import WelcomeScreen from "@/components/public/welcome-screen";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-900">
      <PublicBrandHeader current="welcome" />

      <main className="flex flex-1 flex-col">
        <WelcomeScreen />
      </main>
    </div>
  );
}
