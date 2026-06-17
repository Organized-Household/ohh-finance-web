import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-6">
        <h1 className="text-3xl font-bold text-center">Contact Us</h1>
        <p className="text-center text-lg">
          For support or questions, email us at{' '}
          <a
            href="mailto:support@ohh-finance.app"
            className="text-blue-600 hover:underline"
          >
            support@ohh-finance.app
          </a>
          .
        </p>
        <div className="flex justify-center">
          <Link
            href="/"
            className="text-blue-600 hover:underline font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
