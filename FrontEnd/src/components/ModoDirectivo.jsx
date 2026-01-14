import React, { useState, useEffect } from 'react';
import { authService } from '../services/apiService';

// Definición de colores basada en la Paleta SIAO (Consistente con Supervisor)
const COLORS = {
  primary: '#003781',      // Azul Principal
  primaryDark: '#00245D',  // Azul más oscuro (hover)
  primaryLight: '#0070C1', // Azul claro (gradientes)
  background: '#f5f8fc',   // Fondo de secciones
  textMain: '#374151',     // Gris oscuro texto
  textTitle: '#1f2937',    // Gris muy oscuro títulos
  success: '#059669',      // Verde
  error: '#dc2626',        // Rojo
  shadow: '#bec3c9',       // Sombra neumorfismo
  border: '#e5e7eb'        // Bordes
};

const DirectiveDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [activeView, setActiveView] = useState('home');
  const [mesActual] = useState('enero');
  const [añoActual] = useState(2026);
  
  const [estadisticas, setEstadisticas] = useState({
    promedio_corporativo_mes: 0,
    promedio_corporativo_año: 0,
    total_empleados: 0,
    total_respuestas_mes: 0,
    total_respuestas_año: 0,
    departamentos: [],
    supervisores: [],
    promedios_mensuales: []
  });

  useEffect(() => {
    // Verificar que el usuario sea directivo
    const user = authService.getCurrentUser();
    
    if (!user || (user.rol !== 'Directivo' && user.rol !== 'Administrador')) {
      alert('Acceso denegado. Solo directivos pueden acceder a este panel.');
      window.location.href = '/';
      return;
    }
    
    setUserData(user);
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = () => {
    // Datos simulados - en producción, llamar a la API
    const datosSimulados = {
      promedio_corporativo_mes: 0,
      promedio_corporativo_año: 0,
      total_empleados: 0,
      total_respuestas_mes: 0,
      total_respuestas_año: 0,
      departamentos: [],
      supervisores: [],
      promedios_mensuales: []
    };
    
    setEstadisticas(datosSimulados);
  };

  const renderHome = () => (
    <div className="space-y-8">
      {/* Bienvenida */}
      <div 
        className="bg-white rounded-2xl p-8"
        style={{ boxShadow: `0 10px 15px -3px ${COLORS.shadow}` }}
      >
        <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.primary }}>
          Panel Ejecutivo - {userData?.Nombre}
        </h1>
        <p className="text-lg" style={{ color: COLORS.textMain }}>
          Vista Estratégica - Encuestas Mensuales
        </p>
      </div>

      {/* Métricas Corporativas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Card 1: Promedio Mes - Gradiente Principal */}
        <div className="rounded-2xl shadow-lg p-6 text-white"
             style={{ background: `linear-gradient(to bottom right, ${COLORS.primaryLight}, ${COLORS.primary})` }}>
          <div className="text-sm font-medium opacity-90">Promedio Corporativo</div>
          <div className="text-sm font-medium opacity-90">{mesActual} {añoActual}</div>
          <div className="text-4xl font-bold mt-2">{estadisticas.promedio_corporativo_mes || '0'}</div>
          <div className="text-xs mt-1 opacity-75">Escala 5-10</div>
        </div>
        
        {/* Card 2: Promedio Año - Gradiente Oscuro */}
        <div className="rounded-2xl shadow-lg p-6 text-white"
             style={{ background: `linear-gradient(to bottom right, ${COLORS.primary}, ${COLORS.primaryDark})` }}>
          <div className="text-sm font-medium opacity-90">Promedio Corporativo</div>
          <div className="text-sm font-medium opacity-90">Año {añoActual}</div>
          <div className="text-4xl font-bold mt-2">{estadisticas.promedio_corporativo_año || '0'}</div>
          <div className="text-xs mt-1 opacity-75">Acumulado anual</div>
        </div>
        
        {/* Card 3: Respuestas Mes - Gradiente Medio */}
        <div className="rounded-2xl shadow-lg p-6 text-white"
             style={{ background: `linear-gradient(to bottom right, #1D99DA, ${COLORS.primary})` }}>
          <div className="text-sm font-medium opacity-90">Respuestas del Mes</div>
          <div className="text-4xl font-bold mt-2">{estadisticas.total_respuestas_mes}</div>
          <div className="text-xs mt-1 opacity-75">
            de {estadisticas.total_empleados} empleados
          </div>
        </div>
        
        {/* Card 4: Respuestas Año - Gradiente Suave */}
        <div className="rounded-2xl shadow-lg p-6 text-white"
             style={{ background: `linear-gradient(to bottom right, #0070C1, #022859)` }}>
          <div className="text-sm font-medium opacity-90">Respuestas del Año</div>
          <div className="text-4xl font-bold mt-2">{estadisticas.total_respuestas_año}</div>
          <div className="text-xs mt-1 opacity-75">Total acumulado</div>
        </div>
      </div>

      {/* Opciones de Navegación */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Opción 1: Ver por Departamentos */}
        <div 
          onClick={() => setActiveView('departamentos')}
          className="bg-white rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:scale-105 border-2 border-transparent"
          style={{ boxShadow: `0 10px 15px -3px ${COLORS.shadow}` }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = COLORS.primary}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
        >
          <div className="flex items-center justify-center w-20 h-20 rounded-full mb-6 mx-auto" style={{ backgroundColor: COLORS.primary }}>
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-center mb-3" style={{ color: COLORS.primary }}>
            Por Departamentos
          </h3>
          <p className="text-center" style={{ color: COLORS.textMain }}>
            Promedios y estadísticas por área
          </p>
        </div>

        {/* Opción 2: Ver por Supervisores */}
        <div 
          onClick={() => setActiveView('supervisores')}
          className="bg-white rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:scale-105 border-2 border-transparent"
          style={{ boxShadow: `0 10px 15px -3px ${COLORS.shadow}` }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = COLORS.primary}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
        >
          <div className="flex items-center justify-center w-20 h-20 rounded-full mb-6 mx-auto" style={{ backgroundColor: COLORS.primary }}>
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-center mb-3" style={{ color: COLORS.primary }}>
            Por Supervisores
          </h3>
          <p className="text-center" style={{ color: COLORS.textMain }}>
            Desempeño de cada supervisor
          </p>
        </div>

        {/* Opción 3: Vista Anual */}
        <div 
          onClick={() => setActiveView('anual')}
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
            Histórico Anual
          </h3>
          <p className="text-center" style={{ color: COLORS.textMain }}>
            Tendencias mes a mes
          </p>
        </div>

      </div>
    </div>
  );

  const renderDepartamentos = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between bg-white rounded-2xl p-6" style={{ boxShadow: `0 10px 15px -3px ${COLORS.shadow}` }}>
        <h2 className="text-3xl font-bold" style={{ color: COLORS.primary }}>Promedios por Departamento</h2>
        <button
          onClick={() => setActiveView('home')}
          className="text-white px-6 py-3 rounded-xl font-semibold transition-colors hover:opacity-90"
          style={{ backgroundColor: COLORS.primary }}
        >
          ← Regresar
        </button>
      </div>

      {/* Tabla de Departamentos */}
      <div className="bg-white rounded-2xl p-8" style={{ boxShadow: `0 10px 15px -3px ${COLORS.shadow}` }}>
        <h3 className="text-2xl font-bold mb-6" style={{ color: COLORS.primary }}>
          Desempeño por Área - {mesActual} {añoActual}
        </h3>
        
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: COLORS.border }}>
          <table className="w-full">
            <thead style={{ backgroundColor: COLORS.primary }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Departamento</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Supervisor</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Empleados</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Respuestas</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Promedio Mes</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Promedio Año</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y" style={{ divideColor: COLORS.border }}>
              {estadisticas.departamentos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="text-lg font-medium">No hay datos de departamentos</p>
                    </div>
                  </td>
                </tr>
              ) : (
                estadisticas.departamentos.map((dept, index) => (
                  <tr key={index} className="hover:bg-[#f5f8fc]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: COLORS.textTitle }}>{dept.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center" style={{ color: COLORS.textMain }}>{dept.supervisor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold" style={{ color: COLORS.textMain }}>{dept.total_empleados}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold" style={{ color: COLORS.textMain }}>{dept.respuestas}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-3 py-1 text-sm font-bold text-white rounded-full" style={{ backgroundColor: COLORS.primary }}>{dept.promedio_mes}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-3 py-1 text-sm font-bold text-white rounded-full" style={{ backgroundColor: COLORS.primaryLight }}>{dept.promedio_año}</span>
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

  const renderSupervisores = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between bg-white rounded-2xl p-6" style={{ boxShadow: `0 10px 15px -3px ${COLORS.shadow}` }}>
        <h2 className="text-3xl font-bold" style={{ color: COLORS.primary }}>Desempeño por Supervisor</h2>
        <button
          onClick={() => setActiveView('home')}
          className="text-white px-6 py-3 rounded-xl font-semibold transition-colors hover:opacity-90"
          style={{ backgroundColor: COLORS.primary }}
        >
          ← Regresar
        </button>
      </div>

      {/* Tabla de Supervisores */}
      <div className="bg-white rounded-2xl p-8" style={{ boxShadow: `0 10px 15px -3px ${COLORS.shadow}` }}>
        <h3 className="text-2xl font-bold mb-6" style={{ color: COLORS.primary }}>
          Promedios de Supervisores - {mesActual} {añoActual}
        </h3>
        
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: COLORS.border }}>
          <table className="w-full">
            <thead style={{ backgroundColor: COLORS.primary }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Supervisor</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Departamento</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Empleados</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Promedio Mes</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Promedio Año</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">vs. Corporativo</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y" style={{ divideColor: COLORS.border }}>
              {estadisticas.supervisores.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-lg font-medium">No hay datos de supervisores</p>
                    </div>
                  </td>
                </tr>
              ) : (
                estadisticas.supervisores.map((sup, index) => (
                  <tr key={index} className="hover:bg-[#f5f8fc]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: COLORS.textTitle }}>{sup.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center" style={{ color: COLORS.textMain }}>{sup.departamento}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold" style={{ color: COLORS.textMain }}>{sup.empleados}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-3 py-1 text-sm font-bold text-white rounded-full" style={{ backgroundColor: COLORS.primary }}>{sup.promedio_mes}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-3 py-1 text-sm font-bold text-white rounded-full" style={{ backgroundColor: COLORS.primaryLight }}>{sup.promedio_año}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-3 py-1 text-sm font-semibold rounded-full text-white"
                            style={{ 
                              backgroundColor: sup.diferencia_corporativo >= 0 ? COLORS.success : COLORS.error 
                            }}>
                        {sup.diferencia_corporativo >= 0 ? '+' : ''}{sup.diferencia_corporativo}
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

  const renderAnual = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between bg-white rounded-2xl p-6" style={{ boxShadow: `0 10px 15px -3px ${COLORS.shadow}` }}>
        <h2 className="text-3xl font-bold" style={{ color: COLORS.primary }}>Histórico Anual {añoActual}</h2>
        <button
          onClick={() => setActiveView('home')}
          className="text-white px-6 py-3 rounded-xl font-semibold transition-colors hover:opacity-90"
          style={{ backgroundColor: COLORS.primary }}
        >
          ← Regresar
        </button>
      </div>

      {/* Tabla de Promedios Mensuales */}
      <div className="bg-white rounded-2xl p-8" style={{ boxShadow: `0 10px 15px -3px ${COLORS.shadow}` }}>
        <h3 className="text-2xl font-bold mb-6" style={{ color: COLORS.primary }}>
          Promedios Corporativos Mensuales
        </h3>
        
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: COLORS.border }}>
          <table className="w-full">
            <thead style={{ backgroundColor: COLORS.primary }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Mes</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Respuestas</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Ant_1</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Ant_2</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Ant_3</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Promedio</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y" style={{ divideColor: COLORS.border }}>
              {estadisticas.promedios_mensuales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="text-lg font-medium">No hay datos históricos</p>
                    </div>
                  </td>
                </tr>
              ) : (
                estadisticas.promedios_mensuales.map((mes, index) => (
                  <tr key={index} className="hover:bg-[#f5f8fc]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium capitalize" style={{ color: COLORS.textTitle }}>{mes.mes}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold" style={{ color: COLORS.textMain }}>{mes.respuestas}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-3 py-1 text-sm font-semibold text-white rounded-full" style={{ backgroundColor: COLORS.primaryDark }}>{mes.ant_1}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-3 py-1 text-sm font-semibold text-white rounded-full" style={{ backgroundColor: COLORS.primaryDark }}>{mes.ant_2}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-3 py-1 text-sm font-semibold text-white rounded-full" style={{ backgroundColor: COLORS.primaryDark }}>{mes.ant_3}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-3 py-1 text-sm font-bold text-white rounded-full" style={{ backgroundColor: '#0070C1' }}>{mes.promedio}</span>
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

  if (!userData) {
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
        {activeView === 'departamentos' && renderDepartamentos()}
        {activeView === 'supervisores' && renderSupervisores()}
        {activeView === 'anual' && renderAnual()}
      </div>
    </div>
  );
};

export default DirectiveDashboard;