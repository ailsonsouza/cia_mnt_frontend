import styles from '../styles/styles_layout/CardSections.module.css';
import { BsPencil, BsEye, BsFillTrashFill, BsCheckCircleFill, BsShieldLockFill } from 'react-icons/bs';
import { Link } from 'react-router-dom';

function CardSections({ section, handleRemove }) {
    const statusColors = {
        "ACTIVE": styles.status_active,
        "INACTIVE": styles.status_inactive,
    };

    const isStatusActive = section?.status === "ACTIVE";
    const circleColorClass = statusColors[section?.status] || styles.status_inactive;

    const formatModuleName = (mod) => {
        if (mod === 'ORDEM_SERVICO') return 'O.S.';
        if (mod === 'CONTROLE_CREDITOS') return 'Créditos';
        return mod;
    };

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

            <div className={styles.modules_container}>
                <span>ACESSOS HABILITADOS:</span>
                <div className={styles.modules_list}>
                    {section?.modules && section.modules.length > 0 ? (
                        section.modules.map((mod, index) => (
                            <div key={index} className={styles.module_group}>
                                <span className={styles.module_badge}>
                                    <BsCheckCircleFill className={styles.module_icon} />
                                    {formatModuleName(mod)}
                                </span>
                                {/* Exibe o nível se for o módulo de créditos */}
                                {mod === 'CONTROLE_CREDITOS' && section.creditLevel !== 'NENHUM' && (
                                    <span className={styles.level_badge}>
                                        <BsShieldLockFill /> {section.creditLevel}
                                    </span>
                                )}
                            </div>
                        ))
                    ) : (
                        <span className={styles.no_modules}>Sem permissões</span>
                    )}
                </div>
            </div>

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