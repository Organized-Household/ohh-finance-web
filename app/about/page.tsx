import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-6">About OHh-Budget</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
          OHh-Budget is a household budgeting tool built for families who want
          to track income, expenses, savings, and investments in one place.
          Built by the Organized Household team.
        </p>
        <Link
          href="/"
          className="inline-block text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}
