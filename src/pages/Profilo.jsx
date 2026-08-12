import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Mail } from 'lucide-react';

function Card({ children }) {
  return (
    <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #F0EDE6', boxShadow: '0 2px 12px rgba(43,42,51,0.04)' }}>
      {children}
    </div>
  );
}

const TIPI_ALLOGGIO = ['monolocale', 'bilocale', 'stanza'];

export default function Profilo({ session }) {
  const [needs, setNeeds] = useState({
    budget_min: '',
    budget_max: '',
    spese_incluse: false,
    tipo_alloggio: 'bilocale',
    arredato: false,
    animali: false,
    piano_min: '',
    zone_preferite: '',
    altri_requisiti: '',
  });
  const [status, setStatus] = useState('idle'); // idle | saving | saved

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('housing_needs')
        .select('*')
        .eq('profile_id', session.user.id)
        .maybeSingle();
      if (data) {
        setNeeds({
          ...data,
          zone_preferite: (data.zone_preferite || []).join(', '),
        });
      }
    }
    load();
  }, [session.user.id]);

  async function handleSave(e) {
    e.preventDefault();
    setStatus('saving');
    const payload = {
      profile_id: session.user.id,
      budget_min: needs.budget_min ? Number(needs.budget_min) : null,
      budget_max: needs.budget_max ? Number(needs.budget_max) : null,
      spese_incluse: needs.spese_incluse,
      tipo_alloggio: needs.tipo_alloggio,
      arredato: needs.arredato,
      animali: needs.animali,
      piano_min: needs.piano_min ? Number(needs.piano_min) : null,
      zone_preferite: needs.zone_preferite
        ? needs.zone_preferite.split(',').map((z) => z.trim()).filter(Boolean)
        : [],
      altri_requisiti: needs.altri_requisiti,
      aggiornato_il: new Date().toISOString(),
    };
    await supabase.from('housing_needs').upsert(payload, { onConflict: 'profile_id' });
    setStatus('saved');
    setTimeout(() => setStatus('idle'), 1500);
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.14em] mb-1.5 font-semibold font-mono" style={{ color: '#F2954B' }}>
          La tua chiave d'accesso
        </p>
        <h1 className="font-display font-bold text-[26px]">Profilo e esigenze</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <Card>
          <p className="text-[12px] uppercase tracking-wide mb-3 font-semibold font-mono" style={{ color: '#9A97A3' }}>Budget mensile (€)</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="min"
              value={needs.budget_min || ''}
              onChange={(e) => setNeeds({ ...needs, budget_min: e.target.value })}
              className="w-24 px-3 py-2 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #F0EDE6', background: '#FAF7F0' }}
            />
            <span style={{ color: '#B5B2BC' }}>—</span>
            <input
              type="number"
              placeholder="max"
              value={needs.budget_max || ''}
              onChange={(e) => setNeeds({ ...needs, budget_max: e.target.value })}
              className="w-24 px-3 py-2 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #F0EDE6', background: '#FAF7F0' }}
            />
            <label className="flex items-center gap-2 text-sm ml-3" style={{ color: '#4A4852' }}>
              <input
                type="checkbox"
                checked={needs.spese_incluse}
                onChange={(e) => setNeeds({ ...needs, spese_incluse: e.target.checked })}
              />
              Spese incluse preferite
            </label>
          </div>
        </Card>

        <Card>
          <p className="text-[12px] uppercase tracking-wide mb-3 font-semibold font-mono" style={{ color: '#9A97A3' }}>Esigenze abitative</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <label className="flex flex-col gap-1" style={{ color: '#4A4852' }}>
              Tipo alloggio
              <select
                value={needs.tipo_alloggio}
                onChange={(e) => setNeeds({ ...needs, tipo_alloggio: e.target.value })}
                className="px-3 py-2 rounded-xl outline-none"
                style={{ border: '1px solid #F0EDE6', background: '#FAF7F0' }}
              >
                {TIPI_ALLOGGIO.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1" style={{ color: '#4A4852' }}>
              Piano minimo
              <input
                type="number"
                value={needs.piano_min || ''}
                onChange={(e) => setNeeds({ ...needs, piano_min: e.target.value })}
                className="px-3 py-2 rounded-xl outline-none"
                style={{ border: '1px solid #F0EDE6', background: '#FAF7F0' }}
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={needs.arredato}
                onChange={(e) => setNeeds({ ...needs, arredato: e.target.checked })}
              />
              Arredato
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={needs.animali}
                onChange={(e) => setNeeds({ ...needs, animali: e.target.checked })}
              />
              Animali ammessi
            </label>
          </div>
          <label className="flex flex-col gap-1 mt-4 text-sm" style={{ color: '#4A4852' }}>
            Zone preferite (separate da virgola)
            <input
              type="text"
              placeholder="es. Isola, NoLo, zona M2"
              value={needs.zone_preferite}
              onChange={(e) => setNeeds({ ...needs, zone_preferite: e.target.value })}
              className="px-3 py-2 rounded-xl outline-none"
              style={{ border: '1px solid #F0EDE6', background: '#FAF7F0' }}
            />
          </label>
          <label className="flex flex-col gap-1 mt-4 text-sm" style={{ color: '#4A4852' }}>
            Altri requisiti
            <textarea
              rows={2}
              value={needs.altri_requisiti || ''}
              onChange={(e) => setNeeds({ ...needs, altri_requisiti: e.target.value })}
              className="px-3 py-2 rounded-xl outline-none resize-none"
              style={{ border: '1px solid #F0EDE6', background: '#FAF7F0' }}
            />
          </label>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-[12px] uppercase tracking-wide font-semibold font-mono" style={{ color: '#9A97A3' }}>Collegamento email</p>
            <span className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={{ background: '#FBF1DD', color: '#C98A1F' }}>Non ancora connessa</span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-[13px]" style={{ color: '#4A4852' }}>
            <Mail size={14} style={{ color: '#4B8BF2' }} />
            Il collegamento email arriverà in un prossimo step
          </div>
        </Card>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-full font-semibold text-sm text-white"
          style={{ background: '#2B2A33' }}
        >
          {status === 'saving' ? 'Salvataggio…' : status === 'saved' ? 'Salvato ✓' : 'Salva profilo'}
        </button>
      </form>
    </div>
  );
}
