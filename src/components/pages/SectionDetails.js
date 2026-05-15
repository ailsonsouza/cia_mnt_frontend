import styles from '../styles/styles_pages/SectionDetails.module.css';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BsGearFill, BsInfoCircleFill, BsLockFill, BsLayersFill } from 'react-icons/bs';

function SectionDetails() {
    const location = useLocation();
    const navigate = useNavigate();
    const { section, action } = location.state || {};

    const isReadOnly = action === 'DETALHAR';
    const isNewSection = action === 'NEWSECTION';

    const [sectionName, setSectionName] = useState(isNewSection ? '' : (section?.name || ''));
    const [selectedChief, setSelectedChief] = useState(isNewSection ? '' : (section?.chief || ''));
    const [modules, setModules] = useState(isNewSection ? [] : (section?.modules || []));
    const [creditLevel, setCreditLevel] = useState(isNewSection ? 'NENHUM' : (section?.creditLevel || 'NENHUM'));
    
    // NOVO: Estado para o Status da Seção (Padrão ACTIVE para novas)
    const [status, setStatus] = useState(isNewSection ? 'ACTIVE' : (section?.status || 'ACTIVE'));

    const [allUsers, setAllUsers] = useState([]);
    const API_BASE_URL = 'http://localhost:8080/api';

    useEffect(() => {
        fetch(`${API_BASE_URL}/users`)
            .then(resp => resp.json())
            .then(data => setAllUsers(data))
            .catch(err => console.log(err));
    }, []);

    const handleModuleChange = (moduleName) => {
        if (modules.includes(moduleName)) {
            const updatedModules = modules.filter(m => m !== moduleName);
            setModules(updatedModules);

            if (moduleName === 'CONTROLE_CREDITOS') {
                setCreditLevel('NENHUM');
            }
        } else {
            setModules([...modules, moduleName]);
            
            if (moduleName === 'CONTROLE_CREDITOS') {
                setCreditLevel('REQUISITANTE');
            }
        }
    };

    async function handleSave(e) {
        e.preventDefault();
        
        if(modules.length === 0) {
            alert("Selecione pelo menos um módulo de acesso.");
            return;
        }

        const finalCreditLevel = modules.includes('CONTROLE_CREDITOS') ? creditLevel : 'NENHUM';

        const payload = {
            name: sectionName.trim(),
            chief: selectedChief,
            modules: modules,
            creditLevel: finalCreditLevel, 
            status: status // Agora envia o estado dinâmico de status
        };

        const url = isNewSection ? `${API_BASE_URL}/sections` : `${API_BASE_URL}/sections/${section.id}`;
        const method = isNewSection ? 'POST' : 'PATCH';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error("Erro ao salvar dados.");

            alert(isNewSection ? "Seção cadastrada!" : "Seção atualizada!");
            navigate('/sections');
        } catch (err) {
            alert(err.message);
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.header_details}>
                <div className={styles.infoPrincipal}>
                    <BsGearFill className={styles.iconHeader} />
                    <h2>{isNewSection ? "Nova Seção" : `Configurações: ${sectionName}`}</h2>
                </div>
                <Link to="/sections" className={styles.btn_voltar}>← VOLTAR</Link>
            </div>

            <form onSubmit={handleSave} className={styles.form_container}>
                <div className={styles.grid_layout}>
                    <div className={styles.column}>
                        <div className={styles.cardSection}>
                            <div className={styles.sectionHeader}>
                                <BsInfoCircleFill /> <h4>1. IDENTIFICAÇÃO</h4>
                            </div>
                            <div className={styles.form_group}>
                                <label>Nome da Seção</label>
                                <input type='text' value={sectionName} onChange={(e) => setSectionName(e.target.value)} disabled={isReadOnly} required />
                            </div>

                            {/* NOVO: Seletor de Status */}
                            <div className={styles.form_group}>
                                <label>Status da Seção</label>
                                <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={isReadOnly} required>
                                    <option value="ACTIVE">ATIVA</option>
                                    <option value="INACTIVE">INATIVA</option>
                                </select>
                            </div>

                            <div className={styles.form_group}>
                                <label>Chefe Titular</label>
                                <select onChange={(e) => setSelectedChief(e.target.value)} value={selectedChief} disabled={isReadOnly} required>
                                    <option value="">Selecione um chefe</option>
                                    {allUsers.map((user) => <option key={user.id} value={user.name}>{user.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className={styles.cardSection}>
                            <div className={styles.sectionHeader}>
                                <BsLockFill /> <h4>2. MÓDULOS E PERMISSÕES</h4>
                            </div>
                            <div className={styles.modules_grid}>
                                <label className={styles.checkbox_item}>
                                    <input type="checkbox" checked={modules.includes('ORDEM_SERVICO')} onChange={() => handleModuleChange('ORDEM_SERVICO')} disabled={isReadOnly} />
                                    <span>Ordem de Serviço</span>
                                </label>
                                <label className={styles.checkbox_item}>
                                    <input type="checkbox" checked={modules.includes('CONTROLE_CREDITOS')} onChange={() => handleModuleChange('CONTROLE_CREDITOS')} disabled={isReadOnly} />
                                    <span>Controle de Créditos</span>
                                </label>
                            </div>

                            {modules.includes('CONTROLE_CREDITOS') && (
                                <div className={styles.form_group} style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                    <label style={{ color: '#2b6cb0' }}>Nível de Acesso (Créditos)</label>
                                    <select value={creditLevel} onChange={(e) => setCreditLevel(e.target.value)} disabled={isReadOnly} required>
                                        <option value="REQUISITANTE">REQUISITANTE</option>
                                        <option value="INTERMEDIARIO">INTERMEDIÁRIO</option>
                                        <option value="DESCENTRALIZADOR">DESCENTRALIZADOR</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.column}>
                        <div className={styles.cardSection}>
                            <div className={styles.sectionHeader}>
                                <BsLayersFill /> <h4>3. RESUMO DE PRODUÇÃO</h4>
                            </div>
                            <div className={styles.metric}>
                                <label>O.S. ABERTAS</label>
                                <span className={styles.valPadrao}>{isNewSection ? 0 : (section?.openingOrders || 0)}</span>
                            </div>
                            <div className={styles.metric}>
                                <label>O.S. FECHADAS</label>
                                <span className={styles.valPadrao}>{isNewSection ? 0 : (section?.closingOrders || 0)}</span>
                            </div>
                        </div>
                    </div>
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