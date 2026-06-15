import Link from 'next/link';

export default function DisclosuresPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-card rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold text-foreground mb-6">
            Third-Party Services
          </h1>
          
          <div className="prose prose-slate max-w-none">
            <p className="text-muted-foreground text-lg leading-relaxed">
              OHh-Finance does not use Plaid or any third-party financial data 
              aggregation service. Bank account numbers are never required. The app 
              uses Supabase for data storage and Vercel for hosting.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t">
            <Link
              href="/"
              className="inline-flex items-center text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <svg 
                className="w-5 h-5 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
