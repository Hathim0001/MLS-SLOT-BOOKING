import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, Link, useNavigate, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import BookingModal from './components/BookingModal';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BookingsPage from './pages/BookingsPage';
import { createBooking, updateBooking } from './api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  function showToast(message, type = 'success') {
    const toast = { id: Date.now(), message, type };
    setToasts((current) => [...current, toast]);
    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toast.id));
    }, 2200);
  }

  function openModal(booking = null) {
    setEditingBooking(booking);
    setModalOpen(true);
  }

  function closeModal() {
    setEditingBooking(null);
    setModalOpen(false);
  }

  async function handleSave(payload) {
    try {
      if (editingBooking) {
        await updateBooking(editingBooking.id, payload);
        showToast('Booking updated');
      } else {
        await createBooking(payload);
        showToast('Booking created');
      }
      closeModal();
      setRefreshCounter((value) => value + 1);
      if (location.pathname !== '/dashboard') {
        navigate('/dashboard');
      }
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  function handleLogout() {
    setToken('');
    navigate('/login');
  }

  return (
    <div className="min-h-screen text-slate-100">
      <header className="border-b border-cyan-400/20 bg-slate-950/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">Admin console</p>
            <h1 className="text-xl font-semibold text-white">Slot booking system</h1>
          </div>
          {token ? (
            <nav className="flex items-center gap-3 text-sm">
              <Link className="rounded-full border border-cyan-400/20 px-3 py-2 text-slate-200" to="/dashboard">Dashboard</Link>
              <Link className="rounded-full border border-cyan-400/20 px-3 py-2 text-slate-200" to="/bookings">Bookings</Link>
              <button onClick={handleLogout} className="rounded-full border border-rose-400/20 px-3 py-2 text-rose-200">Logout</button>
            </nav>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={setToken} />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage onOpenModal={openModal} onRefresh={refreshCounter} />} />
            <Route path="/bookings" element={<BookingsPage onEditBooking={openModal} onRefresh={refreshCounter} />} />
          </Route>
          <Route path="*" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </main>

      <BookingModal isOpen={modalOpen} booking={editingBooking} onClose={closeModal} onSaved={handleSave} />

      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className={`rounded-xl border px-4 py-3 text-sm ${toast.type === 'error' ? 'border-rose-400/40 bg-rose-500/10 text-rose-200' : 'border-cyan-400/30 bg-slate-900/90 text-slate-100'}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
