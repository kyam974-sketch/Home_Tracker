import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { TrainFront, Building2, UserRound, Sparkles, ShieldCheck, ShieldAlert, X, Pencil, Trash2, MessageCircleMore, Check } from 'lucide-react';

function Card({ children }) {
  return (
    <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #F0EDE6', boxShadow: '0 2px 12px rgba(43,42,51,0.04)' }}>
      {children}
    </div>
  );
}

function CredBadge({ level }) {
  if (!level) return null;
  const map = {
    alta: { icon: ShieldCheck, color: '#2E9E64', bg: '#E7F7EF', label: 'Credibilità alta' },
    media: { icon: ShieldAlert, color: '#C98A1F', bg: '#FBF1DD', label: 'Credibilità media' },
    bassa: { icon: ShieldAlert, color: '#D1454D', bg: '#FCE9EA', label: 'Credibilità bassa' },
  };
  const conf = map[level];
  if (!conf) return null;
  const { icon: Icon, color, bg, label } = conf;
  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: bg, color }}>
      <Icon size={13} strokeWidth={2.2} />
      <span className="text-[11px] font-mono font-medium">{label}</span>
    </div>
  );
}

const EMPTY_FORM = { titolo: '', prezzo: '', tipo_soggetto: 'privato', zona: '', testo_completo: '', url_originale: '', note_personali: '' };

