import style from '../styles/styles_pages/NewOrder.module.css'
import InputNewService from '../form/InputNewService'
import TextArea from '../form/TextArea'
import SubmitButton from '../form/SubmitButton'
import Select from '../form/Select'
import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'

function NewOrder() {
    const navigate = useNavigate()
    const location = useLocation()
    const { order: currentOrder, action } = location.state || {}

    const isNewOrder = action === 'NEWORDER' || !action

    const loggedUser = JSON.parse(localStorage.getItem('loggedUser')) || null;
    const isAdmin = loggedUser?.roleName === 'ADMIN';

    // Regra: 'DETALHES' trava tudo. O.S. fechada também trava tudo.
    const isReadOnly = action === 'DETALHES' || currentOrder?.status === 'CLOSE';

    const categoriasOpcoes = [
        { id: 'Classe IV', name: 'Classe IV' },
        { id: 'Classe V', name: 'Classe V' },
        { id: 'Classe VI', name: 'Classe VI' },
        { id: 'LANTERNAGEM', name: 'LANTERNAGEM' },
    ]

    const omSubordinadasOpcoes = [
        { id: 'Cia C 14ª Bda Inf Mtz', name: 'Cia C 14ª Bda Inf Mtz' },
        { id: '63º BI', name: '63º BI' },
        { id: '62º BI', name: '62º BI' },
        { id: '23º BI', name: '23º BI' },
        { id: '28º GAC', name: '28º GAC' },
        { id: '27º B Log', name: '27º B Log' },
        { id: '14ª Cia E Cmb', name: '14ª Cia E Cmb' },
        { id: '14º Pel PE', name: '14º Pel PE' }
    ]

    const [sections, setSections] = useState([])
    const [allTechnicians, setAllTechnicians] = useState([])

    const [order, setOrder] = useState({
        openDate: isNewOrder ? '' : (currentOrder?.openDate || ''),
        closingDate: isNewOrder ? '' : (currentOrder?.closingDate || ''),
        category_id: isNewOrder ? '' : (currentOrder?.category_id || ''),
        item: isNewOrder ? '' : (currentOrder?.item || ''),
        serialNumber: isNewOrder ? '' : (currentOrder?.serialNumber || ''),
        partsValue: isNewOrder ? '0' : (currentOrder?.partsValue || '0'),
        serviceValue: isNewOrder ? '0' : (currentOrder?.serviceValue || '0'),
        destiny: isNewOrder ? '' : (currentOrder?.destiny || ''),
        // REGRA DE NEGÓCIO: Se não for Admin, a seção já nasce definida e bloqueada
        section: isNewOrder ? (isAdmin ? '' : (loggedUser?.section_id || '')) : (currentOrder?.section || ''),
        technician: isNewOrder ? '' : (currentOrder?.technician || ''),
        manutention: isNewOrder ? '' : (currentOrder?.manutention || ''),
        observations: isNewOrder ? '' : (currentOrder?.observations || ''),
        status: isNewOrder ? 'OPEN' : (currentOrder?.status || 'OPEN')
    })

    useEffect(() => {
        fetch('http://localhost:8080/api/sections').then(resp => resp.json()).then(data => setSections(data))
        fetch('http://localhost:8080/api/technicians').then(resp => resp.json()).then(data => setAllTechnicians(data))
    }, [])

    function handleChange(e) {
        // SEGURANÇA: Impede alteração via teclado/inspeção caso o campo esteja travado para não-admins
        if (e.target.name === 'section' && !isAdmin) {
            return;
        }
        setOrder({ ...order, [e.target.name]: e.target.value })
    }

    function handleCloseOrder() {
        if (!window.confirm(`Deseja realmente encerrar a ${currentOrder?.orderNumber}?`)) {
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const finalSectionId = isAdmin ? order.section : loggedUser?.section_id;

        const payload = {
            ...order,
            status: 'CLOSE',
            closingDate: today,
            section: finalSectionId,
            user_id: loggedUser?.id
        };

        fetch(`http://localhost:8080/api/orders/${currentOrder.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(resp => {
                if (!resp.ok) throw new Error();
                alert("Ordem de serviço encerrada com sucesso!");
                navigate('/orders');
            })
            .catch(() => alert("Falha ao tentar encerrar a ordem de serviço."));
    }

    function handleSave(e) {
        e.preventDefault()

        const finalSectionId = isAdmin ? order.section : loggedUser?.section_id;

        const payload = {
            ...order,
            item: order.item.toUpperCase().trim(),
            serialNumber: order.serialNumber.toUpperCase().trim(),
            destiny: order.destiny,
            section: finalSectionId,
            user_id: loggedUser?.id
        }

        if (isNewOrder) {
            fetch('http://localhost:8080/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(resp => {
                    if (!resp.ok) throw new Error();
                    return resp.json();
                })
                .then(() => { alert("Ordem de serviço emitida!"); navigate('/orders') })
                .catch((err) => {
                    console.log(err);
                    alert("Erro ao tentar emitir a ordem de serviço.");
                })
        } else {
            fetch(`http://localhost:8080/api/orders/${currentOrder.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(resp => {
                    if (!resp.ok) throw new Error();
                    alert("Ordem de serviço atualizada!");
                    navigate('/orders');
                })
                .catch(() => alert("Falha ao tentar atualizar a ordem de serviço."));
        }
    }

    const filteredTechnicians = allTechnicians.filter(tech => {
        const targetSection = isAdmin ? order.section : loggedUser?.section_id;
        return String(tech.section_id) === String(targetSection);
    });

    return (
        <form className={style.page} onSubmit={handleSave}>
            <div className={style.header_sheet}>
                <h2>COMPANHIA DE MANUTENÇÃO</h2>
                <h1>{isNewOrder ? "NOVA ORDEM DE SERVIÇO" : currentOrder?.orderNumber}</h1>

                <Link to="/orders" className={style.btn_voltar}>VOLTAR</Link>

                {isNewOrder ? (
                    <div className={style.automatic_badge}>NÚMERO SEQUENCIAL AUTOMÁTICO</div>
                ) : (
                    <div className={`${style.status_badge} ${order.status === 'OPEN' ? style.status_open : style.status_close}`}>
                        {order.status === 'OPEN' ? 'STATUS: ABERTA' : 'STATUS: FECHADA'}
                    </div>
                )}
            </div>

            <fieldset className={style.section_block}>
                <legend>1. PRAZOS E CRONOGRAMA</legend>
                <div className={style.row}>
                    <InputNewService type='date' text='Data Abertura' name='openDate' handleOnChange={handleChange} value={order.openDate} disabled={isReadOnly} required />
                    <InputNewService type='date' text='Previsão Fechamento' name='closingDate' handleOnChange={handleChange} value={order.closingDate} disabled={isReadOnly} required />
                </div>
            </fieldset>

            <fieldset className={style.section_block}>
                <legend>2. IDENTIFICAÇÃO DO MATERIAL</legend>
                <div className={style.row}>
                    <Select name="category_id" text="Classe / Categoria" options={categoriasOpcoes} handleOnChange={handleChange} value={order.category_id} disabled={isReadOnly} required />
                    <InputNewService type='text' text='Item / Equipamento' name='item' placeholder='NOME DO ITEM' handleOnChange={handleChange} value={order.item} disabled={isReadOnly} required />
                </div>
                <div className={style.row}>
                    <InputNewService type='text' text='Número de Série' name='serialNumber' placeholder='Nº DE SÉRIE' handleOnChange={handleChange} value={order.serialNumber} disabled={isReadOnly} required />
                    <Select name="destiny" text="O.M. Solicitante / Destino" options={omSubordinadasOpcoes} handleOnChange={handleChange} value={order.destiny} disabled={isReadOnly} required />
                </div>
            </fieldset>

            <fieldset className={style.section_block}>
                <legend>3. ATRIBUIÇÃO INTERNA</legend>
                <div className={style.row}>
                    <Select
                        name="section"
                        text="Seção Reparadora Responsável"
                        options={sections}
                        handleOnChange={handleChange}
                        value={order.section}
                        /* 
                           REGRA DE NEGÓCIO ATUALIZADA: 
                           O campo fica desabilitado se for modo leitura OU se o usuário NÃO for ADMIN.
                        */
                        disabled={isReadOnly || !isAdmin}
                        required
                    />
                    <Select
                        name="technician"
                        text="Mecânico / Técnico Executor"
                        options={filteredTechnicians}
                        handleOnChange={handleChange}
                        value={order.technician}
                        disabled={isReadOnly}
                    />
                </div>
            </fieldset>

            <fieldset className={style.section_block}>
                <legend>4. VALORES E CUSTOS</legend>
                <div className={style.row}>
                    <InputNewService type='number' text='Custo com Peças (R$)' name='partsValue' handleOnChange={handleChange} value={order.partsValue} disabled={isReadOnly} required />
                    <InputNewService type='number' text='Custo Mão de Obra (R$)' name='serviceValue' handleOnChange={handleChange} value={order.serviceValue} disabled={isReadOnly} required />
                </div>
            </fieldset>

            <fieldset className={style.section_block}>
                <legend>5. RELATÓRIOS TÉCNICOS</legend>
                <TextArea text="Manutenção Efetuada" name="manutention" placeholder="DESCRIÇÃO DETALHADA DO REPARO REALIZADO" handleOnChange={handleChange} value={order.manutention} disabled={isReadOnly} />
                <TextArea text="Observações Gerais" name="observations" placeholder="INFORMAÇÕES ADICIONAIS OU RECOMENDAÇÕES TÉCNICAS" handleOnChange={handleChange} value={order.observations} disabled={isReadOnly} />
            </fieldset>

            <div className={style.footer_actions}>
                {!isReadOnly && (
                    <SubmitButton text={isNewOrder ? "EMITIR ORDEM" : "SALVAR ALTERAÇÕES"} />
                )}

                {!isNewOrder && action === 'EDITAR' && order.status === 'OPEN' && (
                    <button type="button" onClick={handleCloseOrder} className={style.btn_encerrar}>
                        CONCLUIR E FECHAR ORDEM
                    </button>
                )}
            </div>
        </form>
    )
}

export default NewOrder;
