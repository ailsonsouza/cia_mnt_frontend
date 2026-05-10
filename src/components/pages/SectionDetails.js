import styles from '../styles/styles_pages/SectionDetails.module.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Container from '../layout/Container';
import CardOS from '../layout/Card';
import { Link } from "react-router-dom";

function SectionDetails (){
    const location = useLocation();
    const navigate = useNavigate();
    const { section, action } = location.state || {};
    
    const isReadOnly = action === 'DETALHAR'; 
    const isNewSection = action === 'NEWSECTION';

    const [sectionName, setSectionName] = useState(isNewSection ? '' : (section?.name || ''));
    const [selectedChief, setSelectedChief] = useState(isNewSection ? '' : (section?.chief || ''));
    const [allUsers, setAllUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    
    const sectionOrders = isNewSection ? [] : orders.filter((order) => String(order.section) === String(section?.id));

    useEffect(() => {
        fetch('http://localhost:5000/users').then(resp => resp.json()).then(data => setAllUsers(data))
    }, [] );

    useEffect(() => {
        if (!isNewSection) {
            fetch('http://localhost:5000/orders').then(resp => resp.json()).then(data => setOrders(data))
        }
    }, [isNewSection] );

    function handleSave(e) {
        e.preventDefault();
        const payload = {
            name: sectionName.toUpperCase().trim(),
            chief: selectedChief
        };

        if (isNewSection) {
            fetch('http://localhost:5000/sections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...payload, openingOrders: 0, closingOrders: 0 }),
            }).then(() => navigate('/sections'));
        } else {
            fetch(`http://localhost:5000/sections/${section.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }).then(() => navigate('/sections'));
        }
    }

    return(
        <div>
            <div className={styles.header_details}>
                <h2>{isNewSection ? "Cadastrar Nova Seção" : `Configurações: ${sectionName}`}</h2>
                <Link to="/sections" className={styles.btn_voltar}>VOLTAR</Link>
            </div>
            
            <form onSubmit={handleSave} className={styles.form_container}>
                <div className={styles.form_group}>
                    <label>NOME DA SEÇÃO</label>
                    <input type='text' value={sectionName} onChange={(e) => setSectionName(e.target.value.toUpperCase())} disabled={isReadOnly} required />
                </div>
                <div className={styles.form_group}>
                    <label>CHEFE DA SEÇÃO</label>
                    <select onChange={(e) => setSelectedChief(e.target.value)} value={selectedChief} disabled={isReadOnly}>
                        <option value="">Selecione um chefe</option>
                        {allUsers.map((user) => <option key={user.id} value={user.name}>{user.name}</option>)}
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
                {!isReadOnly && <button type="submit" className={styles.btn_salvar}>{isNewSection ? 'CADASTRAR SEÇÃO' : 'SALVAR ALTERAÇÕES'}</button>}
            </form>

            {!isNewSection && (
                <div className={styles.serviceOrders}>
                    <h3>ORDENS DE SERVIÇO DO(A) {sectionName}</h3>
                    <Container>
                        {sectionOrders.length > 0 ? sectionOrders.map(order => <CardOS key={order.id} order={order} hideActions={isReadOnly} />) : <p>Nenhuma ordem cadastrada.</p>}
                    </Container>
                </div>
            )}
        </div>
    );
}

export default SectionDetails;
