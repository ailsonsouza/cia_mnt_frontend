import styles from '../styles/styles_layout/CardSections.module.css';
import { BsPencil, BsEye, BsFillTrashFill } from 'react-icons/bs';
import { Link } from 'react-router-dom';

function CardSections({ section, handleRemove }) {
    const statusColors = {
        "ACTIVE": styles.status_active,
        "1": styles.status_active,
        "INACTIVE": styles.status_inactive,
        "2": styles.status_inactive
    };

    const isStatusActive = section?.status === "ACTIVE" || section?.status === "1";
    const circleColorClass = statusColors[section?.status] || styles.status_inactive;

    return (
        <div className={styles.card_general} id={`section-card-${section.id}`}>
            <div className={styles.title_container}>
                <h2>{section?.name}</h2>
                <div 
                    className={`${styles.status_circle} ${circleColorClass}`}
                    title={isStatusActive ? "Ativa" : "Inativa"}
                ></div>
            </div>
            
            <p><span>Chefe:</span> {section?.chief || 'Não definido'}</p>
            <p><span>O.S. Abertas:</span> {section?.openingOrders || 0}</p>
            <p><span>O.S. Fechadas:</span> {section?.closingOrders || 0}</p>

            <div className={styles.project_card_actions}>
                <Link to="/sectiondetails" state={{ section: section, action: 'EDITAR' }} >
                    <BsPencil /> EDITAR
                </Link>
                <Link to="/sectiondetails" state={{ section: section, action: 'DETALHAR' }}>
                    <BsEye /> DETALHAR
                </Link>
                <button onClick={() => handleRemove(section.id)} className={styles.btn_excluir}>
                    <BsFillTrashFill /> EXCLUIR
                </button>
            </div>
        </div>
    );
}

export default CardSections;