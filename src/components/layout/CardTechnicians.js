import styles from '../styles/styles_layout/CardTechnicians.module.css'
import { BsPencil, BsEye, BsFillTrashFill } from 'react-icons/bs'
import { Link } from 'react-router-dom'

function CardTechnicians({ technician, sectionName, handleRemove }){

    const remove = (e) => {
        e.preventDefault()
        // Solicita confirmação nativa antes de apagar
        if (window.confirm(`Deseja realmente excluir o técnico "${technician?.name}"?`)) {
            handleRemove(technician.id)
        }
    }

    return(
        /* ID dinâmico injetado para permitir o efeito visual de saída */
        <div className={styles.cardTechnicians} id={`technician-card-${technician?.id}`}>
            <h2>{technician?.name}</h2>
            <p><span>Seção: </span>{sectionName || "Não atribuída"}</p>

            <div className={styles.project_card_actions}>
                <Link to="/techniciandetails" state={{ technician: technician, action: 'EDITAR' }} >
                    <BsPencil /> EDITAR 
                </Link>

                <Link to="/techniciandetails" state={{ technician: technician, action: 'DETALHAR' }}>
                    <BsEye /> DETALHAR
                </Link>

                <button onClick={remove} className={styles.btn_excluir}>
                    <BsFillTrashFill /> EXCLUIR
                </button>
            </div>
        </div>
    )
}

export default CardTechnicians
