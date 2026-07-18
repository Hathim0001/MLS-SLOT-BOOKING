import { useEffect, useMemo, useState } from 'react';
import { getAvailability } from '../api';

function formatHour(hour) {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

export default function DashboardPage({ onOpenModal, onRefresh }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [availability, setAvailability] = useState({ slots: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadAvailability() {
      setLoading(true);
      try {
        const data = await getAvailability(date);
        setAvailability(data);
      } finally {
        setLoading(false);
      }
    }

    loadAvailability();
  }, [date, onRefresh]);

  const hourlySummary = useMemo(() => {
    return Array.from({ length: 24 }, (_, hour) => {
      const slotGroup = availability.slots.slice(hour * 2, hour * 2 + 2);
      const isBooked = slotGroup.some((slot) => slot.is_booked);
      const bookedSlot = slotGroup.find((slot) => slot.is_booked);
      const payerName = bookedSlot ? bookedSlot.payer_name : null;
      return { hour, label: formatHour(hour), isBooked, payerName };
    });
  }, [availability.slots]);

  return (
    <div className="space-y-6">
      <div className="glow-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Live timeline</p>
            <h2 className="text-2xl font-semibold text-white">24-hour availability</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <input type="date" className="rounded-xl border border-cyan-400/20 bg-slate-900/70 px-3 py-2 text-white w-full sm:w-auto" value={date} onChange={(event) => setDate(event.target.value)} />
            <button onClick={() => onOpenModal(null)} className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 font-semibold text-white w-full sm:w-auto text-center">
              + New booking
            </button>
          </div>
        </div>
      </div>

      <div className="glow-card p-6">
        <p className="mb-3 text-sm uppercase tracking-[0.3em] text-slate-400">Slot overview</p>
        {loading ? <p className="text-slate-400">Loading availability…</p> : null}
        <div className="space-y-3">
          {hourlySummary.map((entry) => (
            <div key={entry.hour} className="flex items-center gap-2 sm:gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-2 sm:p-3">
              <div className="w-16 sm:w-20 text-xs sm:text-sm font-medium text-slate-300">{entry.label}</div>
              <div className={`flex-1 rounded-xl border px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm truncate ${entry.isBooked ? 'border-rose-300 bg-rose-100 text-rose-950 font-medium' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'}`} title={entry.isBooked ? (entry.payerName ? `Booked by ${entry.payerName}` : 'Booked') : 'Open'}>
                {entry.isBooked ? (entry.payerName ? `Booked by ${entry.payerName}` : 'Booked') : 'Open window'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
