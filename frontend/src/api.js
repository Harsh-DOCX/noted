const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function apiRequest(path, { token, ...options } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const result = await response.json();

  if (!response.ok) {
    const error = new Error(result.message || 'The request could not be completed.');
    error.status = response.status;
    throw error;
  }

  return result;
}
