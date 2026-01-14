import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = '/api';

const LogoutDesign = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Guardando tu evaluación...');

  useEffect(() => {
    // Animar la barra de progreso
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        
        // Cambiar mensaje a mitad del progreso
        if (prevProgress === 50) {
          setMessage('Cerrando sesión...');
        }
        
        return prevProgress + 2; // Incrementar 2% cada 60ms = 3 segundos total
      });
    }, 60);

    return () => clearInterval(interval);
  }, []);

  // Cuando el progreso llega a 100, ejecutar logout
  useEffect(() => {
    if (progress === 100) {
      handleLogout();
    }
  }, [progress]);

  const handleLogout = async () => {
    try {
      // Llamar al endpoint de logout del backend
      await fetch(`${API_URL}/auth/logout/`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      // Limpiar localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      // Pequeña pausa antes de redirigir
      setTimeout(() => {
        // Redirigir al login (inicio)
        navigate('/login', { replace: true });
      }, 500);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-200 overflow-hidden">
      <div className="bg-white rounded-3xl shadow-2xl p-12 md:p-16 w-full max-w-2xl mx-4">
        
        {/* Icono de éxito */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Título */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#003366] text-center mb-4">
          ¡Gracias por tu evaluación!
        </h1>

        {/* Subtítulo */}
        <p className="text-center text-gray-600 text-lg mb-8">
          Tu opinión es muy valiosa para nosotros
        </p>

        {/* Mensaje dinámico */}
        <p className="text-center text-[#003366] font-semibold text-xl mb-6">
          {message}
        </p>

        {/* Barra de progreso */}
        <div className="mb-8">
          <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-[#003366] to-[#0066cc] h-full rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* Efecto de brillo en la barra */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
            </div>
          </div>
          
          {/* Porcentaje */}
          <div className="text-center mt-3 text-[#003366] font-semibold text-lg">
            {progress}%
          </div>
        </div>

        {/* Mensaje informativo */}
        <p className="text-center text-gray-500 text-sm leading-relaxed">
          No es necesario cerrar la ventana.<br />
          Serás redirigido automáticamente al inicio.
        </p>

        {/* Spinner */}
        <div className="flex justify-center mt-8">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#003366] border-t-transparent"></div>
        </div>

      </div>
    </div>
  );
};

export default LogoutDesign;