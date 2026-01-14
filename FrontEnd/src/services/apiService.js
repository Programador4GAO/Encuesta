
const API_URL = 'http://localhost:8000/api'; // Ajusta esto si tu puerto cambia

export const authService = {
  // Función para cerrar sesión
  logout: async () => {
    try {
      // 1. Aquí podrías hacer una petición al backend si fuera necesario
      // await fetch(`${API_URL}/auth/logout`, { method: 'POST' });

      // 2. Limpiar almacenamiento local (tokens, usuario, etc.)
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.clear();

      // Simular un pequeño tiempo de espera para que se vea la animación
      return new Promise((resolve) => setTimeout(() => resolve(true), 800));
      
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      return false;
    }
  },

  // Función para obtener usuario actual (útil para el Login)
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  }
};