import React, { createContext, useState, useContext, useEffect } from 'react';

// Definição dos perfis de usuário
export const USUARIOS = {
  TESOURARIA: {
    id: 'tesouraria',
    nome: 'Tesouraria',
    secao: 'TESOURARIA',
    nivel: 'DESCENTRALIZADORA'
  },
  COL: {
    id: 'col',
    nome: 'COL',
    secao: 'COL',
    nivel: 'INTERMEDIARIA'
  },
  GRCP: {
    id: 'grcp',
    nome: 'GRCP',
    secao: 'GRCP',
    nivel: 'REQUISITANTE'
  }
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Altere MANUALMENTE aqui o usuário atual:
  // Opções: USUARIOS.TESOURARIA, USUARIOS.COL, USUARIOS.GRCP
  const [usuarioAtual, setUsuarioAtual] = useState(USUARIOS.GRCP);

  // Para trocar manualmente no código, use esta função
  const trocarUsuario = (usuario) => {
    setUsuarioAtual(usuario);
  };

  const value = {
    usuarioAtual,
    trocarUsuario
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;