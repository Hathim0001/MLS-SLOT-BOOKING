const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';


async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const token = localStorage.getItem('token');
  const config = {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, config);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.detail || 'Request failed');
  }
  return data;
}

export function loginUser(username, password) {
  return request('/api/auth/login', { method: 'POST', body: { username, password } });
}

export function getBookings(dateFrom = null, dateTo = null) {
  const query = [];
  if (dateFrom) query.push(`date_from=${dateFrom}`);
  if (dateTo) query.push(`date_to=${dateTo}`);
  const suffix = query.length ? `?${query.join('&')}` : '';
  return request(`/api/bookings${suffix}`);
}

export function getAvailability(date) {
  return request(`/api/availability?date=${date}`);
}

export function createBooking(payload) {
  return request('/api/bookings', { method: 'POST', body: payload });
}

export function updateBooking(id, payload) {
  return request(`/api/bookings/${id}`, { method: 'PUT', body: payload });
}

export function deleteBooking(id) {
  return request(`/api/bookings/${id}`, { method: 'DELETE' });
}
