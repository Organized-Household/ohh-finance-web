export default function BusinessModelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Business Model</h1>
        <p className="text-gray-700 mb-6 leading-relaxed">
          OHh-Finance is a free household budgeting tool. We do not sell your data,
          serve advertisements, or use affiliate financial services. The service may
          introduce optional paid features in the future.
        </p>
        <a
          href="/"
          className="text-blue-600 hover:text-blue-800 underline font-medium"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
}
