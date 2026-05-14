import { useState, useEffect } from 'react'
import styles from '../../styles/styles_pages/styles_creditsTabs/NewNE.module.css'

function NewNE({ onClose, onSuccess }) {
    // Listas vindas do banco de dados (db.json)
    const [listaNCs, setListaNCs] = useState([])
    const [listaNEs, setListaNEs] = useState([])
    const [listaItensPregao, setListaItensPregao] = useState([])

    // Estados de seleção da NC base
    const [idNcSelecionada, setIdNcSelecionada] = useState('')
    const [ncDados, setNcDados] = useState({ processo: '', finalidade: '', omAplicacao: '', valor: 'R$ 0,00' })
    
    // Estados dos campos da Nova N.E.
    const [numeroNE, setNumeroNE] = useState('')
    const [idMaterialSelecionado, setIdMaterialSelecionado] = useState('')
    const [descricaoItemManual, setDescricaoItemManual] = useState('')
    const [nomeFornecedor, setNomeFornecedor] = useState('')
    const [cnpjFornecedor, setCnpjFornecedor] = useState('')
    const [linkDriveNE, setLinkDriveNE] = useState('')
    
    // Estado de controle para habilitar a digitação manual
    const [isModoManual, setIsModoManual] = useState(false)

    // 1. CARREGAMENTO INICIAL: Busca as NCs, as NEs existentes e os Itens do Pregão
    useEffect(() => {
        fetch('http://localhost:5000/credits_nc')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setListaNCs(data) })
            .catch(err => console.error("Erro ao buscar NCs:", err))

        fetch('http://localhost:5000/credits_ne')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setListaNEs(data) })
            .catch(err => console.error("Erro ao buscar empenhos NE:", err))

        fetch('http://localhost:5000/credits')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setListaItensPregao(data) })
            .catch(err => console.error("Erro ao buscar itens do pregão:", err))
    }, [])

    // 2. MONITORAMENTO: Preenche os dados da NC selecionada (Somente Leitura)
    useEffect(() => {
        if (!idNcSelecionada) {
            setNcDados({ processo: '', finalidade: '', omAplicacao: '', valor: 'R$ 0,00' })
            return
        }
        const ncEncontrada = listaNCs.find(item => item.id === idNcSelecionada)
        if (ncEncontrada) {
            setNcDados({
                processo: ncEncontrada.processo || '',
                finalidade: ncEncontrada.finalidade || '',
                omAplicacao: ncEncontrada.omAplicacao || '',
                valor: ncEncontrada.valor ? ncEncontrada.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'
            })
        }
    }, [idNcSelecionada, listaNCs])

    // 3. MONITORAMENTO DA REGRA: O Material define se o preenchimento é automático ou manual
    const handleMudarMaterial = (valorSelect) => {
        setIdMaterialSelecionado(valorSelect)
        
        if (valorSelect === 'OUTRO') {
            setIsModoManual(true)
            setDescricaoItemManual('')
            setNomeFornecedor('')
            setCnpjFornecedor('')
        } else if (valorSelect !== '') {
            setIsModoManual(false)
            setDescricaoItemManual('')
            const itemPregao = listaItensPregao.find(item => item.id === valorSelect)
            if (itemPregao) {
                setNomeFornecedor(itemPregao.fornecedor || '')
                setCnpjFornecedor(itemPregao.cnpj || '')
            }
        } else {
            setIsModoManual(false)
            setDescricaoItemManual('')
            setNomeFornecedor('')
            setCnpjFornecedor('')
        }
    }

    // 4. ENVIO DO FORMULÁRIO: Salva a nova N.E. no db.json com carimbo de data
    const handleSalvarNE = (e) => {
        e.preventDefault()

        let textoMaterialFinal = ''
        if (isModoManual) {
            textoMaterialFinal = descricaoItemManual
        } else {
            const itemEscolhido = listaItensPregao.find(i => i.id === idMaterialSelecionado)
            textoMaterialFinal = itemEscolhido ? `Item ${itemEscolhido.item} - ${itemEscolhido.descricao}` : ''
        }

        // Captura a data exata da geração do empenho no formato AAAA-MM-DD
        const hoje = new Date();
        const dataGeracaoStr = hoje.toISOString().split('T')[0];

        const novaNE = {
            idNcVinculada: idNcSelecionada,
            numeroNE,
            materialNE: textoMaterialFinal,
            nomeFornecedor,
            cnpjFornecedor,
            linkDriveNE,
            dataGeracaoNE: dataGeracaoStr, // Salva o carimbo de data no banco para o contador de dias [Noi]
            modalidade: isModoManual ? 'FORA_DO_PREGAO_MANUAL' : 'PREGAO_HOMOLOGADO'
        }

        fetch('http://localhost:5000/credits_ne', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaNE)
        })
        .then(res => {
            if (!res.ok) throw new Error()
            return res.json()
        })
        .then(() => {
            alert('Nota de Empenho (N.E.) gerada e salva com sucesso!')
            if (typeof onSuccess === 'function') onSuccess(); // Auto-atualização imediata da tela
            fecharE_Limpar()
        })
        .catch(() => alert('Erro ao salvar no db.json. Verifique o servidor.'))
    }

    const fecharE_Limpar = () => {
        setIdNcSelecionada('')
        setNumeroNE('')
        setIdMaterialSelecionado('')
        setDescricaoItemManual('')
        setNomeFornecedor('')
        setCnpjFornecedor('')
        setLinkDriveNE('')
        setIsModoManual(false)
        onClose()
    }

    const idsNcEmpenhadas = new Set(listaNEs.map(ne => ne.idNcVinculada));
    const ncsDisponiveisParaSelecao = listaNCs.filter(nc => !idsNcEmpenhadas.has(nc.id));

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h2>Gerar Nova Nota de Empenho (N.E.)</h2>
                
                <form className={styles.modalForm} onSubmit={handleSalvarNE}>
                    <div className={styles.formGroupFull}>
                        <label>Vincular Nota de Crédito (NC)</label>
                        <select 
                            value={idNcSelecionada} 
                            onChange={(e) => setIdNcSelecionada(e.target.value)}
                            required
                            className={styles.selectModalPrimary}
                        >
                            <option value="">-- Selecione o número da NC disponível --</option>
                            {ncsDisponiveisParaSelecao.map(item => (
                                <option key={item.id} value={item.id}>{item.nc} (UG: {item.fonteRecurso}212)</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Nº do Processo Origem</label>
                        <input type="text" value={ncDados.processo} disabled className={styles.inputCalculado} />
                    </div>

                    <div className={styles.formGroup}>
                        <label>OM de Aplicação</label>
                        <input type="text" value={ncDados.omAplicacao} disabled className={styles.inputCalculado} />
                    </div>

                    <div className={styles.formGroupFull}>
                        <label>Saldo / Valor da NC</label>
                        <input type="text" value={ncDados.valor} disabled className={styles.inputCalculado} style={{color: '#28a745', fontWeight: 'bold'}} />
                    </div>

                    <div className={styles.formGroupFull}>
                        <label>Finalidade da NC</label>
                        <textarea value={ncDados.finalidade} disabled className={styles.inputCalculado} style={{height: '45px'}}></textarea>
                    </div>

                    <div className={styles.divider}>DADOS DA NOVA NOTA DE EMPENHO (N.E.)</div>

                    <div className={styles.formGroupFull}>
                        <label>Número da N.E.</label>
                        <input 
                            type="text" 
                            placeholder="Ex: 2026NE000142" 
                            value={numeroNE} 
                            onChange={(e) => setNumeroNE(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className={styles.formGroupFull}>
                        <label>Material / Item da N.E.</label>
                        <select
                            value={idMaterialSelecionado}
                            onChange={(e) => handleMudarMaterial(e.target.value)}
                            required
                            className={styles.selectModalPrimary}
                        >
                            <option value="">-- Selecione o item homologado no Pregão --</option>
                            {listaItensPregao.map(item => (
                                <option key={item.id} value={item.id}>
                                    Item {item.item} - {item.descricao.substring(0, 55)}...
                                </option>
                            ))}
                            <option value="OUTRO" style={{color: '#dc3545', fontWeight: 'bold'}}>
                                + OUTRA MODALIDADE (CARONA, DISPENSA ELETRÔNICA, ETC.)
                            </option>
                        </select>
                    </div>

                    {isModoManual && (
                        <div className={styles.formGroupFull}>
                            <label style={{color: '#dc3545'}}>Descrição do Material Manual (Carona/Dispensa)</label>
                            <input 
                                type="text" 
                                placeholder="Digite a descrição do item empenhado..." 
                                value={descricaoItemManual} 
                                onChange={(e) => setDescricaoItemManual(e.target.value)} 
                                required 
                            />
                        </div>
                    )}

                    <div className={styles.formGroupFull}>
                        <label>Link do Documento da N.E. no Google Drive</label>
                        <input 
                            type="url" 
                            placeholder="https://google.com..." 
                            value={linkDriveNE} 
                            onChange={(e) => setLinkDriveNE(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Nome do Fornecedor</label>
                        <input 
                            type="text" 
                            placeholder="Razão Social da Empresa" 
                            value={nomeFornecedor} 
                            onChange={(e) => setNomeFornecedor(e.target.value)} 
                            disabled={!isModoManual} 
                            required 
                            className={!isModoManual ? styles.inputCalculatedText : ''}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>CNPJ do Fornecedor</label>
                        <input 
                            type="text" 
                            placeholder="00.000.000/0001-00" 
                            value={cnpjFornecedor} 
                            onChange={(e) => setCnpjFornecedor(e.target.value)} 
                            disabled={!isModoManual} 
                            required 
                            className={!isModoManual ? styles.inputCalculatedText : ''}
                        />
                    </div>

                    <div className={styles.modalActions}>
                        <button type="submit" className={styles.btnSalvar}>
                            Gerar Empenho
                        </button>
                        <button type="button" className={styles.btnCancelar} onClick={fecharE_Limpar}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default NewNE
