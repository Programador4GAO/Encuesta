
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importa tus componentes desde la carpeta components
import Login from './components/Login';
import InstructionsDesign from './components/InstructionsDesign';
import Questions from './components/Questions';
import ModoSupervisor from './components/ModoSupervisor';
import ModoGerente from './components/ModoGerente';

import ModoDirectivo from './components/ModoDirectivo';
import LogOut from './components/LogOut';

function App() {
  return (
    <Router>
      <Routes>
        {/* Login */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        
        {/* Rutas según nivel_base */}
        <Route path="/instructions" element={<InstructionsDesign />} />  {/* nivel_base: 1 */}
        <Route path="/modo-supervisor" element={<ModoSupervisor />} />   {/* nivel_base: 2 */}
        <Route path="/modo-gerente" element={<ModoGerente />} />   {/* nivel_base: 3 */}
        <Route path="/modo-directivo" element={<ModoDirectivo />} />     {/* nivel_base: 5*/}

        {/* Otras rutas */}
        <Route path="/questions" element={<Questions />} />
        <Route path="/logout" element={<LogOut />} />
      </Routes>
    </Router>
  );
}

export default App;