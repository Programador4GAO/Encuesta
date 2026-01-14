import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import aceronimage from './aceron.png'; 

const API_URL = '/api';

const Login = () => {
  const navigate = useNavigate();
  
  // Separamos dominio y usuario
  const [dominio, setDominio] = useState('ACEROSOCOTLAN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const [userDetected, setUserDetected] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // ============================================================
  // DETECTAR USUARIO DE WINDOWS AL CARGAR
  // ============================================================
  useEffect(() => {
    const detectWindowsUser = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/current-user/`, {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success && data.detected) {
          const fullUser = data.fullUsername || data.username;
          // Separar dominio\usuario
          if (fullUser.includes('\\')) {
            const parts = fullUser.split('\\');
            setDominio(parts[0]);
            setUsername(parts[1]);
          } else {
            setUsername(fullUser);
          }
          setUserDetected(true);
        }
      } catch (err) {
        console.log('No se detectó usuario:', err);
      } finally {
        setLoading(false);
      }
    };
    detectWindowsUser();
  }, []);

  const handleUsernameChange = (e) => {
    // Solo permitir cambios si está en modo edición
    if (isEditing) {
      setUsername(e.target.value);
    }
    if (error) setError('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError('');
  };

  // Habilitar edición del campo usuario
  const enableEditing = () => {
    setIsEditing(true);
    setUserDetected(false);
  };

  // ============================================================
  // REDIRIGIR SEGÚN NIVEL_BASE
  // ============================================================
  const getRedirectPath = (nivelBase) => {
    switch (nivelBase) {
      case 1:
        return '/instructions';      // Empleado -> Encuesta
      case 2:
        return '/modo-supervisor';   // Supervisor -> Dashboard + Encuesta
      case 3:
        return '/modo-gerente';      // Gerente -> Dashboard + Encuesta
      case 4:
        return '/modo-subdirectivo'; // Subdirectivo -> Dashboard + Encuesta
      case 5:
        return '/modo-directivo';    // Directivo -> Solo Dashboard
      default:
        return '/instructions';
    }
  };

  // MANEJAR LOGIN
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoggingIn(true);

    // Combinar dominio\usuario para enviar
    const fullUsername = `${dominio}\\${username}`;
    
    // Determinar modo de autenticación:
    // - Si isEditing=true (usuario editó manualmente) -> BD directa
    // - Si isEditing=false (usuario detectado automáticamente) -> Active Directory
    const manualMode = isEditing;

    try {
      const response = await fetch(`${API_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: fullUsername,
          password: password,
          manualMode: manualMode  // true = BD directa, false = Active Directory
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('Login exitoso:', data.user);
        console.log('Modo de autenticación:', data.authMode || (manualMode ? 'database' : 'activeDirectory'));
        localStorage.setItem('user', JSON.stringify(data.user));
        const redirectPath = getRedirectPath(data.user.nivel_base);
        console.log(`Redirigiendo a ${redirectPath} (nivel_base: ${data.user.nivel_base})`);
        navigate(redirectPath);
      } else {
        setError(data.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión con el servidor');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-gray-50">
      
      {/* --- LADO IZQUIERDO (Formulario) --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-gray-100">
          
          {/* Título */}
          <h1 className="text-4xl lg:text-5xl font-extrabold text-[#003781] mb-2 text-center tracking-tight">
            SIEMAO 
          </h1>
          <h2 className="text-3xl lg:text-3xl font-extrabold text-[#003781] mb-2 text-center tracking-tight">
            INICIAR SESIÓN 
          </h2>
          
          {/* Subtítulo */}
          <p className="text-center text-[#0070C1] font-medium mb-10 text-sm">
            Bienvenido al sistema de encuestas mensuales de<br />
            <span className="font-bold">Aceros Ocotlán</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Input Usuario - CON DOMINIO FIJO */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="usuario" className="text-sm font-semibold text-[#003781] ml-1">
                  Usuario
                </label>
                {/* Botón Editar */}
                {userDetected && !isEditing && !loading && (
                  <button
                    type="button"
                    onClick={enableEditing}
                    className="text-xs text-[#0070C1] hover:text-[#003781] font-medium flex items-center gap-1 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Editar
                  </button>
                )}
                {isEditing && (
                  <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Modo edición
                  </span>
                )}
              </div>
              
              {/* Input con prefijo fijo */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                
                {/* Container con dominio fijo + input editable */}
                <div className={`w-full pl-11 pr-10 py-3.5 border text-sm rounded-xl flex items-center transition-all ${
                  userDetected && !isEditing
                    ? 'bg-blue-50 border-blue-200' 
                    : isEditing 
                      ? 'bg-white border-[#0070C1] ring-2 ring-[#0070C1]'
                      : 'bg-gray-50 border-gray-200'
                } ${loading ? 'bg-gray-100' : ''}`}>
                  
                  {/* Dominio fijo (no editable) */}
                  <span className={`font-medium whitespace-nowrap ${
                    loading ? 'text-gray-500' : 'text-[#003781]'
                  }`}>
                    {loading ? 'Detectando...' : `${dominio}\\`}
                  </span>
                  
                  {/* Usuario editable */}
                  <input
                    type="text"
                    id="usuario"
                    name="usuario"
                    value={loading ? '' : username}
                    onChange={handleUsernameChange}
                    placeholder="usuario"
                    className={`flex-1 bg-transparent outline-none border-none text-sm ${
                      userDetected && !isEditing
                        ? 'text-[#003781] font-medium cursor-default' 
                        : 'text-gray-900'
                    } ${loading ? 'text-gray-500' : ''}`}
                    readOnly={!isEditing && userDetected}
                    disabled={loading}
                    required
                  />
                </div>
                
                {/* Icono de check cuando está detectado */}
                {userDetected && !isEditing && !loading && (
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                {/* Spinner durante carga */}
                {loading && (
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <svg className="animate-spin h-5 w-5 text-[#003781]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Mensaje de estado */}
              {userDetected && !isEditing && !loading && (
                <p className="text-xs text-green-600 ml-1 flex items-center gap-1">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Usuario de Windows detectado automáticamente
                </p>
              )}
              {isEditing && (
                <p className="text-xs text-blue-600 ml-1 flex items-center gap-1">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Modo manual - Autenticación contra base de datos
                </p>
              )}
            </div>

            {/* Input Contraseña */}
            <div className="space-y-2">
              <label htmlFor="contraseña" className="text-sm font-semibold text-[#003781] ml-1">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  id="contraseña"
                  name="contraseña"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-[#0070C1] focus:border-transparent outline-none transition-all placeholder-gray-400"
                  required
                  disabled={loading}
                  autoFocus={userDetected && !isEditing}
                />
              </div>
            </div>

            {/* Mensaje de Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={loading || loggingIn}
              className={`w-full bg-gradient-to-r from-[#003781] to-[#0070C1] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all duration-300 mt-6 flex justify-center items-center gap-2 ${
                loading || loggingIn 
                  ? 'opacity-70 cursor-not-allowed' 
                  : 'hover:from-[#00285e] hover:to-[#005a9e] transform hover:scale-[1.02]'
              }`}
            >
              {loggingIn ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Validando...</span>
                </>
              ) : (
                <>
                  <span>COMENZAR</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>

          </form>
        </div>
      </div>

      {/* --- LADO DERECHO (Imagen) --- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#003781] overflow-hidden justify-center items-center">
        <div className="absolute inset-y-0 left-0 w-16 bg-gray-50 rounded-r-[4rem] z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#003781] via-[#00245D] to-[#021223] opacity-90"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#0070C1] rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-[#1D99DA] rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>

        <div className="relative z-20 w-[80%] max-w-[500px] aspect-square flex items-center justify-center">
            <div className="absolute w-full h-full border border-white/10 rounded-full scale-110"></div>
            <div className="absolute w-full h-full border border-white/5 rounded-full scale-125"></div>
            <img 
              src={aceronimage} 
              alt="Aceron" 
              className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-500"
            />
        </div>
      </div>

    </div>
  );
};

export default Login;