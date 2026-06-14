export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-6">
        <h1 className="text-3xl font-bold text-center">About OHh-Finance</h1>
        <div className="space-y-4 text-lg">
          <p>
            OHh-Finance is a multi-tenant, web-based budgeting application designed to help households manage their finances, track expenses and income, set up savings and investments, and monitor debt.
          </p>
          <p>
            Our mission is to provide households with intuitive tools for comprehensive financial oversight, enabling families to make informed decisions, plan for irregular expenses, and achieve their financial goals.
          </p>
          <p>
            Built with Next.js, TypeScript, and Supabase, OHh-Finance offers secure, tenant-isolated data management with responsive design for browser-based use across all devices.
          </p>
        </div>
        <div className="text-center mt-8">
          <a href="/" className="text-blue-600 hover:underline">
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
