import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 px-6">
      <div className="max-w-2xl w-full text-center space-y-6 bg-black/30 border border-white/10 rounded-3xl p-10 shadow-2xl backdrop-blur">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white">
          Need help?
        </h1>
        <p className="text-lg text-gray-200">
          Head to our support portal to open a ticket and we&apos;ll get back to you quickly.
        </p>
        <div className="flex justify-center">
          <Link
            href="/support"
            className="inline-flex items-center justify-center px-6 py-3 text-lg font-semibold text-black bg-white rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5"
          >
            Go to Support
          </Link>
        </div>
      </div>
    </main>
  );
}
