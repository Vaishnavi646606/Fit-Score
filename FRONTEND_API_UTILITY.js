// Frontend API utility for authenticated requests
// src/utils/apiClient.js

const API_BASE_URL = 'http://localhost:5000';

export async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return null;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Usage examples:
// 
// GET request:
// apiCall('/auth/me')
//
// POST request:
// apiCall('/analyze', {
//   method: 'POST',
//   body: JSON.stringify({ data: 'value' })
// })
//
// Protected route (requires token):
// apiCall('/api/protected-endpoint')
