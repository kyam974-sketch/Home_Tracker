import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle2, XCircle, Clock, Calendar, Trash2, ChevronDown } from 'lucide-react';

const ESITI = ['Da valutare', 'In attesa', 'In corso', 'Concluso'];
const CANALI = ['Email', 'WhatsApp', 'Telefono', 'App'];

function Card({ children }) {
  return (
    <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #F0EDE6', boxShadow: '0 2px 12px rgba(43,42,51,0.04)' }}>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-[13px]" style={{ color: '#4A4852' }}>
      <span className="text-[10.5px] uppercase font-mono font-semibold" style={{ color: '#9A97A3' }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = { border: '1px solid #F0EDE6', background: '#FAF7F0' };

export default function Dashboard({ session }) {
  const [rows, setRows] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  async function load() {
    const { data } = await supabase
      .from('pipeline')
      .select('*, listings(titolo, prezzo, zona)')
      .eq('profile_id', session.user.id)
      .order('aggiornato_il', { ascending: false });
    setRows(data || []);
  }

  useEffect(() => {
    load();
  }, [session.user.id]);

  async function updateRow(id, fields) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...fields } : r)));
    await supabase.from('pipeline').update({ ...fields, aggiornato_il: new Date().toISOString() }).eq('id', id);
  }

  async function deleteRow(id) {
    if (!window.confirm('Rimuovere questa candidatura dalla dashboard?')) return;
    await supabase.from('pipeline').delete().eq('id', id);
    load();
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
          Le righe si aggiungono quando premi "Contatta" su un annuncio nella sezione Ricerca.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const isOpen = expandedId === row.id;
            return (
              <Card key={row.id}>
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isOpen ? null : row.id)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[15px] font-semibold">{row.listings?.titolo || 'Annuncio'}</h3>
                      <span
                        className="text-[11px] px-2.5 py-0.5 rounded-full font-medium"
                        style={{
                          background: row.esito === 'In corso' ? '#E7F7EF' : row.esito === 'In attesa' ? '#FBF1DD' : row.esito === 'Concluso' ? '#F4F2FC' : '#FAF7F0',
                          color: row.esito === 'In corso' ? '#2E9E64' : row.esito === 'In attesa' ? '#C98A1F' : row.esito === 'Concluso' ? '#8B5CF2' : '#9A97A3',
                        }}
                      >
                        {row.esito || 'Da valutare'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[12px]" style={{ color: '#9A97A3' }}>
                      {row.listings?.prezzo && <span className="font-mono">{row.listings.prezzo}€/mese</span>}
                      {row.listings?.zona && <span>{row.listings.zona}</span>}
                      {row.contattato && row.data_contatto && (
                        <span className="flex items-center gap-1" style={{ color: '#2E9E64' }}>
                          <CheckCircle2 size={12} /> Contattato il {new Date(row.data_contatto).toLocaleDateString('it-IT')}
                        </span>
                      )}
                      {row.contratto_firmato && (
                        <span className="flex items-center gap-1 font-semibold" style={{ color: '#2E9E64' }}>Contratto firmato</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); deleteRow(row.id); }} className="p-2 rounded-full" style={{ background: '#FCE9EA', color: '#D1454D' }}>
                      <Trash2 size={13} />
                    </button>
                    <ChevronDown size={16} style={{ color: '#B5B2BC', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 pt-4 grid grid-cols-2 gap-4" style={{ borderTop: '1px solid #F0EDE6' }}>
                    <Field label="Contattato">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateRow(row.id, { contattato: !row.contattato, data_contatto: !row.contattato ? new Date().toISOString().slice(0, 10) : row.data_contatto })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                          style={{ ...inputStyle, color: row.contattato ? '#2E9E64' : '#9A97A3' }}
                        >
                          {row.contattato ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                          {row.contattato ? 'Sì' : 'No'}
                        </button>
                      </div>
                    </Field>

                    <Field label="Quando l'hai contattato">
                      <input
                        type="date"
                        defaultValue={row.data_contatto || ''}
                        onBlur={(e) => updateRow(row.id, { data_contatto: e.target.value || null })}
                        className="px-3 py-2 rounded-xl outline-none" style={inputStyle}
                      />
                    </Field>

                    <Field label="Come l'hai contattato">
                      <select
                        value={row.canale || ''}
                        onChange={(e) => updateRow(row.id, { canale: e.target.value })}
                        className="px-3 py-2 rounded-xl outline-none" style={inputStyle}
                      >
                        <option value="">—</option>
                        {CANALI.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>

                    <Field label="Hanno risposto?">
                      <input
                        type="text"
                        placeholder="es. Sì, dopo 2 giorni / Ancora nessuna risposta"
                        defaultValue={row.risposta_ricevuta || ''}
                        onBlur={(e) => updateRow(row.id, { risposta_ricevuta: e.target.value })}
                        className="px-3 py-2 rounded-xl outline-none" style={inputStyle}
                      />
                    </Field>

                    <Field label="Come ti è sembrato/a">
                      <textarea
                        rows={2}
                        placeholder="Impressioni sulla persona/agenzia, disponibilità, chiarezza…"
                        defaultValue={row.impressione_note || ''}
                        onBlur={(e) => updateRow(row.id, { impressione_note: e.target.value })}
                        className="px-3 py-2 rounded-xl outline-none resize-none" style={inputStyle}
                      />
                    </Field>

                    <Field label="Appuntamento">
                      <input
                        type="datetime-local"
                        defaultValue={row.data_appuntamento ? row.data_appuntamento.slice(0, 16) : ''}
                        onBlur={(e) => updateRow(row.id, { data_appuntamento: e.target.value || null })}
                        className="px-3 py-2 rounded-xl outline-none" style={inputStyle}
                      />
                    </Field>

                    <Field label="Esito">
                      <select
                        value={row.esito || 'Da valutare'}
                        onChange={(e) => updateRow(row.id, { esito: e.target.value })}
                        className="px-3 py-2 rounded-xl outline-none" style={inputStyle}
                      >
                        {ESITI.map((e) => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </Field>

                    <Field label="Contratto firmato">
                      <button
                        onClick={() => updateRow(row.id, { contratto_firmato: !row.contratto_firmato })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl w-fit"
                        style={{ ...inputStyle, color: row.contratto_firmato ? '#2E9E64' : '#9A97A3' }}
                      >
                        {row.contratto_firmato ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                        {row.contratto_firmato ? 'Sì' : 'Non ancora'}
                      </button>
                    </Field>

                    <div className="col-span-2">
                      <Field label="Note generali">
                        <textarea
                          rows={2}
                          placeholder="Qualunque altra cosa da ricordare su questa candidatura…"
                          defaultValue={row.note || ''}
                          onBlur={(e) => updateRow(row.id, { note: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl outline-none resize-none" style={inputStyle}
                        />
                      </Field>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
