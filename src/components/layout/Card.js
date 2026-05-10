import styles from '../styles/styles_layout/Card.module.css'
import { Link } from 'react-router-dom'
import { BsPencil, BsEye, BsFillTrashFill, BsArrowCounterclockwise } from 'react-icons/bs'

function CardOS({ order, handleRemove, hideActions, sectionName, handleReopen }){

    // Captura o usuário logado para verificar o nível de acesso (Role)
    const loggedUser = JSON.parse(localStorage.getItem('loggedUser')) || null;
    const isChiefOrAdmin = loggedUser?.roleName === 'ADMIN' || loggedUser?.roleName === 'CHIEF';

    const remove = (e) => {
        e.preventDefault()
        if (window.confirm(`Deseja realmente excluir a ${order?.orderNumber || 'Ordem de Serviço'}?`)) {
            handleRemove(order.id)
        }
    }

    const triggerReopen = (e) => {
        e.preventDefault()
        if (window.confirm(`Deseja reabrir a ${order?.orderNumber || 'Ordem de Serviço'}?`)) {
            handleReopen(order.id)
        }
    }

    const totalBudget = Number(order?.partsValue || 0) + Number(order?.serviceValue || 0)
    const isClosed = order?.status === 'CLOSE'

    return (
        <div className={styles.project_card} id={`order-card-${order.id}`}>
            <h4>{order?.orderNumber || "ORDEM DE SERVIÇO"}</h4>
            
            <p><span>ORÇAMENTO:</span> R$ {totalBudget.toFixed(2)}</p>
            <p><span>SEÇÃO: </span> {sectionName || order?.section}</p>
            <p><span>CLASSE: </span> {order?.category_id}</p>
            <p><span>ITEM: </span> {order?.item}</p>
            <p><span>Nº SÉRIE: </span> {order?.serialNumber}</p>
            <p><span>OM: </span> {order?.destiny}</p>

            {!hideActions && (
                <div className={styles.project_card_actions}>
                    
                    {/* Se a ordem NÃO estiver fechada, permite EDITAR normalmente */}
                    {!isClosed && (
                        <Link to="/neworder" state={{ order: order, action: 'EDITAR' }}>
                            <BsPencil /> EDITAR
                        </Link>
                    )}

                    {/* Botão de visualizar/detalhes sempre visível */}
                    <Link to="/neworder" state={{ order: order, action: 'VISUALIZAR' }}>
                        <BsEye /> DETALHES
                    </Link>

                    {/* BOTÃO REABRIR: Aparece apenas se a ordem estiver fechada E o usuário for ADMIN ou CHIEF */}
                    {isClosed && isChiefOrAdmin && (
                        <button onClick={triggerReopen} className={styles.btn_reabrir}>
                            <BsArrowCounterclockwise /> REABRIR
                        </button>
                    )}

                    {/* Só permite excluir se a ordem NÃO estiver concluída */}
                    {!isClosed && (
                        <button onClick={remove} className={styles.btn_excluir}>
                            <BsFillTrashFill /> EXCLUIR
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

export default CardOS
