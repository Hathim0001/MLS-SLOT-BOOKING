import { useEffect, useState } from 'react';

function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const [hourStr, minuteStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr.padStart(2, '0');
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${ampm}`;
}

const timeOptions = [];
for (let h = 0; h < 24; h++) {
  for (let m of ['00', '30']) {
    const hh = String(h).padStart(2, '0');
    const val = `${hh}:${m}`;
    timeOptions.push({
      value: val,
      label: formatTime12h(val),
    });
  }
}

const emptyBooking = {
  booking_date: new Date().toISOString().slice(0, 10),
  start_time: '09:00',
  duration_hours: '1',
  payment_status: 'not_paid',
  amount_paid: '0',
  payment_method: 'cash',
  payer_name: '',
  payer_number: '',
};

export default function BookingModal({ isOpen, booking, onClose, onSaved }) {
  const [form, setForm] = useState(emptyBooking);

  useEffect(() => {
    if (booking) {
      setForm({
        booking_date: booking.booking_date,
        start_time: booking.start_time.slice(0, 5),
        duration_hours: String(booking.duration_hours),
        payment_status: booking.payment_status,
        amount_paid: String(booking.amount_paid || 0),
        payment_method: booking.payment_method || 'cash',
        payer_name: booking.payer_name,
        payer_number: booking.payer_number,
      });
    } else {
      setForm(emptyBooking);
    }
  }, [booking, isOpen]);

  if (!isOpen) {
    return null;
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = {
      ...form,
      duration_hours: Number(form.duration_hours),
      amount_paid: Number(form.amount_paid),
    };
    await onSaved(payload);
  }

  const finalOptions = [...timeOptions];
  if (form.start_time && !timeOptions.some((opt) => opt.value === form.start_time)) {
    finalOptions.push({
      value: form.start_time,
      label: formatTime12h(form.start_time),
    });
    finalOptions.sort((a, b) => a.value.localeCompare(b.value));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
      <div className="glow-card w-full max-w-2xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <div className="mb-5 flex items-center justify-between shrink-0">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Booking editor</p>
            <h2 className="text-xl font-semibold text-white">{booking ? 'Edit booking' : 'Create booking'}</h2>
          </div>
          <button onClick={onClose} className="rounded-full border border-slate-600 px-3 py-1 text-sm text-slate-300">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-1 grid gap-4 md:grid-cols-2 mb-4">
            <label className="block text-sm text-slate-300">
              Date
              <input type="date" className="mt-2 w-full rounded-xl border border-cyan-400/20 bg-slate-900/70 px-3 py-3 text-white" value={form.booking_date} onChange={(event) => updateField('booking_date', event.target.value)} required />
            </label>
            <label className="block text-sm text-slate-300">
              Start time
              <select className="mt-2 w-full rounded-xl border border-cyan-400/20 bg-slate-900/70 px-3 py-3 text-white" value={form.start_time} onChange={(event) => updateField('start_time', event.target.value)} required>
                {finalOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Duration (hours)
              <select className="mt-2 w-full rounded-xl border border-cyan-400/20 bg-slate-900/70 px-3 py-3 text-white" value={form.duration_hours} onChange={(event) => updateField('duration_hours', event.target.value)}>
                {Array.from({ length: 48 }, (_, index) => (index + 1) / 2).map((value) => (
                  <option key={value} value={value}>{value % 1 === 0 ? `${value} hr${value > 1 ? 's' : ''}` : `${value} hrs`}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Payment status
              <select className="mt-2 w-full rounded-xl border border-cyan-400/20 bg-slate-900/70 px-3 py-3 text-white" value={form.payment_status} onChange={(event) => updateField('payment_status', event.target.value)}>
                <option value="not_paid">Not paid</option>
                <option value="advance_paid">Advance paid</option>
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Payer name
              <input className="mt-2 w-full rounded-xl border border-cyan-400/20 bg-slate-900/70 px-3 py-3 text-white" value={form.payer_name} onChange={(event) => updateField('payer_name', event.target.value)} required />
            </label>
            <label className="block text-sm text-slate-300">
              Payer phone
              <input className="mt-2 w-full rounded-xl border border-cyan-400/20 bg-slate-900/70 px-3 py-3 text-white" value={form.payer_number} onChange={(event) => updateField('payer_number', event.target.value)} required />
            </label>

            {form.payment_status === 'advance_paid' ? (
              <label className="block text-sm text-slate-300 md:col-span-2">
                Amount paid
                <input type="number" min="0" step="0.01" className="mt-2 w-full rounded-xl border border-cyan-400/20 bg-slate-900/70 px-3 py-3 text-white" value={form.amount_paid} onChange={(event) => updateField('amount_paid', event.target.value)} required />
              </label>
            ) : null}

            <div className="md:col-span-2">
              <p className="mb-2 text-sm text-slate-300">Payment method</p>
              <div className="flex flex-wrap gap-3">
                {[
                  ['gpay_number', 'GPay Number'],
                  ['gpay_business', 'GPay Business'],
                  ['cash', 'Cash'],
                ].map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-slate-900/70 px-3 py-2 text-sm text-slate-200">
                    <input type="radio" name="payment_method" value={value} checked={form.payment_method === value} onChange={(event) => updateField('payment_method', event.target.value)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800 shrink-0">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300">Cancel</button>
            <button type="submit" className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 font-semibold text-white">
              Save booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
