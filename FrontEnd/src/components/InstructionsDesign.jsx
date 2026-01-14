import React from 'react';
import { useNavigate } from 'react-router-dom';

const Instructions = ({ onStart }) => {
  const navigate = useNavigate();

  const handleComenzar = () => {
    if (onStart) {
      onStart();
    }
    // Navegar a la encuesta (Questions.jsx)
    navigate('/questions'); 
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-200 p-4 relative overflow-hidden">
      
      {/* --- Elementos Decorativos de Fondo --- */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#0070C1] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#003781] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

      {/* --- Tarjeta Principal --- */}
      <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-white/50">
        
        {/* Barra superior decorativa */}
        <div className="h-3 w-full bg-gradient-to-r from-[#003781] via-[#0070C1] to-[#003781]"></div>

        <div className="p-8 md:p-12 lg:p-16">
          
          {/* Encabezado */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#003781] mb-6 tracking-tight">
              INSTRUCCIONES
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Tu opinión es fundamental para la mejora continua de <span className="font-bold text-[#0070C1]">Aceros Ocotlán</span>.
              Este sistema nos permite conocer diversos aspectos de tu área de trabajo.
            </p>
          </div>

          {/* Contenedor de Instrucciones (Grid) */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            
            {/* Instrucción 1 */}
            <InstructionItem 
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              }
              title="Lee con atención"
              desc="Lee cada pregunta cuidadosamente antes de responder."
            />

            {/* Instrucción 2 */}
            <InstructionItem 
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              }
              title="Califica del 5 al 10"
              desc="Selecciona tu calificación en la escala establecida."
            />

            {/* Instrucción 3 */}
            <InstructionItem 
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
              title="Obligatorio"
              desc="Todas las preguntas deben ser contestadas."
            />

            {/* Instrucción 4 */}
            <InstructionItem 
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              }
              title="Revisión Final"
              desc="Verifica tus respuestas antes de finalizar la encuesta."
            />

          </div>

          {/* Botón de Acción */}
          <div className="flex justify-center">
            <button
              onClick={handleComenzar}
              className="group relative inline-flex items-center justify-center px-16 py-4 text-lg font-bold text-white transition-all duration-200 bg-gradient-to-r from-[#003781] to-[#0070C1] rounded-xl hover:from-[#00285e] hover:to-[#005a9e] shadow-lg hover:shadow-blue-900/30 transform hover:-translate-y-1"
            >
              <span>COMENZAR ENCUESTA</span>
              <svg className="w-6 h-6 ml-2 -mr-1 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

// Componente auxiliar para los items de la lista
const InstructionItem = ({ icon, title, desc }) => (
  <div className="flex items-start p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow duration-300">
    <div className="flex-shrink-0">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#003781] shadow-lg shadow-blue-900/20">
        {icon}
      </div>
    </div>
    <div className="ml-4">
      <h3 className="text-lg font-bold text-[#003366] mb-1">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default Instructions;