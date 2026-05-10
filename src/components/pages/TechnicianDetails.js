import styles from '../styles/styles_pages/TechnicianDetails.module.css'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

function TechnicianDetails() {
    const location = useLocation()
    const navigate = useNavigate()
    const { technician, action } = location.state || {}

    // Flags de controle do modo da tela
    const isReadOnly = action === 'DETALHAR'
    const isNew = action === 'NEWTECHNICIAN'

    // Captura os dados do usuário autenticado guardados no localStorage no Login
    const loggedUser = JSON.parse(localStorage.getItem('loggedUser')) || null;
    const isAdmin = loggedUser?.roleName === 'ADMIN';

    // Estados locais controlados (Apenas Nome e Seção)
    const [name, setName] = useState(isNew ? '' : (technician?.name || ''))
    
    // REGRA DE NEGÓCIO: Se for novo cadastro e NÃO for ADMIN, força a seção do próprio chefe logado
    const [selectedSection, setSelectedSection] = useState(
        isNew 
            ? (isAdmin ? '' : (loggedUser?.section_id || '')) 
            : (technician?.section_id || '')
    )

    // Estado para as opções do select de Seções
    const [sections, setSections] = useState([])

    // Carrega as Seções da API
    useEffect(() => {
        fetch('http://localhost:5000/sections', { method: 'GET', headers: { 'Content-Type': 'application/json' } })
            .then(resp => resp.json())
            .then(data => setSections(data))
            .catch(err => console.log(err))
    }, [])

    function handleSave(e) {
        e.preventDefault()

        // REGRA DE NEGÓCIO: Se não for admin, força rigidamente o section_id do chefe no payload final
        const finalSectionId = isAdmin ? selectedSection : loggedUser?.section_id;

        // Payload contendo apenas as chaves necessárias
        const payload = {
            name: name.toUpperCase().trim(),
            section_id: finalSectionId
        }

        if (isNew) {
            fetch('http://localhost:5000/technicians', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(resp => { if (!resp.ok) throw new Error(); return resp.json() })
            .then(() => { alert("Técnico cadastrado com sucesso!"); navigate('/technicians') })
            .catch(err => console.log(err))
        } else {
            fetch(`http://localhost:5000/technicians/${technician.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(resp => { if (!resp.ok) throw new Error(); return resp.json() })
            .then(() => { alert("Cadastro de técnico atualizado!"); navigate('/technicians') })
            .catch(err => console.log(err))
        }
    }

    const getHeaderTitle = () => {
        if (isNew) return "Cadastrar Novo Técnico"
        if (isReadOnly) return `Visualizar Técnico: ${name}`
        return `Editar Técnico: ${name}`
    }

    return (
        <div>
            <div className={styles.header_details}>
                <h2>{getHeaderTitle()}</h2>
                <Link to="/technicians" className={styles.btn_voltar}>
                    VOLTAR
                </Link>
            </div>

            <form onSubmit={handleSave} className={styles.form_container}>
                <div className={styles.form_group}>
                    <label>NOME</label>
                    <input 
                        type='text' 
                        name='name' 
                        placeholder='NOME DO TÉCNICO'
                        value={name}
                        onChange={(e) => setName(e.target.value.toUpperCase())}
                        disabled={isReadOnly}
                        required 
                    />
                </div>

                <div className={styles.form_group}>
                    <label>SEÇÃO</label>
                    <select 
                        name='section' 
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        /* 
                          REGRA DE NEGÓCIO: O select fica bloqueado se for apenas leitura 
                          OU se for um cadastro novo feito por alguém que NÃO é ADMIN.
                        */
                        disabled={isReadOnly || (isNew && !isAdmin)}
                        required
                    >
                        <option value="">Selecione uma seção</option>
                        {sections.map((sec) => (
                            <option key={sec.id} value={sec.id}>{sec.name}</option>
                        ))}
                    </select>
                </div>

                {!isReadOnly && (
                    <button type="submit" className={styles.btn_salvar}>
                        {isNew ? 'CADASTRAR TÉCNICO' : 'SALVAR ALTERAÇÕES'}
                    </button>
                )}
            </form>
        </div>
    )
}

export default TechnicianDetails
