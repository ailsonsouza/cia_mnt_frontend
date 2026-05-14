import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import style from '../styles/styles_pages/Login.module.css';
import Input from '../form/Input';

function Login() {
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState({
    login: '',
    password: ''
  });

  const handleChange = (e) => {
    const value = e.target.name === 'login' ? e.target.value.toUpperCase() : e.target.value;
    setCredentials({ ...credentials, [e.target.name]: value });
  };

  const handleLogin = (e) => {
    e.preventDefault(); 
    
    if (!credentials.login || !credentials.password) {
      alert("Por favor, preencha todos os campos!");
      return;
    }

    // Comunica-se com o novo ecossistema isolado de autenticação do backend
    fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: credentials.login.toUpperCase().trim(),
        password: credentials.password
      })
    })
    .then(resp => {
      if (!resp.ok) {
        throw new Error("Credenciais inválidas ou erro no servidor.");
      }
      return resp.json();
    })
    .then(loggedUserData => {
      // Armazena as informações retornadas pelo AuthResponseDTO
      localStorage.setItem('loggedUser', JSON.stringify(loggedUserData));
      alert(`Bem-vindo, ${loggedUserData.name}!`);
      navigate('/home');
    })
    .catch((err) => {
      console.log(err);
      alert("Usuário não encontrado ou senha incorreta!");
    });
  };

  return (
    <div className={style.login_page_container}>
      <div className={style.login_box}>
        <h2 className={style.company_title}>COMPANHIA DE MANUTENÇÃO</h2>
        <h1 className={style.title}>Login</h1>

        <form onSubmit={handleLogin}>
          <Input
            type='text'
            text="LOGIN"
            name="login"
            placeholder="INSIRA O USUÁRIO"
            handleOnChange={handleChange}
            value={credentials.login}
          />

          <Input
            type='password'
            text="SENHA"
            name="password"
            placeholder="INSIRA A SENHA"
            handleOnChange={handleChange}
            value={credentials.password}
          />

          <button type="submit" className={style.login_button}>
            ENTRAR NO SISTEMA
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
