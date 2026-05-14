import Container from '../layout/Container'
import { useState, useEffect } from 'react'
import styles from '../styles/styles_pages/Users.module.css'
import { Link } from "react-router-dom"
import { BsPencil, BsEye, BsFillTrashFill } from 'react-icons/bs'

function Users() {
    const [users, setUsers] = useState([])
    const [sections, setSections] = useState([])
    const [roles, setRoles] = useState([])

    // Carrega Usuários, Seções e Roles das APIs reais do Spring Boot
    useEffect(() => {
        fetch('http://localhost:8080/api/users', { method: 'GET', headers: { 'Content-Type': 'application/json' } })
            .then(resp => resp.json())
            .then(data => setUsers(data))
            .catch(err => console.log(err))

        fetch('http://localhost:8080/api/sections', { method: 'GET', headers: { 'Content-Type': 'application/json' } })
            .then(resp => resp.json())
            .then(data => setSections(data))
            .catch(err => console.log(err))

        fetch('http://localhost:8080/api/roles', { method: 'GET', headers: { 'Content-Type': 'application/json' } })
            .then(resp => resp.json())
            .then(data => setRoles(data))
            .catch(err => console.log(err))
    }, [])

    // Função de Exclusão com Efeito Visual comunicando com o Spring Boot
    function removeUser(id) {
        const cardElement = document.getElementById(`user-card-${id}`)
        if (cardElement) {
            cardElement.style.opacity = '0'
            cardElement.style.transform = 'scale(0.8)'
        }

        setTimeout(() => {
            fetch(`http://localhost:8080/api/users/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } })
                .then(resp => {
                    if (!resp.ok) throw new Error()
                    setUsers(users.filter((user) => user.id !== id))
                })
                .catch(err => {
                    console.log(err)
                    if (cardElement) {
                        cardElement.style.opacity = '1'
                        cardElement.style.transform = 'scale(1)'
                    }
                    alert("Não foi possível excluir o usuário.")
                })
        }, 400)
    }

    return (
        <div className={styles.users_page}>
            <h1>USUÁRIOS</h1>
            
            <Container customClass="column">
                <div className={styles.containerBtn}>
                    <Link to="/userdetails" state={{ action: 'NEWUSER' }} className={styles.newUser}>
                        NOVO USUÁRIO
                    </Link>
                </div>

                <div className={styles.grid_container}>
                    {users.length > 0 ? (
                        users.map((user) => {
                            const sectionData = sections.find(s => String(s.id) === String(user.section_id))
                            const roleData = roles.find(r => String(r.id) === String(user.level_id))

                            return (
                                <div className={styles.cardUser} key={user.id} id={`user-card-${user.id}`}>
                                    <h2>{user.name}</h2>
                                    <p><span>Seção: </span>{sectionData?.name || "Não atribuída"}</p>
                                    <p><span>Nível: </span>{roleData?.name || "Não atribuído"}</p>

                                    <div className={styles.project_card_actions}>
                                        <Link to="/userdetails" state={{ user: user, action: 'EDITAR' }}>
                                            <BsPencil /> EDITAR
                                        </Link>
                                        <Link to="/userdetails" state={{ user: user, action: 'DETALHAR' }}>
                                            <BsEye /> DETALHAR
                                        </Link>
                                        <button onClick={() => window.confirm(`Excluir usuário "${user.name}"?`) && removeUser(user.id)} className={styles.btn_excluir}>
                                            <BsFillTrashFill /> EXCLUIR
                                        </button>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <p>Nenhum usuário cadastrado.</p>
                    )}
                </div>
            </Container>
        </div>
    )
}

export default Users
