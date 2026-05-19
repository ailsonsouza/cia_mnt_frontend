import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

import { AuthProvider } from './components/context/AuthContext';  // ← IMPORTAÇÃO DO PROVIDER

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>

    <AuthProvider>  {/* ← ENVOLVA AQUI  RETIRAR FUTURAMENTE*/}
    <App />

    </AuthProvider>
  </React.StrictMode>
);
