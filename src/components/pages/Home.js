import { useState, useEffect } from 'react';
import Container from '../layout/Container';
import styles from '../styles/styles_pages/Home.module.css';
import { Link, useNavigate } from 'react-router-dom';
import { BsPencil, BsEye } from 'react-icons/bs';

function Home() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [sections, setSections] = useState([]);
    const [technicians, setTechnicians] = useState([]);

    const loggedUser = JSON.parse(localStorage.getItem('loggedUser')) || null;
    const isAdmin = loggedUser?.roleName === 'ADMIN';
    const isUser = loggedUser?.roleName === 'USER';

    useEffect(() => {
        // Aponta todas as requisições para a porta 8080 do backend Spring Boot
        fetch('http://localhost:8080/api/orders').then(r => r.json()).then(data => setOrders(data)).catch(err => console.log(err));
        fetch('http://localhost:8080/api/sections').then(r => r.json()).then(data => setSections(data)).catch(err => console.log(err));
        fetch('http://localhost:8080/api/technicians').then(r => r.json()).then(data => setTechnicians(data)).catch(err => console.log(err));
    }, []);

    const filteredOrders = isAdmin 
        ? orders 
        : orders.filter(o => String(o.section) === String(loggedUser?.section_id));

    const filteredTechs = isAdmin 
        ? technicians 
        : technicians.filter(t => String(t.section_id) === String(loggedUser?.section_id));

    const totalOpen = filteredOrders.filter(o => o.status === 'OPEN').length;
    const totalClosed = filteredOrders.filter(o => o.status === 'CLOSE').length;

    const criticalOrders = filteredOrders
        .filter(o => o.status === 'OPEN')
        .slice(0, 4);

    const handleNavigate = (order, actionType) => {
        navigate('/neworder', { state: { order, action: actionType } });
    };

    return (
        <div className={styles.home_page}>
            <Container customClass="column">
                
                <div className={styles.top_header_row}>
                    <div className={styles.access_badge}>
                        NÍVEL: {loggedUser?.roleName || 'N/A'}
                    </div>
                </div>

                {/* BLOCO 1: CARDS DE RESUMO */}
                <div className={styles.cards_container}>
                    <div className={styles.stat_card}>
                        <h3>O.S. EM ABERTO</h3>
                        <p className={styles.open_number}>{totalOpen}</p>
                    </div>
                    <div className={styles.stat_card}>
                        <h3>O.S. CONCLUÍDAS</h3>
                        <p className={styles.closed_number}>{totalClosed}</p>
                    </div>
                    <div className={styles.stat_card}>
                        <h3>TÉCNICOS NA SEÇÃO</h3>
                        <p className={styles.tech_number}>{filteredTechs.length}</p>
                    </div>
                </div>

                {/* BLOCO 2: VISÃO EXCLUSIVA DO ADMINISTRADOR */}
                {isAdmin && (
                    <div className={styles.admin_section}>
                        <h2>PAINEL ESTRATÉGICO DE MANUTENÇÃO (VISÃO GLOBAL)</h2>
                        <div className={styles.admin_grid}>
                            {sections.map(sec => {
                                const secOrders = orders.filter(o => String(o.section) === String(sec.id));
                                const secOpen = secOrders.filter(o => o.status === 'OPEN').length;
                                const secClosed = secOrders.filter(o => o.status === 'CLOSE').length;
                                return (
                                    <div key={sec.id} className={styles.admin_sec_card}>
                                        <h4>{sec.name}</h4>
                                        <div className={styles.admin_sec_data}>
                                            <p>Abertas: <span>{secOpen}</span></p>
                                            <p>Fechadas: <span>{secClosed}</span></p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* BLOCO 3: FILA DE PRIORIDADE */}
                {!isAdmin && (
                    <div className={styles.critical_section}>
                        <h2>FILA DE PRIORIDADE DA SEÇÃO</h2>
                        <div className={styles.table_container}>
                            {criticalOrders.length > 0 ? (
                                <table className={styles.custom_table}>
                                    <thead>
                                        <tr>
                                            <th>NÚMERO DA O.S.</th>
                                            <th>ITEM</th>
                                            <th>DATA ABERTURA</th>
                                            <th>OM DESTINO</th>
                                            <th className={styles.actions_header}>AÇÕES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {criticalOrders.map(order => (
                                            <tr key={order.id}>
                                                <td className={styles.os_col}>{order.orderNumber}</td>
                                                <td>{order.item}</td>
                                                <td>{order.openDate}</td>
                                                <td>{order.destiny}</td>
                                                <td className={styles.actions_cell}>
                                                    {/* Corrigido para 'DETALHES', alinhando com a trava de segurança */}
                                                    <button 
                                                        onClick={() => handleNavigate(order, 'DETALHES')}
                                                        className={styles.icon_btn_view}
                                                        title="Visualizar Ordem de Serviço"
                                                    >
                                                        <BsEye />
                                                    </button>
                                                    
                                                    <button 
                                                        onClick={() => handleNavigate(order, 'EDITAR')}
                                                        className={styles.icon_btn_edit}
                                                        title="Editar Ordem de Serviço"
                                                    >
                                                        <BsPencil />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className={styles.no_records}>Sem ordens pendentes de manutenção.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* BLOCO 4: ATALHOS RÁPIDOS */}
                <div className={styles.shortcuts_section}>
                    <h2>AÇÕES RÁPIDAS</h2>
                    <div className={styles.btn_group}>
                        {!isUser && (
                            <Link to="/neworder" state={{ action: 'NEWORDER' }} className={styles.shortcut_btn}>
                                Emitir Nova O.S.
                            </Link>
                        )}
                    </div>
                </div>
            </Container>
        </div>
    );
}

export default Home;
