import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = '/api';

const COLORS = {
  primary: '#003781',
  primaryDark: '#00245D',
  primaryHover: '#022859',
  background: '#f5f8fc',
  textMain: '#374151',
  textTitle: '#1f2937',
  success: '#023373',
  error: '#dc2626',
  info: '#021223',
  shadow: '#bec3c9',
  border: '#e5e7eb',
  nivel1: '#0070C1',
  nivel2: '#6366f1',
  nivel3: '#059669'
};

const ModoSubdirectivo = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [activeView, setActiveView] = useState('home');
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    departamento_nombre: '',
    mes: '',
    anio: '',
    total_empleados: 0,
    respondieron: 0,
    pendientes: 0,
    promedio_q1: 0,
    promedio_q2: 0,
    promedio_q3: 0,
    promedio_general: 0,
    nivel_1: { nombre: 'Empleados', total: 0, respondieron: 0, pendientes: 0, promedio_q1: 0, promedio_q2: 0, promedio_q3: 0, promedio_general: 0 },
    nivel_2: { nombre: 'Supervisores', total: 0, respondieron: 0, pendientes: 0, promedio_q1: 0, promedio_q2: 0, promedio_q3: 0, promedio_general: 0 },
    nivel_3: { nombre: 'Gerentes', total: 0, respondieron: 0, pendientes: 0, promedio_q1: 0, promedio_q2: 0, promedio_q3: 0, promedio_general: 0 },
    usuarios_respondieron: [],
    usuarios_pendientes: []
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    
    if (!storedUser) {
      alert('Debe iniciar sesión para acceder a este panel.');
      navigate('/login');
      return;
    }

    const user = JSON.parse(storedUser);
    
    if (user.nivel_base !== 4) {
      alert('Acceso denegado. Solo subdirectivos (nivel 4) pueden acceder a este panel.');
      navigate('/login');
      return;
    }
    
    setUserData(user);
    setLoading(false);
    cargarEstadisticas();
  }, [navigate]);

  const cargarEstadisticas = async () => {
    setLoadingStats(true);
    try {
      const response = await fetch(`${API_URL}/encuestas/subdirectivo/estadisticas/`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('[Subdirectivo] Estadísticas:', data);
      
      if (data.success) {
        setEstadisticas({
          departamento_nombre: data.departamento_nombre || '',
          mes: data.mes || '',
          anio: data.anio || '',
          total_empleados: data.total_empleados || 0,
          respondieron: data.respondieron || 0,
          pendientes: data.pendientes || 0,
          promedio_q1: data.promedio_q1 || 0,
          promedio_q2: data.promedio_q2 || 0,
          promedio_q3: data.promedio_q3 || 0,
          promedio_general: data.promedio_general || 0,
          nivel_1: data.nivel_1 || estadisticas.nivel_1,
          nivel_2: data.nivel_2 || estadisticas.nivel_2,
          nivel_3: data.nivel_3 || estadisticas.nivel_3,
          usuarios_respondieron: data.usuarios_respondieron || [],
          usuarios_pendientes: data.usuarios_pendientes || []
        });
      } else {
        console.error('[Subdirectivo] Error:', data.message);
      }
    } catch (error) {
      console.error('[Subdirectivo] Error cargando estadísticas:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout/`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const getNivelBadge = (nivel) => {
    const config = {
      1: { color: COLORS.nivel1, label: 'Empleado' },
      2: { color: COLORS.nivel2, label: 'Supervisor' },
      3: { color: COLORS.nivel3, label: 'Gerente' }
    };
    const cfg = config[nivel];
    if (!cfg) return null;
    return (
      <span className="px-2 py-1 text-xs font-semibold rounded-full text-white" style={{ backgroundColor: cfg.color }}>
        {cfg.label}
      </span>
    );
  };

  const renderHome = () => (
    <div className="space-y-8">
      {/* Header con logout */}
      <div 
        className="bg-white rounded-2xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        style={{ boxShadow: `0 10px 15px -3px ${COLORS.shadow}` }}
      >
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.primary }}>
            Bienvenido, {userData?.nombre || userData?.username}
          </h1>
          <p className="text-lg" style={{ color: COLORS.textMain }}>
            Panel de Subdirección - Encuestas Mensuales
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-sm px-3 py-1 rounded-full text-white" style={{ backgroundColor: COLORS.primaryDark }}>
              {estadisticas.departamento_nombre || 'Cargando departamento...'}
            </span>
            <span className="text-sm bg-[#f3f4f6] px-3 py-1 rounded-full" style={{ color: COLORS.textMain }}>
              {estadisticas.mes} {estadisticas.anio}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2"
          style={{ backgroundColor: COLORS.error }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar Sesión
        </button>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="rounded-2xl shadow-lg p-6 text-white" 
             style={{ background: `linear-gradient(to bottom right, ${COLORS.primary}, ${COLORS.primaryDark})` }}>
          <div className="text-sm font-medium opacity-90">Total Personal</div>
          <div className="text-4xl font-bold mt-2">{estadisticas.total_empleados}</div>
          <div className="text-xs mt-1 opacity-75">Todos los niveles</div>
        </div>
        
        <div className="rounded-2xl shadow-lg p-6 text-white"
             style={{ background: `linear-gradient(to bottom right, ${COLORS.success}, #374151)` }}>
          <div className="text-sm font-medium opacity-90">Han Respondido</div>
          <div className="text-4xl font-bold mt-2">{estadisticas.respondieron}</div>
          <div className="text-xs mt-1 opacity-75">
            {estadisticas.total_empleados > 0 
              ? ((estadisticas.respondieron / estadisticas.total_empleados) * 100).toFixed(0) 
              : 0}% completado
          </div>
        </div>
        
        <div className="rounded-2xl shadow-lg p-6 text-white"
             style={{ background: `linear-gradient(to bottom right, ${COLORS.error}, #b91c1c)` }}>
          <div className="text-sm font-medium opacity-90">Pendientes</div>
          <div className="text-4xl font-bold mt-2">{estadisticas.pendientes}</div>
          <div className="text-xs mt-1 opacity-75">
            {estadisticas.total_empleados > 0 
              ? ((estadisticas.pendientes / estadisticas.total_empleados) * 100).toFixed(0) 
              : 0}% restante
          </div>
        </div>
        
        <div className="rounded-2xl shadow-lg p-6 text-white"
             style={{ background: `linear-gradient(to bottom right, ${COLORS.info}, #4338ca)` }}>
          <div className="text-sm font-medium opacity-90">Promedio General</div>
          <div className="text-4xl font-bold mt-2">{estadisticas.promedio_general}</div>
          <div className="text-xs mt-1 opacity-75">De escala 5-10</div>
        </div>
      </div>

      {/* Comparativa por Nivel - 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Nivel 1 - Empleados */}
        <div 
          className="bg-white rounded-2xl p-6"
          style={{ boxShadow: `0 10px 15px -3px ${COLORS.shadow}`, borderLeft: `4px solid ${COLORS.nivel1}` }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: COLORS.primary }}>
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.nivel1 }}></span>
              Nivel 1: Empleados
            </h3>
            <span className="text-2xl font-bold" style={{ color: COLORS.nivel1 }}>
              {estadisticas.nivel_1.promedio_general}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xl font-bold" style={{ color: COLORS.textTitle }}>{estadisticas.nivel_1.total}</div>
              <div className="text-xs" style={{ color: COLORS.textMain }}>Total</div>
            </div>
            <div>
              <div className="text-xl font-bold" style={{ color: COLORS.success }}>{estadisticas.nivel_1.respondieron}</div>
              <div className="text-xs" style={{ color: COLORS.textMain }}>Resp.</div>
            </div>
            <div>
              <div className="text-xl font-bold" style={{ color: COLORS.error }}>{estadisticas.nivel_1.pendientes}</div>
              <div className="text-xs" style={{ color: COLORS.textMain }}>Pend.</div>
            </div>
          </div>
        </div>

        {/* Nivel 2 - Supervisores */}
        <div 
          className="bg-white rounded-2xl p-6"
          style={{ boxShadow: `0 10px 15px -3px ${COLORS.shadow}`, borderLeft: `4px solid ${COLORS.nivel2}` }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: COLORS.primary }}>
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.nivel2 }}></span>
              Nivel 2: Supervisores
            </h3>
            <span className="text-2xl font-bold" style={{ color: COLORS.nivel2 }}>
              {estadisticas.nivel_2.promedio_general}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xl font-bold" style={{ color: COLORS.textTitle }}>{estadisticas.nivel_2.total}</div>
              <div className="text-xs" style={{ color: COLORS.textMain }}>Total</div>
            </div>
            <div>
              <div className="text-xl font-bold" style={{ color: COLORS.success }}>{estadisticas.nivel_2.respondieron}</div>
              <div className="text-xs" style={{ color: COLORS.textMain }}>Resp.</div>
            </div>
            <div>
              <div className="text-xl font-bold" style={{ color: COLORS.error }}>{estadisticas.nivel_2.pendientes}</div>
              <div className="text-xs" style={{ color: COLORS.textMain }}>Pend.</div>
            </div>
          </div>
        </div>

        {/* Nivel 3 - Gerentes */}
        <div 
          className="bg-white rounded-2xl p-6"
          style={{ boxShadow: `0 10px 15px -3px ${COLORS.shadow}`, borderLeft: `4px solid ${COLORS.nivel3}` }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: COLORS.primary }}>
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.nivel3 }}></span>
              Nivel 3: Gerentes
            </h3>
            <span className="text-2xl font-bold" style={{ color: COLORS.nivel3 }}>
              {estadisticas.nivel_3.promedio_general}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xl font-bold" style={{ color: COLORS.textTitle }}>{estadisticas.nivel_3.total}</div>
              <div className="text-xs" style={{ color: COLORS.textMain }}>Total</div>
            </div>
            <div>
              <div className="text-xl font-bold" style={{ color: COLORS.success }}>{estadisticas.nivel_3.respondieron}</div>
              <div className="text-xs" style={{ color: COLORS.textMain }}>Resp.</div>
            </div>
            <div>
              <div className="text-xl font-bold" style={{ color: COLORS.error }}>{estadisticas.nivel_3.pendientes}</div>
              <div className="text-xs" style={{ color: COLORS.textMain }}>Pend.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Opciones Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Opción 1: Realizar Encuesta */}
        <div 
          onClick={() => navigate('/questions')}
          className="bg-white rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:scale-105 border-2 border-transparent"
          style={{ boxShadow: `0 10px 15px -3px ${COLORS.shadow}` }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = COLORS.primary}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
        >
          <div className="flex items-center justify-center w-20 h-20 rounded-full mb-6 mx-auto" style={{ backgroundColor: COLORS.primary }}>
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-center mb-3" style={{ color: COLORS.primary }}>
            Realizar Encuesta
          </h3>
          <p className="text-center" style={{ color: COLORS.textMain }}>
            Responde la encuesta mensual del sistema
          </p>
        </div>

        {/* Opción 2: Ver Estadísticas */}
        <div 
          onClick={() => setActiveView('statistics')}
          className="bg-white rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:scale-105 border-2 border-transparent"
          style={{ boxShadow: `0 10px 15px -3px ${COLORS.shadow}` }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = COLORS.primary}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
        >
          <div className="flex items-center justify-center w-20 h-20 rounded-full mb-6 mx-auto" style={{ backgroundColor: COLORS.primary }}>
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-center mb-3" style={{ color: COLORS.primary }}>
            Ver Estadísticas Detalladas
          </h3>
          <p className="text-center" style={{ color: COLORS.textMain }}>
            Consulta respuestas y promedios por nivel
          </p>
        </div>
      </div>

      {/* Botón refrescar */}
      <div className="text-center">
        <button
          onClick={cargarEstadisticas}
          disabled={loadingStats}
          className="font-medium flex items-center gap-2 mx-auto hover:underline"
          style={{ color: COLORS.primary }}
        >
          <svg className={`w-5 h-5 ${loadingStats ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loadingStats ? 'Actualizando...' : 'Actualizar datos'}
        </button>
      </div>
    </div>
  );

  const renderStatistics = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-6" style={{ boxShadow: `0 10px 15px -3px ${COLORS.shadow}` }}>
        <div>
          <h2 className="text-3xl font-bold" style={{ color: COLORS.primary }}>Estadísticas por Nivel</h2>
          <p className="mt-1" style={{ color: COLORS.textMain }}>
            {estadisticas.departamento_nombre} - {estadisticas.mes} {estadisticas.anio}
          </p>
        </div>
        <button
          onClick={() => setActiveView('home')}
          className="text-white px-6 py-3 rounded-xl font-semibold transition-colors hover:opacity-90"
          style={{ backgroundColor: COLORS.primary }}
        >
          ← Regresar
        </button>
      </div>

      {/* Promedios Generales */}
      <div className="bg-white rounded-2xl p-8" style={{ boxShadow: `0 10px 15px -3px ${COLORS.shadow}` }}>
        <h3 className="text-2xl font-bold mb-6" style={{ color: COLORS.primary }}>Promedios Generales</h3>
        
        <div className="space-y-6">
          {['¿La sesión cumplió con sus expectativas? (Q1)', '¿Se comentaron los temas de interés? (Q2)', '¿La sesión fue interactiva y dinámica? (Q3)'].map((label, idx) => {
            const val = idx === 0 ? estadisticas.promedio_q1 : idx === 1 ? estadisticas.promedio_q2 : estadisticas.promedio_q3;
            return (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold" style={{ color: COLORS.textMain }}>{label}</span>
                  <span className="text-2xl font-bold" style={{ color: COLORS.primary }}>{val}</span>
                </div>
                <div className="w-full rounded-full h-6" style={{ backgroundColor: COLORS.border }}>
                  <div
                    className="h-6 rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                    style={{ 
                      width: `${Math.max(((val - 5) / 5) * 100, 0)}%`,
                      background: `linear-gradient(to right, #0070C1, ${COLORS.primary})`
                    }}
                  >
                    {val > 0 && <span className="text-white text-xs font-bold">{val}/10</span>}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="pt-4 border-t-2" style={{ borderColor: COLORS.border }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xl font-bold" style={{ color: COLORS.textTitle }}>Promedio General</span>
              <span className="text-3xl font-bold" style={{ color: COLORS.primary }}>{estadisticas.promedio_general}</span>
            </div>
            <div className="w-full rounded-full h-8" style={{ backgroundColor: COLORS.border }}>
              <div
                className="h-8 rounded-full flex items-center justify-end pr-4 transition-all duration-500"
                style={{ 
                  width: `${Math.max(((estadisticas.promedio_general - 5) / 5) * 100, 0)}%`,
                  background: `linear-gradient(to right, #0070C1, ${COLORS.primary})`
                }}
              >
                {estadisticas.promedio_general > 0 && (
                  <span className="text-white text-sm font-bold">{estadisticas.promedio_general}/10</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparativa de Promedios por Nivel - 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Nivel 1 */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: `0 10px 15px -3px ${COLORS.shadow}`, borderTop: `4px solid ${COLORS.nivel1}` }}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.primary }}>
            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.nivel1 }}></span>
            Empleados (Nivel 1)
          </h3>
          <div className="text-center mb-4">
            <div className="text-5xl font-bold" style={{ color: COLORS.nivel1 }}>{estadisticas.nivel_1.promedio_general}</div>
            <div className="text-sm mt-1" style={{ color: COLORS.textMain }}>Promedio General</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm" style={{ color: COLORS.textMain }}>
              <span>Q1:</span><span className="font-bold" style={{ color: COLORS.primary }}>{estadisticas.nivel_1.promedio_q1}</span>
            </div>
            <div className="flex justify-between text-sm" style={{ color: COLORS.textMain }}>
              <span>Q2:</span><span className="font-bold" style={{ color: COLORS.primary }}>{estadisticas.nivel_1.promedio_q2}</span>
            </div>
            <div className="flex justify-between text-sm" style={{ color: COLORS.textMain }}>
              <span>Q3:</span><span className="font-bold" style={{ color: COLORS.primary }}>{estadisticas.nivel_1.promedio_q3}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t text-center text-sm" style={{ borderColor: COLORS.border, color: COLORS.textMain }}>
            {estadisticas.nivel_1.respondieron} de {estadisticas.nivel_1.total} respondieron
          </div>
        </div>

        {/* Nivel 2 */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: `0 10px 15px -3px ${COLORS.shadow}`, borderTop: `4px solid ${COLORS.nivel2}` }}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.primary }}>
            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.nivel2 }}></span>
            Supervisores (Nivel 2)
          </h3>
          <div className="text-center mb-4">
            <div className="text-5xl font-bold" style={{ color: COLORS.nivel2 }}>{estadisticas.nivel_2.promedio_general}</div>
            <div className="text-sm mt-1" style={{ color: COLORS.textMain }}>Promedio General</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm" style={{ color: COLORS.textMain }}>
              <span>Q1:</span><span className="font-bold" style={{ color: COLORS.primary }}>{estadisticas.nivel_2.promedio_q1}</span>
            </div>
            <div className="flex justify-between text-sm" style={{ color: COLORS.textMain }}>
              <span>Q2:</span><span className="font-bold" style={{ color: COLORS.primary }}>{estadisticas.nivel_2.promedio_q2}</span>
            </div>
            <div className="flex justify-between text-sm" style={{ color: COLORS.textMain }}>
              <span>Q3:</span><span className="font-bold" style={{ color: COLORS.primary }}>{estadisticas.nivel_2.promedio_q3}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t text-center text-sm" style={{ borderColor: COLORS.border, color: COLORS.textMain }}>
            {estadisticas.nivel_2.respondieron} de {estadisticas.nivel_2.total} respondieron
          </div>
        </div>

        {/* Nivel 3 */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: `0 10px 15px -3px ${COLORS.shadow}`, borderTop: `4px solid ${COLORS.nivel3}` }}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.primary }}>
            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.nivel3 }}></span>
            Gerentes (Nivel 3)
          </h3>
          <div className="text-center mb-4">
            <div className="text-5xl font-bold" style={{ color: COLORS.nivel3 }}>{estadisticas.nivel_3.promedio_general}</div>
            <div className="text-sm mt-1" style={{ color: COLORS.textMain }}>Promedio General</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm" style={{ color: COLORS.textMain }}>
              <span>Q1:</span><span className="font-bold" style={{ color: COLORS.primary }}>{estadisticas.nivel_3.promedio_q1}</span>
            </div>
            <div className="flex justify-between text-sm" style={{ color: COLORS.textMain }}>
              <span>Q2:</span><span className="font-bold" style={{ color: COLORS.primary }}>{estadisticas.nivel_3.promedio_q2}</span>
            </div>
            <div className="flex justify-between text-sm" style={{ color: COLORS.textMain }}>
              <span>Q3:</span><span className="font-bold" style={{ color: COLORS.primary }}>{estadisticas.nivel_3.promedio_q3}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t text-center text-sm" style={{ borderColor: COLORS.border, color: COLORS.textMain }}>
            {estadisticas.nivel_3.respondieron} de {estadisticas.nivel_3.total} respondieron
          </div>
        </div>
      </div>

      {/* Tabla: Han Respondido */}
      <div className="bg-white rounded-2xl p-8" style={{ boxShadow: `0 10px 15px -3px ${COLORS.shadow}` }}>
        <h3 className="text-2xl font-bold mb-6 flex items-center" style={{ color: COLORS.primary }}>
          <svg className="w-8 h-8 mr-3" fill="currentColor" viewBox="0 0 20 20" style={{ color: COLORS.success }}>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Personal que Ha Respondido ({estadisticas.respondieron})
        </h3>
        
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: COLORS.border }}>
          <table className="w-full">
            <thead style={{ backgroundColor: COLORS.primary }}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Puesto</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase">Nivel</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase">Q1</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase">Q2</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase">Q3</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase">Prom</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase">Fecha</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y" style={{ divideColor: COLORS.border }}>
              {estadisticas.usuarios_respondieron.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    No hay respuestas registradas
                  </td>
                </tr>
              ) : (
                estadisticas.usuarios_respondieron.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-[#f5f8fc]">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium" style={{ color: COLORS.textTitle }}>{usuario.nombre}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: COLORS.textMain }}>{usuario.rol}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">{getNivelBadge(usuario.nivel_base)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className="px-2 py-1 text-sm font-semibold text-white rounded-full" style={{ backgroundColor: COLORS.primaryDark }}>{usuario.q1}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className="px-2 py-1 text-sm font-semibold text-white rounded-full" style={{ backgroundColor: COLORS.primaryDark }}>{usuario.q2}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className="px-2 py-1 text-sm font-semibold text-white rounded-full" style={{ backgroundColor: COLORS.primaryDark }}>{usuario.q3}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className="px-2 py-1 text-sm font-bold text-white rounded-full" style={{ backgroundColor: '#0070C1' }}>{usuario.promedio}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center" style={{ color: COLORS.textMain }}>{usuario.fecha}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla: Pendientes */}
      <div className="bg-white rounded-2xl p-8" style={{ boxShadow: `0 10px 15px -3px ${COLORS.shadow}` }}>
        <h3 className="text-2xl font-bold mb-6 flex items-center" style={{ color: COLORS.primary }}>
          <svg className="w-8 h-8 mr-3" fill="currentColor" viewBox="0 0 20 20" style={{ color: COLORS.error }}>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          Personal Pendiente ({estadisticas.pendientes})
        </h3>
        
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: COLORS.border }}>
          <table className="w-full">
            <thead style={{ backgroundColor: COLORS.primary }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Puesto</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase">Nivel</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y" style={{ divideColor: COLORS.border }}>
              {estadisticas.usuarios_pendientes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    ¡Todo el personal ha completado la encuesta!
                  </td>
                </tr>
              ) : (
                estadisticas.usuarios_pendientes.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-[#f5f8fc]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: COLORS.textTitle }}>{usuario.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: COLORS.textMain }}>{usuario.rol}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">{getNivelBadge(usuario.nivel_base)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-3 py-1 text-sm font-semibold text-white rounded-full" style={{ backgroundColor: COLORS.error }}>
                        Pendiente
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.background }}>
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto mb-4" style={{ color: COLORS.primary }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xl" style={{ color: COLORS.textMain }}>Verificando acceso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 md:px-8" style={{ backgroundColor: COLORS.background }}>
      <div className="max-w-7xl mx-auto">
        {activeView === 'home' && renderHome()}
        {activeView === 'statistics' && renderStatistics()}
      </div>
    </div>
  );
};

export default ModoSubdirectivo;