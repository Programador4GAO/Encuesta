/**
 * authService.js - Servicio de autenticación
 * Ubicación: EncuestaMensual/src/services/authService.js
 */

const API_URL = 'http://localhost:8000/api';

export const getCurrentUser = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/current-user/`, { credentials: 'include' });
    return await response.json();
  } catch (error) {
    return { success: false, detected: false };
  }
};

export const login = async (username, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: 'Error de conexión' };
  }
};

export const getMe = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/me/`, { credentials: 'include' });
    return await response.json();
  } catch (error) {
    return { success: false, authenticated: false };
  }
};

export const logout = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/logout/`, {
      method: 'POST',
      credentials: 'include'
    });
    return await response.json();
  } catch (error) {
    return { success: false };
  }
};

export default { getCurrentUser, login, getMe, logout };
