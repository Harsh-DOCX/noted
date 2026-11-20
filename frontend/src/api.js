const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function apiRequest(path, { token, responseType = 'json', ...options } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const result = await response.json();
    const error = new Error(result.message || 'The request could not be completed.');
    error.status = response.status;
    throw error;
  }

  return responseType === 'blob' ? response.blob() : response.json();
}
