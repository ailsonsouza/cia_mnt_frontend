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

    fetch(`http://localhost:5000/users?name=${encodeURIComponent(credentials.login.trim())}`)
    .then(resp => resp.json())
    .then(usersFound => {
      if (usersFound.length === 0) {
        alert("Usuário não encontrado!");
        return;
      }

      const user = usersFound[0];

      if (user.password !== credentials.password) {
        alert("Senha incorreta!");
        return;
      }

      fetch('http://localhost:5000/roles')
      .then(resp => resp.json())
      .then(rolesList => {
        const userRoleObj = rolesList.find(r => String(r.id) === String(user.level_id));
        
        localStorage.setItem('loggedUser', JSON.stringify({
          id: user.id,
          name: user.name,
          section_id: user.section_id,
          roleName: userRoleObj ? userRoleObj.name.toUpperCase().trim() : 'USER'
        }));

        alert(`Bem-vindo, ${user.name}!`);
        navigate('/home');
      });
    })
    .catch(() => alert("Falha na comunicação com o banco de dados."));
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
