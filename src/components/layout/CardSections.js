import styles from '../styles/styles_layout/CardSections.module.css'
import { BsPencil, BsEye, BsFillTrashFill } from 'react-icons/bs'
import { Link } from 'react-router-dom'

function CardSections ({ section, handleRemove }){

    const remove = (e) => {
        e.preventDefault()
        if (window.confirm(`Deseja realmente excluir a seção "${section?.name}"?`)) {
            handleRemove(section.id)
        }
    }

    return(
        /* Inserido o id dinâmico com o prefixo para identificação no DOM */
        <div className={styles.card_general} id={`section-card-${section.id}`}>
            <h2>{section?.name}</h2>
            <p><span>Chefe:</span> {section?.chief}</p>
            <p><span>Ordens de serviço abertas:</span> {section?.openingOrders}</p>
            <p><span>Ordens de serviço fechadas:</span> {section?.closingOrders}</p>

            <div className={styles.project_card_actions}>
                <Link to="/sectiondetails" state={{ section: section, action: 'EDITAR' }} >
                    <BsPencil /> EDITAR 
                </Link>

                <Link to="/sectiondetails" state={{ section: section, action: 'VISUALIZAR' }}>
                    <BsEye /> DETALHAR
                </Link>

                <button onClick={remove} className={styles.btn_excluir}>
                    <BsFillTrashFill /> EXCLUIR
                </button>
            </div>
        </div>
    )
}

export default CardSections