export default function Ricerca() {
  const [listings, setListings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [pipelineIds, setPipelineIds] = useState(new Set());

  async function loadListings() {
    const { data: userData } = await supabase.auth.getUser();
    setUserId(userData?.user?.id || null);

    const { data } = await supabase
      .from('listings')
      .select('*, listing_analysis(*), listing_match(*)')
      .order('data_trovato', { ascending: false })
      .limit(50);
    setListings(data || []);

    const { data: pipelineRows } = await supabase
      .from('pipeline')
      .select('listing_id')
      .eq('profile_id', userData?.user?.id);
    setPipelineIds(new Set((pipelineRows || []).map((p) => p.listing_id)));
  }

  useEffect(() => {
    loadListings();
  }, []);

  function openNewForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(l) {
    setForm({
      titolo: l.titolo || '',
      prezzo: l.prezzo || '',
      tipo_soggetto: l.tipo_soggetto || 'privato',
      zona: l.zona || '',
      testo_completo: l.testo_completo || '',
      url_originale: l.url_originale || '',
      note_personali: l.note_personali || '',
    });
    setEditingId(l.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();

    const payload = {
      titolo: form.titolo,
      prezzo: form.prezzo ? Number(form.prezzo) : null,
      tipo_soggetto: form.tipo_soggetto,
      zona: form.zona,
      testo_completo: form.testo_completo,
      url_originale: form.url_originale,
      note_personali: form.note_personali,
    };

    if (editingId) {
      await supabase.from('listings').update(payload).eq('id', editingId);
      supabase.functions
        .invoke('analyze-listing', { body: { listing_id: editingId, profile_id: userData?.user?.id } })
        .then(() => loadListings())
        .catch(() => {});
    } else {
      const { data: inserted, error } = await supabase
        .from('listings')
        .insert({ ...payload, fonte: 'manuale', inserito_da: userData?.user?.id })
        .select()
        .single();
      if (!error && inserted) {
        supabase.functions
          .invoke('analyze-listing', { body: { listing_id: inserted.id, profile_id: userData?.user?.id } })
          .then(() => loadListings())
          .catch(() => {});
      }
    }

    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    loadListings();
  }

  async function handleDelete(id) {
    if (!window.confirm('Eliminare questo annuncio? Verranno rimossi anche analisi e dati collegati.')) return;
    await supabase.from('listings').delete().eq('id', id);
    loadListings();
  }

  async function handleContatta(listingId) {
    const { data: userData } = await supabase.auth.getUser();
    const alreadyIn = pipelineIds.has(listingId);

    if (alreadyIn) {
      // Toglie dalla pipeline (rimuove la candidatura)
      await supabase.from('pipeline').delete().eq('profile_id', userData?.user?.id).eq('listing_id', listingId);
    } else {
      await supabase.from('pipeline').upsert(
        {
          profile_id: userData?.user?.id,
          listing_id: listingId,
          contattato: true,
          data_contatto: new Date().toISOString().slice(0, 10),
          esito: 'In attesa',
        },
        { onConflict: 'profile_id,listing_id' }
      );
    }
    loadListings();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] mb-1.5 font-semibold font-mono" style={{ color: '#F2954B' }}>
            {listings.length} annunci trovati
          </p>
          <h1 className="font-display font-bold text-[26px]">Ricerca annunci</h1>
        </div>
        <button
          onClick={openNewForm}
          className="px-3.5 py-1.5 rounded-full flex items-center gap-1.5 font-semibold text-sm text-white"
          style={{ background: 'linear-gradient(90deg, #F2545B, #F2954B, #F2C14B, #4BAE7F, #4B8BF2, #8B5CF2)' }}
        >
          <Sparkles size={13} /> Aggiungi annuncio
        </button>
      </div>

      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-sm">{editingId ? 'Modifica annuncio' : 'Nuovo annuncio (manuale)'}</p>
            <button onClick={() => { setShowForm(false); setEditingId(null); }}><X size={16} style={{ color: '#9A97A3' }} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input required placeholder="Titolo annuncio" value={form.titolo} onChange={(e) => setForm({ ...form, titolo: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ border: '1px solid #F0EDE6', background: '#FAF7F0' }} />
            <div className="flex gap-3">
              <input type="number" placeholder="Prezzo €" value={form.prezzo} onChange={(e) => setForm({ ...form, prezzo: e.target.value })}
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ border: '1px solid #F0EDE6', background: '#FAF7F0' }} />
              <select value={form.tipo_soggetto} onChange={(e) => setForm({ ...form, tipo_soggetto: e.target.value })}
                className="px-3 py-2 rounded-xl text-sm outline-none" style={{ border: '1px solid #F0EDE6', background: '#FAF7F0' }}>
                <option value="privato">Privato</option>
                <option value="agenzia">Agenzia</option>
              </select>
            </div>
            <input placeholder="Zona" value={form.zona} onChange={(e) => setForm({ ...form, zona: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ border: '1px solid #F0EDE6', background: '#FAF7F0' }} />
            <input placeholder="Link originale (opzionale)" value={form.url_originale} onChange={(e) => setForm({ ...form, url_originale: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ border: '1px solid #F0EDE6', background: '#FAF7F0' }} />
            <textarea placeholder="Testo dell'annuncio (per l'analisi AI)" rows={3} value={form.testo_completo} onChange={(e) => setForm({ ...form, testo_completo: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none" style={{ border: '1px solid #F0EDE6', background: '#FAF7F0' }} />
            <textarea placeholder="Note personali (impressioni, dubbi, promemoria…)" rows={2} value={form.note_personali} onChange={(e) => setForm({ ...form, note_personali: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none" style={{ border: '1px solid #F0EDE6', background: '#FAF7F0' }} />
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-full text-sm font-semibold text-white" style={{ background: '#2B2A33' }}>
              {saving ? 'Salvataggio…' : editingId ? 'Salva modifiche' : 'Salva annuncio'}
            </button>
          </form>
        </Card>
      )}

      <div className="space-y-3 mt-4">
        {listings.length === 0 && !showForm && (
          <p className="text-sm" style={{ color: '#9A97A3' }}>Nessun annuncio ancora. Aggiungine uno per iniziare.</p>
        )}
        {listings.map((l) => {
          const analysis = Array.isArray(l.listing_analysis) ? l.listing_analysis[0] : l.listing_analysis;
          const match = Array.isArray(l.listing_match) ? l.listing_match[0] : l.listing_match;
          const isMine = l.inserito_da === userId;
          const inPipeline = pipelineIds.has(l.id);
          return (
            <Card key={l.id}>
              <div
                className="flex items-start justify-between gap-6 cursor-pointer"
                onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-[15px] font-semibold">{l.titolo}</h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium" style={{ background: '#F4F2FC', color: '#8B5CF2' }}>
                      {l.tipo_soggetto === 'agenzia' ? <Building2 size={11} /> : <UserRound size={11} />}
                      {l.tipo_soggetto === 'agenzia' ? 'Agenzia' : 'Privato'}
                    </span>
                  </div>
                  {l.prezzo && (
                    <p className="text-[18px] font-mono font-semibold mb-2" style={{ color: '#F2954B' }}>
                      {l.prezzo}€<span className="text-[12px] font-normal" style={{ color: '#B5B2BC' }}> /mese</span>
                    </p>
                  )}
                  {(analysis || match) && (
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {analysis && <CredBadge level={analysis.punteggio_credibilita} />}
                      {match && typeof match.punteggio_match === 'number' && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono font-medium" style={{ background: '#F4F2FC', color: '#8B5CF2' }}>
                          Match {match.punteggio_match}%
                        </span>
                      )}
                      {!analysis && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium" style={{ background: '#FAF7F0', color: '#B5B2BC' }}>
                          Analisi in corso…
                        </span>
                      )}
                    </div>
                  )}
                  {analysis?.flag_sospetti?.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {analysis.flag_sospetti.map((f) => (
                        <span key={f} className="text-[11px] px-2.5 py-0.5 rounded-full font-medium" style={{ background: '#FCE9EA', color: '#D1454D' }}>
                          ⚠ {f}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[12px]" style={{ color: '#9A97A3' }}>
                    {l.zona && (<><TrainFront size={13} style={{ color: '#4B8BF2' }} />{l.zona}<span style={{ color: '#E5E2DC' }}>·</span></>)}
                    <span>{l.fonte}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleContatta(l.id)}
                    title={inPipeline ? 'Rimuovi da Dashboard' : 'Segna come contattato'}
                    className="p-2 rounded-full"
                    style={{ background: inPipeline ? '#E7F7EF' : '#F4F2FC', color: inPipeline ? '#2E9E64' : '#8B5CF2' }}
                  >
                    {inPipeline ? <Check size={14} /> : <MessageCircleMore size={14} />}
                  </button>
                  {isMine && (
                    <>
                      <button onClick={() => openEditForm(l)} className="p-2 rounded-full" style={{ background: '#FAF7F0', color: '#9A97A3' }}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(l.id)} className="p-2 rounded-full" style={{ background: '#FCE9EA', color: '#D1454D' }}>
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {expandedId === l.id && (
                <div className="mt-4 pt-4 space-y-3 text-[13px]" style={{ borderTop: '1px solid #F0EDE6', color: '#4A4852' }}>
                  {l.testo_completo && (
                    <div>
                      <p className="text-[11px] uppercase font-mono font-semibold mb-1" style={{ color: '#9A97A3' }}>Testo annuncio</p>
                      <p>{l.testo_completo}</p>
                    </div>
                  )}
                  {l.url_originale && (
                    <div>
                      <p className="text-[11px] uppercase font-mono font-semibold mb-1" style={{ color: '#9A97A3' }}>Link</p>
                      <a href={l.url_originale} target="_blank" rel="noreferrer" className="underline break-all" style={{ color: '#4B8BF2' }}>{l.url_originale}</a>
                    </div>
                  )}
                  {analysis?.motivi_credibilita && (
                    <div>
                      <p className="text-[11px] uppercase font-mono font-semibold mb-1" style={{ color: '#9A97A3' }}>Perché questo giudizio di credibilità</p>
                      <p>{analysis.motivi_credibilita}</p>
                    </div>
                  )}
                  {match?.dettagli_match?.note && (
                    <div>
                      <p className="text-[11px] uppercase font-mono font-semibold mb-1" style={{ color: '#9A97A3' }}>Dettagli del match</p>
                      <p>{match.dettagli_match.note}</p>
                    </div>
                  )}
                  {l.note_personali && (
                    <div>
                      <p className="text-[11px] uppercase font-mono font-semibold mb-1" style={{ color: '#9A97A3' }}>Note personali</p>
                      <p>{l.note_personali}</p>
                    </div>
                  )}
                  {inPipeline && (
                    <p className="text-[12px] italic" style={{ color: '#8B5CF2' }}>
                      Presente in Dashboard candidature — vai lì per registrare risposta, appuntamento ed esito.
                    </p>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
