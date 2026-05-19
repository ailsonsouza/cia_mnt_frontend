import { useAuth } from '../context/AuthContext';

function UserStatus() {
  const { usuarioAtual } = useAuth();

  const getNivelCor = (nivel) => {
    switch (nivel) {
      case 'DESCENTRALIZADORA':
        return { backgroundColor: '#1e295d', color: 'white' };
      case 'INTERMEDIARIA':
        return { backgroundColor: '#2b6cb0', color: 'white' };
      case 'REQUISITANTE':
        return { backgroundColor: '#38a169', color: 'white' };
      default:
        return { backgroundColor: '#718096', color: 'white' };
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      padding: '8px 15px',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: 'bold',
      zIndex: 9999,
      fontFamily: 'monospace',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
      ...getNivelCor(usuarioAtual.nivel)
    }}>
      📋 {usuarioAtual.secao} - {usuarioAtual.nivel}
    </div>
  );
}

export default UserStatus;