import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { GRADIENT } from '../lib/theme';
import { Home } from 'lucide-react';

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nome } },
        });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ background: '#FDFBF7' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: GRADIENT }}>
            <Home size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-xl" style={{ color: '#2B2A33' }}>
            Home<span style={{ color: '#F2954B' }}>Tracker</span>
          </span>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-4" style={{ border: '1px solid #F0EDE6' }}>
          <h1 className="font-display font-semibold text-lg text-center mb-2">
            {mode === 'login' ? 'Accedi' : 'Crea il tuo profilo'}
          </h1>

          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Il tuo nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #F0EDE6', background: '#FAF7F0' }}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ border: '1px solid #F0EDE6', background: '#FAF7F0' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ border: '1px solid #F0EDE6', background: '#FAF7F0' }}
          />

          {error && <p className="text-xs" style={{ color: '#D1454D' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-60"
            style={{ background: GRADIENT }}
          >
            {loading ? 'Un attimo…' : mode === 'login' ? 'Accedi' : 'Registrati'}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="w-full text-xs text-center"
            style={{ color: '#9A97A3' }}
          >
            {mode === 'login' ? 'Non hai un profilo? Registrati' : 'Hai già un profilo? Accedi'}
          </button>
        </form>
      </div>
    </div>
  );
}
