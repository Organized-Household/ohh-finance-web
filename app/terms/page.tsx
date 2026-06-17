import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow sm:rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Terms of Service
        </h1>
        <p className="text-gray-700 mb-6">
          By using OHh-Budget you agree to use the service for personal household budgeting only. The service is provided as-is without warranty.
        </p>
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
