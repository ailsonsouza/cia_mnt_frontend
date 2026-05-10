import Login from './components/pages/Login';
import Home from './components/pages/Home';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import NewOrder from './components/pages/NewOrder'
import Orders from './components/pages/Orders'
import Sections from './components/pages/Sections'
import Users from './components/pages/Users'
import Technicians from './components/pages/Technicians'
import SectionDetails from './components/pages/SectionDetails';
import './App.css';
import TechnicianDetails from './components/pages/TechnicianDetails';
import UserDetails from './components/pages/UserDetails';


function AppContent() {
  const location = useLocation();

  return (
    < div className="App">
      {/* Lógica: Se não for a rota /login, mostra o Navbar */}
      {location.pathname !== '/login' && <Navbar />}

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        
        {/* Adicione as outras rotas que você tem no Navbar aqui também */}
        
        <Route path="/newOrder" element={<NewOrder />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/sections" element={<Sections />} />
        <Route path="/users" element={<Users />} />
        <Route path="/technicians" element={<Technicians />} />
        <Route path="*" element={<Navigate to="/login" />} />
        <Route path="/sectiondetails" element={<SectionDetails />} />
        <Route path="/techniciandetails" element={<TechnicianDetails />} />
        <Route path="/userdetails" element={<UserDetails />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

