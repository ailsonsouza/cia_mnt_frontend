import { Link, useNavigate } from "react-router-dom"
import Container from "./Container"
import styles from '../styles/styles_layout/Navbar.module.css'
import { useEffect, useState } from "react"

function Navbar(){
    const navigate = useNavigate()
    const [sections, setSections] = useState([])
    const loggedUser = JSON.parse(localStorage.getItem('loggedUser')) || null;

    useEffect(() => {
        fetch('http://localhost:5000/sections').then(resp => resp.json()).then(data => setSections(data))
    }, [])

    const userSectionObj = sections.find(s => String(s.id) === String(loggedUser?.section_id));
    const isAdmin = loggedUser?.roleName === 'ADMIN';

    function handleLogout() {
        localStorage.removeItem('loggedUser');
        navigate('/login');
    }

    return(
        <nav className={styles.navbar}>
            <Container>
                <ul className={styles.list}>
                    <li className={styles.item_home}><Link to="/home">Home</Link></li>
                    
                    <div className={styles.nav_menu_group}>
                        <li className={styles.item}><Link to="/orders">Ordens de Serviço</Link></li>
                        
                        {isAdmin && <li className={styles.item}><Link to="/sections">Seções</Link></li>}
                        {isAdmin && <li className={styles.item}><Link to="/users">Usuários</Link></li>}
                        
                        <li className={styles.item}><Link to="/technicians">Técnicos</Link></li>
                        
                        {loggedUser && (
                            <div className={styles.user_session_block}>
                                <div className={styles.user_info_label}>
                                    <span className={styles.user_name}>{loggedUser.name}</span>
                                    <span className={styles.user_section}>[{userSectionObj ? userSectionObj.name : '...'}]</span>
                                </div>
                                <button onClick={handleLogout} className={styles.btn_sair}>SAIR</button>
                            </div>
                        )}
                    </div>
                </ul>
            </Container>
      </nav>
    )
}

export default Navbar;
