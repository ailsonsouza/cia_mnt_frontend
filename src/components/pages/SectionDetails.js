import styles from '../styles/styles_pages/SectionDetails.module.css';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

function SectionDetails() {
    const location = useLocation();
    const navigate = useNavigate();
    const { section, action } = location.state || {};

    const isReadOnly = action === 'DETALHAR';
    const isNewSection = action === 'NEWSECTION';

    const [sectionName, setSectionName] = useState(isNewSection ? '' : (section?.name || ''));
    const [selectedChief, setSelectedChief] = useState(isNewSection ? '' : (section?.chief || ''));
    const [allUsers, setAllUsers] = useState([]);
    const [orders, setOrders] = useState([]);

    const API_BASE_URL = 'http://localhost:8080/api';


    useEffect(() => {
        // CORREÇÃO AQUI: Alterado de http://localhost:5000/users para a URL real do Spring Boot
        fetch(`${API_BASE_URL}/users`)
            .then(resp => resp.json())
            .then(data => setAllUsers(data))
            .catch(err => console.log(err));

        if (!isNewSection) {
            fetch(`${API_BASE_URL}/orders`)
                .then(resp => resp.json())
                .then(data => setOrders(data))
                .catch(err => console.log(err));
        }
    }, [isNewSection]);

    async function handleSave(e) {
        e.preventDefault();

        const payload = {
            name: sectionName.trim(),
            chief: selectedChief,
            status: isNewSection ? "ACTIVE" : (section?.status || "ACTIVE")
        };

        const url = isNewSection ? `${API_BASE_URL}/sections` : `${API_BASE_URL}/sections/${section.id}`;
        const method = isNewSection ? 'POST' : 'PATCH';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Erro no servidor.");
            }

            alert(isNewSection ? "Seção cadastrada com sucesso!" : "Seção atualizada!");
            navigate('/sections');
        } catch (err) {
            alert(`Erro: ${err.message}`);
        }
    }

    return (
        <div>
            <div className={styles.header_details}>
                <h2>{isNewSection ? "Cadastrar Nova Seção" : `Configurações: ${sectionName}`}</h2>
                <Link to="/sections" className={styles.btn_voltar}>VOLTAR</Link>
            </div>

            <form onSubmit={handleSave} className={styles.form_container}>
                <div className={styles.form_group}>
                    <label>NOME DA SEÇÃO</label>
                    <input 
                        type='text' 
                        value={sectionName} 
                        onChange={(e) => setSectionName(e.target.value)} 
                        disabled={isReadOnly} 
                        required 
                    />
                </div>
                <div className={styles.form_group}>
                    <label>CHEFE DA SEÇÃO</label>
                    <select 
                        onChange={(e) => setSelectedChief(e.target.value)} 
                        value={selectedChief} 
                        disabled={isReadOnly}
                        required
                    >
                        <option value="">Selecione um chefe</option>
                        {allUsers.map((user) => (
                            <option key={user.id} value={user.name}>{user.name}</option>
                        ))}
                    </select>
                </div>
                
                <div className={styles.form_group}>
                    <label>O.S. ABERTAS</label>
                    <input type='text' value={isNewSection ? 0 : (section?.openingOrders || 0)} disabled />
                </div>
                <div className={styles.form_group}>
                    <label>O.S. FECHADAS</label>
                    <input type='text' value={isNewSection ? 0 : (section?.closingOrders || 0)} disabled />
                </div>

                {!isReadOnly && (
                    <button type="submit" className={styles.btn_salvar}>
                        {isNewSection ? 'CADASTRAR SEÇÃO' : 'SALVAR ALTERAÇÕES'}
                    </button>
                )}
            </form>
        </div>
    );
}

export default SectionDetails;
