import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle2, XCircle, Clock, Calendar } from 'lucide-react';

const ESITI = ['Da valutare', 'In attesa', 'In corso', 'Concluso'];
const CANALI = ['Email', 'WhatsApp', 'Telefono', 'App'];

export default function Dashboard({ session }) {
  const [rows, setRows] = useState([]);

  async function load() {
    const { data } = await supabase
      .from('pipeline')
      .select('*, listings(titolo)')
      .eq('profile_id', session.user.id)
      .order('aggiornato_il', { ascending: false });
    setRows(data || []);
  }

  useEffect(() => {
    load();
  }, [session.user.id]);

  async function updateRow(id, field, value) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    await supabase.from('pipeline').update({ [field]: value, aggiornato_il: new Date().toISOString() }).eq('id', id);
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.14em] mb-1.5 font-semibold font-mono" style={{ color: '#F2954B' }}>
          Percorso di ogni annuncio
        </p>
        <h1 className="font-display font-bold text-[26px]">Dashboard candidature</h1>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm" style={{ color: '#9A97A3' }}>
          Le righe si aggiungono automaticamente quando contatti un annuncio dalla sezione Ricerca.
        </p>
      ) : (
        <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid #F0EDE6' }}>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr style={{ background: '#FAF7F0' }}>
                {['Annuncio', 'Contattato', 'Canale', 'Appuntamento', 'Esito', 'Contratto', 'Note'].map((c) => (
                  <th key={c} className="text-left px-4 py-3 font-semibold uppercase tracking-wide text-[10.5px] font-mono" style={{ color: '#9A97A3' }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} style={{ borderTop: '1px solid #F0EDE6' }}>
                  <td className="px-4 py-3 font-medium">{row.listings?.titolo || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => updateRow(row.id, 'contattato', !row.contattato)}>
                      {row.contattato ? (
                        <span className="flex items-center gap-1" style={{ color: '#2E9E64' }}><CheckCircle2 size={13} /> Sì</span>
                      ) : (
                        <span className="flex items-center gap-1" style={{ color: '#B5B2BC' }}><XCircle size={13} /> No</span>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={row.canale || ''}
                      onChange={(e) => updateRow(row.id, 'canale', e.target.value)}
                      className="text-[12px] rounded-lg px-2 py-1 outline-none"
                      style={{ border: '1px solid #F0EDE6', background: '#FAF7F0' }}
                    >
                      <option value="">—</option>
                      {CANALI.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3" style={{ color: '#F2954B' }}>
                    {row.data_appuntamento ? (
                      <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(row.data_appuntamento).toLocaleDateString('it-IT')}</span>
                    ) : <span style={{ color: '#B5B2BC' }}>—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={row.esito || 'Da valutare'}
                      onChange={(e) => updateRow(row.id, 'esito', e.target.value)}
                      className="text-[11px] rounded-full px-2.5 py-0.5 font-medium outline-none"
                      style={{ background: '#F4F2FC', color: '#8B5CF2', border: 'none' }}
                    >
                      {ESITI.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => updateRow(row.id, 'contratto_firmato', !row.contratto_firmato)}>
                      {row.contratto_firmato ? <CheckCircle2 size={14} style={{ color: '#2E9E64' }} /> : <Clock size={14} style={{ color: '#B5B2BC' }} />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      defaultValue={row.note || ''}
                      onBlur={(e) => updateRow(row.id, 'note', e.target.value)}
                      className="text-[12px] px-2 py-1 rounded-lg outline-none w-32"
                      style={{ border: '1px solid #F0EDE6', background: '#FAF7F0' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
