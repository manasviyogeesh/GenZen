import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onSignUp }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await onLogin(email, password);
      } else {
        await onSignUp(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to continue right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0c0f] text-[#f5f1eb] flex items-center justify-center px-5 py-10 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-20 w-72 h-72 bg-purple-600/20 blur-3xl rounded-full" />
        <div className="absolute top-32 right-4 w-80 h-80 bg-cyan-500/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-24 left-1/3 w-72 h-72 bg-pink-500/15 blur-3xl rounded-full" />
      </div>

      <div className="w-full max-w-md glass-card rounded-3xl p-7 sm:p-9 border border-white/10 relative z-10">
        <div className="mb-6">
          <h1 className="font-headline text-5xl font-bold text-white tracking-tight">GENZEN</h1>
          <p className="text-white/80 mt-2 text-lg">Your campus, connected.</p>
          <p className="text-white/55 mt-1.5 text-sm leading-relaxed">
            Find your people. Discover opportunities. Make campus count.
          </p>
        </div>

        <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10 mb-5">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-sm rounded-lg font-semibold transition-colors ${
              mode === 'login' ? 'bg-[#c2652a] text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 text-sm rounded-lg font-semibold transition-colors ${
              mode === 'signup' ? 'bg-[#c2652a] text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
              College Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@college.edu"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#c2652a]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#c2652a]"
            />
          </div>

          {error && (
            <div className="text-sm text-rose-300 bg-rose-500/10 border border-rose-400/25 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#c2652a] hover:bg-[#b05721] disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-colors"
          >
            {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Log in →' : 'Create account →'}
          </button>

          <button
            type="button"
            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/90 font-semibold transition-colors"
          >
            Continue with College ID
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-white/65">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="block mx-auto mt-1 text-[#f0a878] hover:text-[#f7ba95] font-semibold"
          >
            {mode === 'login' ? 'Create your profile →' : 'Log in →'}
          </button>
        </div>
      </div>
    </div>
  );
};
