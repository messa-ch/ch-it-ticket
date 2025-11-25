import { TicketForm } from '@/components/ticket-form';

export default function SupportPage() {
  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/30 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl w-full space-y-12 relative z-10">
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight drop-shadow-lg">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              CH Support
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Premium support for our valued partners. Submit your request and experience seamless resolution.
          </p>
          <div className="flex justify-center">
            <a
              href="/support/portal"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-white/15 border border-white/20 text-white font-semibold hover:bg-white/25 transition"
            >
              See Ticket Updates
            </a>
          </div>
        </div>

        <TicketForm />

        <div className="text-center text-sm text-gray-500 mt-12">
          &copy; {new Date().getFullYear()} CH Money. All rights reserved.
        </div>
      </div>
    </main>
  );
}
