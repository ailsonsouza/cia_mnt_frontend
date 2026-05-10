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

    // Captura os dados do usuário autenticado guardados no localStorage no Login
    const loggedUser = JSON.parse(localStorage.getItem('loggedUser')) || null;
    const isAdmin = loggedUser?.roleName === 'ADMIN';

    // --- REGRA DE SEGURANÇA: Bloqueia a edição se a ação for visualizar OU se a O.S. já estiver fechada (CLOSE) ---
    const isReadOnly = action === 'VISUALIZAR' || currentOrder?.status === 'CLOSE';

    const categoriasOpcoes = [
        { id: 'Classe V', name: 'Classe V' },
        { id: 'Classe IV', name: 'Classe IV' },
        { id: 'Classe VI', name: 'Classe VI' },
        { id: 'LANTERNAGEM', name: 'LANTERNAGEM' },
    ]

    const omSubordinadasOpcoes = [
        { id: 'Cmdo 14ª Bda Inf Mtz', name: 'Cmdo 14ª Bda Inf Mtz (Florianópolis - SC)' },
        { id: 'Cia C 14ª Bda Inf Mtz', name: 'Cia C 14ª Bda Inf Mtz (Florianópolis - SC)' },
        { id: '63º BI', name: '63º Batalhão de Infantaria (Florianópolis - SC)' },
        { id: '62º BI', name: '62º Batalhão de Infantaria (Joinville - SC)' },
        { id: '23º BI', name: '23º Batalhão de Infantaria (Blumenau - SC)' },
        { id: '28º GAC', name: '28º Grupo de Artilharia de Campanha (Criciúma - SC)' },
        { id: '27º B Log', name: '27º Batalhão Logístico (Curitiba - PR)' },
        { id: '14ª Cia E Cmb', name: '14ª Companhia de Engenharia de Combate (Tubarão - SC)' },
        { id: '14º Pel PE', name: '14º Pelotão de Polícia do Exército (Florianópolis - SC)' }
    ]

    const [sections, setSections] = useState([])
    const [allTechnicians, setAllTechnicians] = useState([])

    // REGRA DE NEGÓCIO: Se for novo e NÃO for ADMIN, já inicia amarrado à seção do usuário logado
    const [order, setOrder] = useState({
        openDate: isNewOrder ? '' : (currentOrder?.openDate || ''),
        closingDate: isNewOrder ? '' : (currentOrder?.closingDate || ''),
        category_id: isNewOrder ? '' : (currentOrder?.category_id || ''),
        item: isNewOrder ? '' : (currentOrder?.item || ''),
        serialNumber: isNewOrder ? '' : (currentOrder?.serialNumber || ''),
        partsValue: isNewOrder ? '0' : (currentOrder?.partsValue || '0'),
        serviceValue: isNewOrder ? '0' : (currentOrder?.serviceValue || '0'),
        destiny: isNewOrder ? '' : (currentOrder?.destiny || ''),
        section: isNewOrder ? (isAdmin ? '' : (loggedUser?.section_id || '')) : (currentOrder?.section || ''),
        technician: isNewOrder ? '' : (currentOrder?.technician || ''),
        manutention: isNewOrder ? '' : (currentOrder?.manutention || ''),
        observations: isNewOrder ? '' : (currentOrder?.observations || ''),
        status: isNewOrder ? 'OPEN' : (currentOrder?.status || 'OPEN')
    })

    useEffect(() => {
        fetch('http://localhost:5000/sections').then(resp => resp.json()).then(data => setSections(data))
        fetch('http://localhost:5000/technicians').then(resp => resp.json()).then(data => setAllTechnicians(data))
    }, [])

    // --- TRAVA DE SEGURANÇA 1: BLOQUEIA MUDANÇA DE ESTADO ---
    function handleChange(e) {
        // Se o campo for a seção e o usuário NÃO for ADMIN, ignora a alteração
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
        
        // --- TRAVA DE SEGURANÇA 2: FORÇA A SEÇÃO DO USUÁRIO NO ENCERRAMENTO ---
        const finalSectionId = isAdmin ? order.section : loggedUser?.section_id;

        const payload = { 
            ...order, 
            status: 'CLOSE', 
            closingDate: today,
            section: finalSectionId 
        };

        fetch(`http://localhost:5000/orders/${currentOrder.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(() => { alert("Ordem de serviço encerrada com sucesso!"); navigate('/orders'); })
        .catch(() => alert("Falha ao tentar encerrar a ordem de serviço."));
    }

    function handleSave(e) {
        e.preventDefault()

        // --- TRAVA DE SEGURANÇA 3: FORÇA A SEÇÃO DO USUÁRIO NO SALVAMENTO ---
        const finalSectionId = isAdmin ? order.section : loggedUser?.section_id;

        const payload = {
            ...order,
            item: order.item.toUpperCase().trim(),
            serialNumber: order.serialNumber.toUpperCase().trim(),
            destiny: order.destiny,
            section: finalSectionId // Injeta rigidamente o ID correto
        }

        if (isNewOrder) {
            fetch('http://localhost:5000/orders')
                .then(resp => resp.json())
                .then(currentOrders => {
                    const nextNumber = currentOrders.length + 1
                    payload.orderNumber = `ORDEM DE SERVIÇO Nº ${nextNumber}`
                    
                    return fetch('http://localhost:5000/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    })
                })
                .then(() => { alert("Ordem de serviço emitida!"); navigate('/orders') })
                .catch((err) => console.log(err))
        } else {
            fetch(`http://localhost:5000/orders/${currentOrder.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(() => { alert("Ordem de serviço atualizada!"); navigate('/orders') })
        }
    }

    // --- FILTRAGEM DINÂMICA DE TÉCNICOS ---
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
                    <InputNewService type='text' text='N° EB / Série / Placa' name='serialNumber' placeholder='N° IDENTIFICADOR' handleOnChange={handleChange} value={order.serialNumber} disabled={isReadOnly} required />
                </div>
            </fieldset>

            <fieldset className={style.section_block}>
                <legend>3. ALOCAÇÃO E REQUISITANTE</legend>
                <div className={style.row}>
                    <Select 
                        name="section" 
                        text="Seção Reparadora" 
                        options={sections} 
                        handleOnChange={handleChange} 
                        value={order.section} 
                        /* Bloqueia se for visualização ou se for novo cadastro de alguém que NÃO é ADMIN */
                        disabled={isReadOnly || (isNewOrder && !isAdmin)} 
                        required 
                    />
                    <Select 
                        name="technician" 
                        text="Técnico Encarregado" 
                        options={filteredTechnicians} 
                        handleOnChange={handleChange} 
                        value={order.technician} 
                        disabled={isReadOnly} 
                        required 
                    />
                    <Select name="destiny" text="OM Destino" options={omSubordinadasOpcoes} handleOnChange={handleChange} value={order.destiny} disabled={isReadOnly} required />
                </div>
            </fieldset>

            <fieldset className={style.section_block}>
                <legend>4. CONTROLE DE CUSTOS</legend>
                <div className={style.row}>
                    <InputNewService type='number' text='Custo ND 30 (Peças) - R$' name='partsValue' placeholder='0.00' handleOnChange={handleChange} value={order.partsValue} disabled={isReadOnly} required />
                    <InputNewService type='number' text='Custo ND 39 (Serviço) - R$' name='serviceValue' placeholder='0.00' handleOnChange={handleChange} value={order.serviceValue} disabled={isReadOnly} required />
                </div>
            </fieldset>

            <fieldset className={style.section_block}>
                <legend>5. REGISTROS TÉCNICOS</legend>
                <div className={style.textarea_container}>
                    <TextArea text='Manutenção Executada' name='manutention' placeholder='Detalhamento do serviço...' handleOnChange={handleChange} value={order.manutention} disabled={isReadOnly} required />
                    <TextArea text='Observações Gerais' name='observations' placeholder='Anotações importantes...' handleOnChange={handleChange} value={order.observations} disabled={isReadOnly} />
                </div>
            </fieldset>

            <div className={style.footer_actions}>
                {isReadOnly && action === 'VISUALIZAR' ? (
                    <Link to="/orders" className={style.btn_retornar}>RETORNAR À LISTAGEM</Link>
                ) : (
                    <>
                        {/* Oculta o botão de salvar caso a ordem já esteja concluída */}
                        {order.status === 'OPEN' && (
                            <SubmitButton text={isNewOrder ? "EMITIR ORDEM DE SERVIÇO" : "SALVAR ALTERAÇÕES"} />
                        )}
                        
                        {/* Botão de encerramento visível apenas em modo edição e com status aberto */}
                        {!isNewOrder && order.status === 'OPEN' && (
                            <button type="button" onClick={handleCloseOrder} className={style.btn_encerrar}>
                                ENCERRAR O.S.
                            </button>
                        )}
                    </>
                )}
            </div>
        </form>
    )
}

export default NewOrder
