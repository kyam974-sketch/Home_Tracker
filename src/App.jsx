import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { RAINBOW, GRADIENT } from './lib/theme';
import Auth from './pages/Auth';
import Profilo from './pages/Profilo';
import Ricerca from './pages/Ricerca';
import Dashboard from './pages/Dashboard';
import { Home, User, LayoutGrid, KeyRound, LogOut } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ricerca');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return null;
  if (!session) return <Auth />;

  const navItems = [
    { key: 'profilo', label: 'Profilo', icon: User },
    { key: 'ricerca', label: 'Ricerca annunci', icon: KeyRound },
    { key: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  ];

  return (
    <div className="min-h-screen w-full flex font-sans" style={{ background: '#FDFBF7', color: '#2B2A33' }}>
      <aside className="w-56 flex-shrink-0 flex flex-col bg-white" style={{ borderRight: '1px solid #F0EDE6' }}>
        <div className="h-1.5 w-full" style={{ background: GRADIENT }} />
        <div className="px-6 py-6 border-b" style={{ borderColor: '#F0EDE6' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: GRADIENT }}>
              <Home size={15} color="#fff" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-[17px]">
              Home<span style={{ color: '#F2954B' }}>Tracker</span>
            </span>
          </div>
          <p className="text-[11px] mt-1.5" style={{ color: '#9A97A3' }}>Ricerca affitti</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ key, label, icon: Icon }, i) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-colors relative"
              style={{
                background: tab === key ? '#FAF7F0' : 'transparent',
                color: tab === key ? '#2B2A33' : '#9A97A3',
                fontWeight: tab === key ? 600 : 500,
              }}
            >
              {tab === key && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full" style={{ background: RAINBOW[i % RAINBOW.length] }} />
              )}
              <Icon size={16} style={{ color: tab === key ? RAINBOW[i % RAINBOW.length] : '#B5B2BC' }} />
              {label}
            </button>
          ))}
        </nav>
        <button
          onClick={() => supabase.auth.signOut()}
          className="mx-3 mb-4 flex items-center gap-2 px-3 py-2 rounded-xl text-[13px]"
          style={{ color: '#9A97A3' }}
        >
          <LogOut size={14} /> Esci
        </button>
      </aside>

      <main className="flex-1 px-10 py-8 overflow-y-auto">
        {tab === 'profilo' && <Profilo session={session} />}
        {tab === 'ricerca' && <Ricerca />}
        {tab === 'dashboard' && <Dashboard session={session} />}
      </main>
    </div>
  );
}
