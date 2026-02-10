import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('Hathim22');
  const [password, setPassword] = useState('Mashathim@22');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      const response = await loginUser(username, password);
      localStorage.setItem('token', response.access_token);
      onLogin(response.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="glow-card w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Secure terminal access</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Slot booking admin</h1>
          <p className="mt-2 text-sm text-slate-400">Use the seeded admin credentials to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm text-slate-300">
            Username
            <input
              className="mt-2 w-full rounded-xl border border-cyan-400/20 bg-slate-900/70 px-3 py-3 text-white outline-none ring-0"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
          <label className="block text-sm text-slate-300">
            Password
            <input
              type="password"
              className="mt-2 w-full rounded-xl border border-cyan-400/20 bg-slate-900/70 px-3 py-3 text-white outline-none ring-0"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}

          <button type="submit" className="neon-accent w-full rounded-xl bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-violet-500 px-4 py-3 font-semibold text-white shadow-[0_0_18px_rgba(34,211,238,0.3)] transition hover:opacity-90">
            Enter dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
