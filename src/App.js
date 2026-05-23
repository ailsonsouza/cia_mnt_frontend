import Login from './components/pages/Login';
import Home from './components/pages/Home';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import NewOrder from './components/pages/NewOrder'
import Orders from './components/pages/Orders'
import Sections from './components/pages/Sections'
import Users from './components/pages/Users'
import Technicians from './components/pages/Technicians'
import Credits from './components/pages/Credits';
import SectionDetails from './components/pages/SectionDetails';
import './App.css';
import TechnicianDetails from './components/pages/TechnicianDetails';
import UserDetails from './components/pages/UserDetails';


function AppContent() {
  const location = useLocation();

  return (
    < div className="App">
      {location.pathname !== '/login' && <Navbar />}

      <Routes>
        {/* ROTA PARA CRÉDITOS - suporta todas as abas */}
        <Route path="/credits/:aba" element={<Credits />} />
        <Route path="/credits" element={<Credits />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        
        <Route path="/newOrder" element={<NewOrder />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/sections" element={<Sections />} />
        <Route path="/users" element={<Users />} />
        <Route path="/technicians" element={<Technicians />} />
        
        <Route path="/sectiondetails" element={<SectionDetails />} />
        <Route path="/techniciandetails" element={<TechnicianDetails />} />
        <Route path="/userdetails" element={<UserDetails />} />
        
        <Route path="*" element={<Navigate to="/login" />} />
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