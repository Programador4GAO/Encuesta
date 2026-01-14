import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

const API_URL = '/api';

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const QuestionSlider = ({ id, label, value, onChange }) => {
  const percentage = ((value - 5) / 5) * 100;
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className="w-full md:w-1/3">
        <label className="text-[#003366] font-bold text-lg md:text-xl block">
          {label}
        </label>
        <span className="text-gray-400 text-sm">Evalúa del 5 al 10</span>
      </div>

      <div className="flex-1 flex items-center gap-4">
        <div className="relative w-full h-6 flex items-center">
          <input
            type="range"
            min="5"
            max="10"
            step="1"
            value={value}
            onChange={(e) => onChange(id, e.target.value)}
            className="w-full absolute z-20 opacity-0 cursor-pointer h-full"
          />
          
          <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden relative z-10">
            <div
              className="h-full transition-all duration-300 ease-out"
              style={{
                width: `${percentage}%`,
                background: 'linear-gradient(90deg, #60a5fa 0%, #003366 100%)'
              }}
            />
          </div>

          <div
            className="absolute h-6 w-6 bg-white border-4 border-[#003366] rounded-full shadow-md z-10 pointer-events-none transition-all duration-300"
            style={{ left: `calc(${percentage}% - 12px)` }}
          />
        </div>

        <div className="w-12 h-12 flex items-center justify-center bg-[#003366] text-white font-bold rounded-lg shadow-md shrink-0 text-xl">
          {value}
        </div>
      </div>
    </div>
  );
};

const Questions = () => {
  const navigate = useNavigate();
  
  const questionLabels = {
    q1: "¿La sesión cumplió con sus expectativas?",
    q2: "¿Se comentaron los temas de interés?",
    q3: "¿La sesión fue interactiva y dinámica?"
  };

  const [responses, setResponses] = useState({ q1: 10, q2: 10, q3: 10 });
  const [average, setAverage] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [departamentoInfo, setDepartamentoInfo] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Primero verificar localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUserData(JSON.parse(storedUser));
        }

        // Verificar sesión con el servidor
        const response = await fetch(`${API_URL}/auth/me/`, { credentials: 'include' });
        const data = await response.json();
        
        if (!data.authenticated) {
          navigate('/login');
          return;
        }
        
        setUserData(data.user);

        // Obtener información del departamento desde la BD
        const deptoResponse = await fetch(`${API_URL}/encuestas/mi-departamento/`, { 
          credentials: 'include' 
        });
        const deptoData = await deptoResponse.json();
        
        if (deptoData.success) {
          setDepartamentoInfo(deptoData);
          console.log('[Questions] Departamento obtenido:', deptoData);
        }

      } catch (err) {
        console.error('[Questions] Error verificando sesión:', err);
        const storedUser = localStorage.getItem('user');
        if (!storedUser) navigate('/login');
      } finally {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, [navigate]);

  useEffect(() => {
    const avg = ((responses.q1 + responses.q2 + responses.q3) / 3).toFixed(1);
    setAverage(parseFloat(avg));
  }, [responses]);

  const handleSliderChange = (question, value) => {
    setResponses(prev => ({ ...prev, [question]: parseFloat(value) }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    const csrftoken = getCookie('csrftoken');
    
    console.log('[submit] csrftoken:', csrftoken);
    console.log('[submit] userData:', userData);
    console.log('[submit] departamentoInfo:', departamentoInfo);
    console.log('[submit] payload:', {
      q1: responses.q1,
      q2: responses.q2,
      q3: responses.q3
    });

    try {
      const response = await fetch(`${API_URL}/encuestas/submit/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken 
        },
        credentials: 'include',
        body: JSON.stringify({
          q1: responses.q1,
          q2: responses.q2,
          q3: responses.q3
          // El departamento se obtiene automáticamente en el backend
        })
      });

      console.log('[submit] status:', response.status);
      const data = await response.json();
      console.log('[submit] body:', data);

      if (response.ok && data.success) {
        console.log('Encuesta guardada:', data);
        
        // Si es supervisor (nivel 2), regresar al dashboard
        if (userData?.nivel_base === 2) {
          navigate('/modo-supervisor');
        } else {
          navigate('/logout');
        }
      } else {
        if (response.status === 401) {
          setError('Tu sesión ha expirado o no tienes permisos.');
        } else {
          setError(data.message || 'Error al guardar la encuesta');
        }
      }
    } catch (err) {
      console.error('[submit] Error:', err);
      setError('Error de conexión con el servidor');
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 9) return "text-green-600 bg-green-50";
    if (score >= 7) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-[#003366] mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#003366] px-8 py-6 text-center relative overflow-hidden">
          <h1 className="text-white text-2xl md:text-3xl font-bold tracking-wide relative z-10">
            ENCUESTA MENSUAL
          </h1>
          <p className="text-blue-200 text-sm mt-2 relative z-10">
            Tu opinión nos ayuda a mejorar
          </p>
          {userData && (
            <p className="text-blue-300 text-xs mt-1 relative z-10">
              Usuario: {userData.nombre || userData.username}
            </p>
          )}
          {departamentoInfo && (
            <p className="text-blue-200 text-xs mt-1 relative z-10">
              Departamento: {departamentoInfo.departamento_nombre || `ID ${departamentoInfo.departamento_id}`}
            </p>
          )}
        </div>

        <div className="p-6 md:p-10 space-y-8">
          <div className="flex justify-end text-xs text-gray-400 gap-1 mb-4 border-b border-gray-100 pb-2">
            <span>Escala: 5 (Mínimo) - 10 (Máximo)</span>
          </div>
           
          <div className="space-y-2">
            <QuestionSlider id="q1" label={questionLabels.q1} value={responses.q1} onChange={handleSliderChange} />
            <QuestionSlider id="q2" label={questionLabels.q2} value={responses.q2} onChange={handleSliderChange} />
            <QuestionSlider id="q3" label={questionLabels.q3} value={responses.q3} onChange={handleSliderChange} />
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col-reverse md:flex-row items-center justify-between gap-6">
            {error && (
              <div className="w-full md:w-auto text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg border border-red-100">
                {error}
              </div>
            )}
            
            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end ml-auto">
              <div className={`flex flex-col items-end px-4 py-2 rounded-lg border border-gray-100 ${getScoreColor(average)}`}>
                <span className="text-xs uppercase font-bold tracking-wider opacity-70">Promedio</span>
                <span className="text-3xl font-extrabold">{average}</span>
              </div>
              <button 
                onClick={handleSubmit} 
                disabled={submitting} 
                className={`bg-[#003366] hover:bg-[#002244] text-white px-8 py-3 rounded-xl shadow-lg font-semibold transition-all duration-200 transform active:scale-95 flex items-center gap-2 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {submitting ? <span>Enviando...</span> : <span>Enviar Evaluación</span>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Questions;