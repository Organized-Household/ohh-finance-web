import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <div className="bg-white shadow sm:rounded-lg p-6">
          <p className="text-gray-700 mb-6">
            OHh-Budget does not share your financial data with third parties. All data is stored securely and used only to provide the budgeting service.
          </p>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 underline font-medium"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
