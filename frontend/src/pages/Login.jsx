import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, saveToken } from '../api';
import { COLORS } from './Shell';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = isSignup
        ? await api.signup(email, password, name)
        : await api.login(email, password);
      saveToken(data.token);
      navigate('/analyze');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ background: COLORS.bg, color: COLORS.text }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-8 rounded-lg"
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
      >
        <h1 className="text-lg font-semibold mb-6">
          {isSignup ? 'Create an account' : 'Sign in to Compass'}
        </h1>

        {isSignup && (
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mb-3 px-3 py-2 rounded-md text-sm bg-transparent outline-none"
            style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text }}
            required
          />
        )}
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded-md text-sm bg-transparent outline-none"
          style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text }}
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-3 py-2 rounded-md text-sm bg-transparent outline-none"
          style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text }}
          required
        />

        {error && (
          <p className="text-sm mb-3" style={{ color: COLORS.sell }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-md text-sm font-medium"
          style={{ background: COLORS.accent, color: '#fff' }}
        >
          {loading ? 'Please wait...' : isSignup ? 'Sign up' : 'Sign in'}
        </button>

        <button
          type="button"
          onClick={() => setIsSignup(!isSignup)}
          className="w-full mt-3 text-sm"
          style={{ color: COLORS.textMuted }}
        >
          {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </form>
    </div>
  );
}