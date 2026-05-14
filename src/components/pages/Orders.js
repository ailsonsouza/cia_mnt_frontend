import { useState, useEffect } from "react"
import CardOS from '../layout/Card'
import styles from '../styles/styles_pages/Orders.module.css'
import Container from '../layout/Container'
import { Link } from "react-router-dom"
import { BsChevronDown } from 'react-icons/bs'

function Orders(){
    const [orders, setOrders] = useState([])
    const [sections, setSections] = useState([])
    
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [yearDropdownOpen, setYearDropdownOpen] = useState(false)
    
    const [activeFilter, setActiveFilter] = useState({ id: 'GERAL', name: 'GERAL' })
    
    const currentYear = new Date().getFullYear().toString();
    const [activeYear, setActiveYear] = useState(currentYear)

    const loggedUser = JSON.parse(localStorage.getItem('loggedUser')) || null;

    // Função para carregar as ordens em tempo real da API do Spring Boot
    const loadData = () => {
        fetch('http://localhost:8080/api/orders')
            .then(resp => resp.json())
            .then(data => setOrders(data))
            .catch(err => console.log(err))
    }

    useEffect(() => {
        loadData()
        fetch('http://localhost:8080/api/sections')
            .then(resp => resp.json())
            .then(data => setSections(data))
            .catch(err => console.log(err))
    }, [])

    function removeOrder(id) {
        const cardElement = document.getElementById(`order-card-${id}`);
        if (cardElement) { 
            cardElement.style.opacity = '0'; 
            cardElement.style.transform = 'scale(0.8)'; 
        }

        setTimeout(() => {
            fetch(`http://localhost:8080/api/orders/${id}`, { method: 'DELETE' })
                .then(resp => {
                    if (!resp.ok) throw new Error();
                    setOrders(orders.filter((order) => order.id !== id))
                })
                .catch(err => {
                    console.log(err);
                    if (cardElement) {
                        cardElement.style.opacity = '1';
                        cardElement.style.transform = 'scale(1)';
                    }
                    alert("Não foi possível excluir a ordem de serviço.");
                })
        }, 400);
    }

    function reopenOrder(id) {
        const payload = {
            status: 'OPEN',
            closingDate: '' // Zera a data de fechamento ao reabrir
        }

        fetch(`http://localhost:8080/api/orders/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(resp => {
            if (!resp.ok) throw new Error()
            alert("Ordem de serviço reaberta com sucesso!")
            loadData() 
        })
        .catch(() => alert("Falha ao tentar reabrir a ordem."))
    }

    function handleSelectSection(id, name) {
        setActiveFilter({ id, name });
        setDropdownOpen(false); 
    }

    function handleSelectYear(year) {
        setActiveYear(year);
        setYearDropdownOpen(false);
    }

    const currentLoggedSectionObj = sections.find(s => String(s.id) === String(loggedUser?.section_id));
    const isAdmin = loggedUser?.roleName === 'ADMIN';

    const baseFilteredOrders = orders.filter(order => {
        const orderYear = order.openDate ? order.openDate.substring(0, 4) : '';
        const matchesYear = orderYear === activeYear;

        let matchesSection = false;
        if (isAdmin) {
            matchesSection = activeFilter.id === 'GERAL' ? true : String(order.section) === String(activeFilter.id);
        } else {
            matchesSection = String(order.section) === String(loggedUser?.section_id);
        }

        return matchesYear && matchesSection;
    });

    const openOrders = baseFilteredOrders.filter(o => o.status === 'OPEN');
    const closedOrders = baseFilteredOrders.filter(o => o.status === 'CLOSE');

    const availableYears = [...new Set(orders.map(o => o.openDate ? o.openDate.substring(0, 4) : ''))]
        .filter(Boolean)
        .sort((a, b) => b - a);

    if (!availableYears.includes(currentYear)) {
        availableYears.unshift(currentYear);
    }

    return(
        <div className={styles.orders_page}>
            <h1>ORDENS DE SERVIÇO</h1>

            <Container customClass="column">
                <div className={styles.containerBtn}>
                    <div className={styles.dropdown_container}>
                        <button className={styles.filterButton} onClick={() => setYearDropdownOpen(!yearDropdownOpen)}>
                            ANO: {activeYear} <BsChevronDown />
                        </button>
                        {yearDropdownOpen && (
                            <ul className={styles.dropdown_menu}>
                                {availableYears.map(year => (
                                    <li key={year} onClick={() => handleSelectYear(year)}>{year}</li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {isAdmin && (
                        <div className={styles.dropdown_container}>
                            <button className={styles.filterButton} onClick={() => setDropdownOpen(!dropdownOpen)}>
                                SEÇÃO: {activeFilter.name} <BsChevronDown />
                            </button>
                            {dropdownOpen && (
                                <ul className={styles.dropdown_menu}>
                                    <li onClick={() => handleSelectSection('GERAL', 'GERAL')}>GERAL (MOSTRAR TODAS)</li>
                                    {sections.map(sec => (
                                        <li key={sec.id} onClick={() => handleSelectSection(sec.id, sec.name)}>{sec.name}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {!isAdmin && currentLoggedSectionObj && (
                        <div className={styles.section_indicator}>SEÇÃO ATUAL: {currentLoggedSectionObj.name}</div>
                    )}

                    <Link to="/newOrder" state={{ action: 'NEWORDER' }} className={styles.newOrder}>
                        NOVA ORDEM
                    </Link>
                </div>

                <div className={styles.status_group}>
                    <h2 className={styles.status_title_open}>ORDENS EM ABERTO ({openOrders.length})</h2>
                    <div className={styles.grid_container}>
                        {openOrders.length > 0 ? (
                            openOrders.map((order) => {
                                const sectionData = sections.find(s => String(s.id) === String(order.section));
                                return (
                                    <CardOS 
                                        key={order.id} 
                                        order={order} 
                                        handleRemove={removeOrder} 
                                        sectionName={sectionData?.name}
                                        handleReopen={reopenOrder}
                                    />
                                )
                            })
                        ) : (
                            <p className={styles.no_records}>Nenhuma ordem aberta localizada para este ano.</p>
                        )}
                    </div>
                </div>

                <div className={styles.status_group}>
                    <h2 className={styles.status_title_closed}>ORDENS CONCLUÍDAS ({closedOrders.length})</h2>
                    <div className={styles.grid_container}>
                        {closedOrders.length > 0 ? (
                            closedOrders.map((order) => {
                                const sectionData = sections.find(s => String(s.id) === String(order.section));
                                return (
                                    <CardOS 
                                        key={order.id} 
                                        order={order} 
                                        handleRemove={removeOrder} 
                                        sectionName={sectionData?.name}
                                        handleReopen={reopenOrder}
                                    />
                                )
                            })
                        ) : (
                            <p className={styles.no_records}>Nenhuma ordem concluída localizada para este ano.</p>
                        )}
                    </div>
                </div>
            </Container>
        </div>
    )
}

export default Orders;
