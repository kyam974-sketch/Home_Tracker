import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { RAINBOW } from '../lib/theme';

function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl p-5 bg-white ${className}`} style={{ border: '1px solid #F0EDE6', boxShadow: '0 2px 12px rgba(43,42,51,0.04)' }}>
      {children}
    </div>
  );
}

const GIORNI = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
const MESI = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function Calendario({ session }) {
  const [appointments, setAppointments] = useState([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  async function load() {
    const { data } = await supabase
      .from('pipeline')
      .select('id, data_appuntamento, esito, listings(titolo, zona, prezzo)')
      .eq('profile_id', session.user.id)
      .not('data_appuntamento', 'is', null)
      .order('data_appuntamento', { ascending: true });
    setAppointments(
      (data || []).map((a) => ({ ...a, date: new Date(a.data_appuntamento) }))
    );
  }

  useEffect(() => {
    load();
  }, [session.user.id]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // lunedì = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const today = new Date();
  const now = new Date();
  const upcoming = appointments.filter((a) => a.date >= now);
  const past = appointments.filter((a) => a.date < now);

  const appointmentsForDay = (day) => appointments.filter((a) => day && sameDay(a.date, day));

  return (
    <div>
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.14em] mb-1.5 font-semibold font-mono" style={{ color: '#F2954B' }}>
          {upcoming.length} appuntamenti in arrivo
        </p>
        <h1 className="font-display font-bold text-[26px]">Calendario</h1>
      </div>

      <div className="grid grid-cols-3 gap-5 items-start">
        <div className="col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1.5 rounded-full" style={{ background: '#FAF7F0' }}>
                <ChevronLeft size={16} style={{ color: '#4A4852' }} />
              </button>
              <p className="font-display font-semibold text-[16px]">{MESI[month]} {year}</p>
              <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1.5 rounded-full" style={{ background: '#FAF7F0' }}>
                <ChevronRight size={16} style={{ color: '#4A4852' }} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {GIORNI.map((g, i) => (
                <div key={i} className="text-center text-[10.5px] font-mono font-semibold py-1" style={{ color: '#B5B2BC' }}>{g}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                const dayAppointments = appointmentsForDay(day);
                const isToday = day && sameDay(day, today);
                const isSelected = day && selectedDay && sameDay(day, selectedDay);
                return (
                  <button
                    key={i}
                    disabled={!day}
                    onClick={() => setSelectedDay(day)}
                    className="aspect-square rounded-lg flex flex-col items-center justify-center relative text-[13px]"
                    style={{
                      background: isSelected ? '#2B2A33' : isToday ? '#FAF7F0' : 'transparent',
                      color: isSelected ? '#fff' : day ? '#2B2A33' : 'transparent',
                      fontWeight: isToday ? 700 : 500,
                    }}
                  >
                    {day?.getDate()}
                    {dayAppointments.length > 0 && (
                      <span
                        className="absolute bottom-1 w-1.5 h-1.5 rounded-full"
                        style={{ background: isSelected ? '#fff' : RAINBOW[dayAppointments.length % RAINBOW.length] }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {selectedDay && (
            <Card className="mt-3">
              <p className="text-[12px] uppercase font-mono font-semibold mb-3" style={{ color: '#9A97A3' }}>
                {selectedDay.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              {appointmentsForDay(selectedDay).length === 0 ? (
                <p className="text-[13px]" style={{ color: '#B5B2BC' }}>Nessun appuntamento in questo giorno.</p>
              ) : (
                <div className="space-y-2">
                  {appointmentsForDay(selectedDay).map((a) => (
                    <div key={a.id} className="flex items-center gap-3 text-[13px]" style={{ color: '#4A4852' }}>
                      <Clock size={13} style={{ color: '#8B5CF2' }} />
                      {a.date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      <span className="font-medium">{a.listings?.titolo}</span>
                      {a.listings?.zona && <span style={{ color: '#B5B2BC' }}>· {a.listings.zona}</span>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-[11px] uppercase font-mono font-semibold" style={{ color: '#9A97A3' }}>Prossimi appuntamenti</p>
          {upcoming.length === 0 && (
            <p className="text-[13px]" style={{ color: '#B5B2BC' }}>Nessun appuntamento in programma.</p>
          )}
          {upcoming.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start gap-2">
                <CalendarIcon size={14} style={{ color: '#F2954B', marginTop: 2 }} />
                <div>
                  <p className="text-[13px] font-semibold">{a.listings?.titolo}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: '#9A97A3' }}>
                    {a.date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} · {a.date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {a.listings?.zona && (
                    <p className="text-[12px] flex items-center gap-1 mt-1" style={{ color: '#9A97A3' }}>
                      <MapPin size={11} /> {a.listings.zona}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {past.length > 0 && (
            <details className="mt-4">
              <summary className="text-[11px] uppercase font-mono font-semibold cursor-pointer" style={{ color: '#B5B2BC' }}>
                {past.length} appuntamenti passati
              </summary>
              <div className="space-y-2 mt-2">
                {past.slice().reverse().map((a) => (
                  <div key={a.id} className="text-[12px] px-3 py-2 rounded-xl" style={{ background: '#FAF7F0', color: '#9A97A3' }}>
                    {a.listings?.titolo} · {a.date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
