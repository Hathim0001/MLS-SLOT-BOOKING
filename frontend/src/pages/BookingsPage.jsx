import { useEffect, useMemo, useState } from 'react';
import { deleteBooking, getBookings } from '../api';

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hourStr, minuteStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr.padStart(2, '0');
  if (hour === 0) return `12:${minute} AM`;
  if (hour === 12) return `12:${minute} PM`;
  return hour < 12 ? `${hour}:${minute} AM` : `${hour - 12}:${minute} PM`;
}

export default function BookingsPage({ onEditBooking, onRefresh }) {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('booking_date');

  useEffect(() => {
    async function loadBookings() {
      const data = await getBookings();
      setBookings(data);
    }

    loadBookings();
  }, [onRefresh]);

  const visibleBookings = useMemo(() => {
    const query = search.toLowerCase();
    const filtered = bookings.filter((booking) => {
      return [booking.payer_name, booking.payer_number, booking.payment_status].some((value) => String(value || '').toLowerCase().includes(query));
    });

    return filtered.sort((left, right) => {
      const leftValue = left[sortKey];
      const rightValue = right[sortKey];
      if (leftValue < rightValue) return -1;
      if (leftValue > rightValue) return 1;
      return 0;
    });
  }, [bookings, search, sortKey]);

  async function handleDelete(id) {
    if (!window.confirm('Delete this booking?')) {
      return;
    }
    await deleteBooking(id);
    setBookings((current) => current.filter((booking) => booking.id !== id));
  }

  return (
    <div className="glow-card p-4 sm:p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Bookings list</p>
          <h2 className="text-2xl font-semibold text-white">All reservations</h2>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <input className="rounded-xl border border-cyan-400/20 bg-slate-900/70 px-3 py-2 text-white w-full sm:w-auto" placeholder="Search by payer" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select className="rounded-xl border border-cyan-400/20 bg-slate-900/70 px-3 py-2 text-white w-full sm:w-auto" value={sortKey} onChange={(event) => setSortKey(event.target.value)}>
            <option value="booking_date">Date</option>
            <option value="payer_name">Payer</option>
            <option value="payment_status">Payment</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="border-b border-slate-800 px-3 py-3">Date</th>
              <th className="border-b border-slate-800 px-3 py-3">Time</th>
              <th className="border-b border-slate-800 px-3 py-3">Payer</th>
              <th className="border-b border-slate-800 px-3 py-3">Payment</th>
              <th className="border-b border-slate-800 px-3 py-3">Amount</th>
              <th className="border-b border-slate-800 px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleBookings.map((booking) => (
              <tr key={booking.id} className="border-b border-slate-900/70 text-slate-200">
                <td className="px-3 py-3">{booking.booking_date}</td>
                <td className="px-3 py-3">{formatTime(booking.start_time)} → {formatTime(booking.end_time)}</td>
                <td className="px-3 py-3">{booking.payer_name}</td>
                <td className="px-3 py-3">{booking.payment_status}</td>
                <td className="px-3 py-3">{booking.amount_paid}</td>
                <td className="px-3 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => onEditBooking(booking)} className="rounded-lg border border-cyan-400/30 px-3 py-1 text-cyan-200">Edit</button>
                    <button onClick={() => handleDelete(booking.id)} className="rounded-lg border border-rose-400/30 px-3 py-1 text-rose-200">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
