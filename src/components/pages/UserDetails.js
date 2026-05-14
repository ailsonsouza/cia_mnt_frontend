import styles from '../styles/styles_pages/UserDetails.module.css'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

function UserDetails() {
    const location = useLocation()
    const navigate = useNavigate()
    const { user, action } = location.state || {}

    const isReadOnly = action === 'DETALHAR'
    const isNew = action === 'NEWUSER'

    // Estados Controlados do Usuário
    const [name, setName] = useState(isNew ? '' : (user?.name || ''))
    const [selectedSection, setSelectedSection] = useState(isNew ? '' : (user?.section_id || ''))
    const [selectedRole, setSelectedRole] = useState(isNew ? '' : (user?.level_id || ''))
    const [password, setPassword] = useState(isNew ? '' : (user?.password || ''))
    const [confirmPassword, setConfirmPassword] = useState(isNew ? '' : (user?.password || ''))

    const [sections, setSections] = useState([])
    const [roles, setRoles] = useState([])

    useEffect(() => {
        fetch('http://localhost:8080/api/sections', { method: 'GET', headers: { 'Content-Type': 'application/json' } })
            .then(resp => resp.json())
            .then(data => setSections(data))
            .catch(err => console.log(err))

        fetch('http://localhost:8080/api/roles', { method: 'GET', headers: { 'Content-Type': 'application/json' } })
            .then(resp => resp.json())
            .then(data => setRoles(data))
            .catch(err => console.log(err))
    }, [])

    function handleSave(e) {
        e.preventDefault()

        if (password !== confirmPassword) {
            alert("As senhas não coincidem!")
            return
        }

        const payload = {
            name: name.toUpperCase().trim(),
            section_id: selectedSection,
            level_id: selectedRole,
            password: password
        }

        if (isNew) {
            fetch('http://localhost:8080/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(resp => { if (!resp.ok) throw new Error(); return resp.json() })
            .then(() => { alert("Usuário cadastrado!"); navigate('/users') })
            .catch(err => console.log(err))
        } else {
            fetch(`http://localhost:8080/api/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(resp => { if (!resp.ok) throw new Error(); return resp.json() })
            .then(() => { alert("Cadastro de usuário updated!"); navigate('/users') })
            .catch(err => console.log(err))
        }
    }

    const getHeaderTitle = () => {
        if (isNew) return "Cadastrar Novo Usuário"
        if (isReadOnly) return `Visualizar Usuário: ${name}`
        return `Editar Usuário: ${name}`
    }

    return (
        <div>
            <div className={styles.header_details}>
                <h2>{getHeaderTitle()}</h2>
                <Link to="/users" className={styles.btn_voltar}>
                    VOLTAR
                </Link>
            </div>

            <form onSubmit={handleSave} className={styles.form_container}>
                <div className={styles.form_group}>
                    <label>NOME</label>
                    <input 
                        type='text' 
                        name='name' 
                        placeholder='NOME DO USUÁRIO'
                        value={name}
                        onChange={(e) => setName(e.target.value.toUpperCase())}
                        disabled={isReadOnly}
                        required 
                    />
                </div>

                <div className={styles.form_group}>
                    <label>SEÇÃO</label>
                    <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} disabled={isReadOnly} required>
                        <option value="">Selecione uma seção</option>
                        {sections.map((sec) => (
                            <option key={sec.id} value={sec.id}>{sec.name}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.form_group}>
                    <label>NÍVEL</label>
                    <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} disabled={isReadOnly} required>
                        <option value="">Selecione um nível</option>
                        {roles.map((r) => (
                            <option key={r.id} value={r.id}>{r.name} - {r.description}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.form_group}>
                    <label>SENHA</label>
                    <input 
                        type='password' 
                        placeholder='INSIRA A SENHA'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isReadOnly}
                        required 
                    />
                </div>

                <div className={styles.form_group}>
                    <label>CONFIRMAÇÃO</label>
                    <input 
                        type='password' 
                        placeholder='CONFIRME A SENHA'
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isReadOnly}
                        required 
                    />
                </div>

                {!isReadOnly && (
                    <button type="submit" className={styles.btn_salvar}>
                        {isNew ? 'CADASTRAR USUÁRIO' : 'SALVAR ALTERAÇÕES'}
                    </button>
                )}
            </form>
        </div>
    )
}

export default UserDetails
