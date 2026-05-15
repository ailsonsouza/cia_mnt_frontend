import { useState, useEffect } from 'react'
import styles from '../../styles/styles_pages/styles_creditsTabs/Invoice.module.css'
import { BsPlusSquareFill, BsInfoCircleFill, BsFileEarmarkTextFill, BsBuilding, BsLink45Deg } from 'react-icons/bs'

function Invoice() {
    const [listaNFs, setListaNFs] = useState([])
    const [listaNEs, setListaNEs] = useState([])
    const [listaRPNPs, setListaRPNPs] = useState([]) 
    const [isModalOpen, setIsModalOpen] = useState(false)

    const [idEmEdicao, setIdEmEdicao] = useState(null)
    const [numeroNF, setNumeroNF] = useState('')
    const [idNeSelecionada, setIdNeSelecionada] = useState('')
    const [valorNF, setValorNF] = useState('')
    const [processoNF, setProcessoNF] = useState('')
    const [isNovoProcesso, setIsNovoProcesso] = useState(false)
    const [linkDriveNF, setLinkDriveNF] = useState('')
    
    const [dadosPreenchidos, setDadosPreenchidos] = useState({ fornecedor: '', cnpj: '', processoOriginal: '', tipoOrigem: '' })

    const [filtroNF, setFiltroNF] = useState('')
    const [filtroNE, setFiltroNE] = useState('')
    const [filtroFornecedor, setFiltroFornecedor] = useState('')

    const carregarDadosDoBanco = () => {
        fetch('http://localhost:5000/credits_nf')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setListaNFs(data) })

        fetch('http://localhost:5000/credits_ne')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setListaNEs(data) })

        fetch('http://localhost:5000/credits_rpnp')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setListaRPNPs(data) })
    }

    useEffect(() => { carregarDadosDoBanco() }, [])

    const handleMudarNE = (idCombinado) => {
        setIdNeSelecionada(idCombinado)
        if (!idCombinado) {
            setDadosPreenchidos({ fornecedor: '', cnpj: '', processoOriginal: '', tipoOrigem: '' })
            setProcessoNF('')
            return
        }

        const [tipo, idReal] = idCombinado.split('__')

        if (tipo === 'NE') {
            const neEncontrada = listaNEs.find(item => item.id === idReal)
            if (neEncontrada) {
                const procOrig = neEncontrada.numeroProcessoNE || neEncontrada.idNcVinculada || 'Não Informado'
                setDadosPreenchidos({ fornecedor: neEncontrada.nomeFornecedor || '', cnpj: neEncontrada.cnpjFornecedor || '', processoOriginal: procOrig, tipoOrigem: 'NE' })
                if (!isNovoProcesso) setProcessoNF(procOrig)
            }
        } else if (tipo === 'RPNP') {
            const rpnpEncontrado = listaRPNPs.find(item => item.id === idReal)
            if (rpnpEncontrado) {
                const procOrig = rpnpEncontrado.processo || 'Não Informado'
                setDadosPreenchidos({ fornecedor: rpnpEncontrado.nomeFornecedor || '', cnpj: rpnpEncontrado.cnpjFornecedor || '', processoOriginal: procOrig, tipoOrigem: 'RPNP' })
                if (!isNovoProcesso) setProcessoNF(procOrig)
            }
        }
    }

    const handleSalvarNF = (e) => {
        e.preventDefault()
        const [tipoOrigem, idRealNE] = idNeSelecionada.split('__')
        let numeroNEVinculada = 'N/D'

        if (tipoOrigem === 'NE') {
            const ne = listaNEs.find(item => item.id === idRealNE)
            if (ne) numeroNEVinculada = ne.numeroNE
        } else {
            const rpnp = listaRPNPs.find(item => item.id === idRealNE)
            if (rpnp) numeroNEVinculada = rpnp.numeroNE
        }

        const valorTratado = parseFloat(valorNF.toString().replace(/[^\d,.]/g, '').replace(',', '.')) || 0

        const dadosNF = {
            numeroNF, idNeVinculada: idRealNE, tipoVinculo: tipoOrigem, numeroNEVinculada,
            fornecedor: dadosPreenchidos.fornecedor, cnpj: dadosPreenchidos.cnpj, processo: processoNF,
            valor: valorTratado, linkDriveNF
        }

        if (idEmEdicao) {
            const nfOriginal = listaNFs.find(item => item.id === idEmEdicao) || {}
            fetch(`http://localhost:5000/credits_nf/${idEmEdicao}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...nfOriginal, ...dadosNF })
            }).then(() => { carregarDadosDoBanco(); fecharE_Limpar(); })
        } else {
            const novaNF = { ...dadosNF, id: Math.random().toString(36).substr(2, 9), status: "NAO_ENVIADA" }
            fetch('http://localhost:5000/credits_nf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novaNF)
            }).then(() => { carregarDadosDoBanco(); fecharE_Limpar(); })
        }
    }

    const handleAvancarStatus = (id, statusAtual) => {
        const proximoStatus = statusAtual === "NAO_ENVIADA" ? "ENVIADA_LIQUIDACAO" : "LIQUIDADA";
        fetch(`http://localhost:5000/credits_nf/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: proximoStatus })
        }).then(() => carregarDadosDoBanco())
    }

    const handleVoltarStatus = (id, statusAtual) => {
        const statusAnterior = statusAtual === "LIQUIDADA" ? "ENVIADA_LIQUIDACAO" : "NAO_ENVIADA";
        fetch(`http://localhost:5000/credits_nf/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: statusAnterior })
        }).then(() => carregarDadosDoBanco())
    }

    const handleExcluirNF = (id, numeroIdentificador) => {
        if (window.confirm(`Deseja realmente excluir permanentemente a Nota Fiscal Nº ${numeroIdentificador}?`)) {
            fetch(`http://localhost:5000/credits_nf/${id}`, { method: 'DELETE' }).then(() => carregarDadosDoBanco())
        }
    }

    const handleAbrirEdicao = (item) => {
        setIdEmEdicao(item.id); setNumeroNF(item.numeroNF || '');
        setIdNeSelecionada(`${item.tipoVinculo || 'NE'}__${item.idNeVinculada}`);
        setValorNF(item.valor || ''); setProcessoNF(item.processo || ''); setLinkDriveNF(item.linkDriveNF || '');
        
        let procOrig = 'Não Informado'
        if (item.tipoVinculo === 'NE') {
            const ne = listaNEs.find(n => n.id === item.idNeVinculada)
            if (ne) procOrig = ne.numeroProcessoNE || ne.idNcVinculada || 'Não Informado'
        } else {
            const rpnp = listaRPNPs.find(r => r.id === item.idNeVinculada)
            if (rpnp) procOrig = rpnp.processo || 'Não Informado'
        }

        setDadosPreenchidos({ fornecedor: item.fornecedor || '', cnpj: item.cnpj || '', processoOriginal: procOrig, tipoOrigem: item.tipoVinculo || 'NE' })
        setIsNovoProcesso(item.processo !== procOrig); setIsModalOpen(true)
    }

    const fecharE_Limpar = () => {
        setIdEmEdicao(null); setNumeroNF(''); setIdNeSelecionada(''); setValorNF(''); setProcessoNF(''); setLinkDriveNF('');
        setIsNovoProcesso(false); setDadosPreenchidos({ fornecedor: '', cnpj: '', processoOriginal: '', tipoOrigem: '' });
        setIsModalOpen(false)
    }

    const nfsFiltradas = listaNFs.filter(item => (
        (item.numeroNF || '').toLowerCase().includes(filtroNF.toLowerCase()) &&
        (item.numeroNEVinculada || '').toLowerCase().includes(filtroNE.toLowerCase()) &&
        (item.fornecedor || '').toLowerCase().includes(filtroFornecedor.toLowerCase())
    ))

    const nfsNaoEnviadas = nfsFiltradas.filter(item => item.status === "NAO_ENVIADA")
    const nfsEnviadas = nfsFiltradas.filter(item => item.status === "ENVIADA_LIQUIDACAO")
    const nfsLiquidadas = nfsFiltradas.filter(item => item.status === "LIQUIDADA")

    return (
        <div className={styles.mainContainer}>
            <div className={styles.actionPanel}>
                <button className={styles.btnIncluir} onClick={() => setIsModalOpen(true)}>Incluir Nota Fiscal</button>
            </div>

            <div className={styles.filterBar}>
                <div className={styles.filterGroup}><label>Número da NF</label><input type="text" value={filtroNF} onChange={(e) => setFiltroNF(e.target.value)} /></div>
                <div className={styles.filterGroup}><label>Nota de Empenho (NE)</label><input type="text" value={filtroNE} onChange={(e) => setFiltroNE(e.target.value)} /></div>
                <div className={styles.filterGroup}><label>Fornecedor</label><input type="text" value={filtroFornecedor} onChange={(e) => setFiltroFornecedor(e.target.value)} /></div>
            </div>

            {/* TABELA 1: NÃO ENVIADAS */}
            <div className={styles.statusSection}>
                <div className={styles.sectionHeader}><h3 className={styles.tituloNaoEnviada}>Não Enviadas para Liquidação</h3><span className={`${styles.badge} ${styles.badgeNaoEnviada}`}>{nfsNaoEnviadas.length}</span></div>
                <div className={styles.tableContainer}>
                    <table className={styles.customTable}>
                        <thead><tr><th className={styles.colNF}>NF</th><th className={styles.colNE}>NE Vinculada</th><th className={styles.colProcesso}>Processo</th><th className={styles.colFornecedor}>Fornecedor</th><th className={styles.colValor}>Valor</th><th className={styles.colAcoes}>Ações</th></tr></thead>
                        <tbody>
                            {nfsNaoEnviadas.map(item => (
                                <tr key={item.id}>
                                    <td><button className={styles.btnLinkTabela} onClick={() => item.linkDriveNF && window.open(item.linkDriveNF, '_blank')}>{item.numeroNF}</button></td>
                                    <td>{item.numeroNEVinculada} <span className={styles.vinculoTag}>{item.tipoVinculo || 'NE'}</span></td>
                                    <td>{item.processo}</td><td className={styles.textLeft}>{item.fornecedor}</td><td className={styles.textRight}>{item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td><div className={styles.acoesContainer}>
                                        <button className={styles.btnStatusAction} onClick={() => handleAvancarStatus(item.id, item.status)}>Enviar Liquidação</button>
                                        <button className={styles.btnStatusAction} style={{ backgroundColor: '#0284c7' }} onClick={() => handleAbrirEdicao(item)}>Editar</button>
                                        <button className={styles.btnStatusAction} style={{ backgroundColor: '#dc2626' }} onClick={() => handleExcluirNF(item.id, item.numeroNF)}>Excluir</button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* TABELA 2: ENVIADAS */}
            <div className={styles.statusSection}>
                <div className={styles.sectionHeader}><h3 className={styles.tituloEnviada}>Enviadas para Liquidação (Em Processo)</h3><span className={`${styles.badge} ${styles.badgeEnviada}`}>{nfsEnviadas.length}</span></div>
                <div className={styles.tableContainer}>
                    <table className={styles.customTable}>
                        <thead><tr><th className={styles.colNF}>NF</th><th className={styles.colNE}>NE Vinculada</th><th className={styles.colProcesso}>Processo</th><th className={styles.colFornecedor}>Fornecedor</th><th className={styles.colValor}>Valor</th><th className={styles.colAcoes}>Ações</th></tr></thead>
                        <tbody>
                            {nfsEnviadas.map(item => (
                                <tr key={item.id}>
                                    <td><button className={styles.btnLinkTabela} onClick={() => item.linkDriveNF && window.open(item.linkDriveNF, '_blank')}>{item.numeroNF}</button></td>
                                    <td>{item.numeroNEVinculada} <span className={styles.vinculoTag}>{item.tipoVinculo || 'NE'}</span></td>
                                    <td>{item.processo}</td><td className={styles.textLeft}>{item.fornecedor}</td><td className={styles.textRight}>{item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td><div className={styles.acoesContainer}>
                                        <button className={styles.btnStatusAction} style={{ backgroundColor: '#2563eb' }} onClick={() => handleVoltarStatus(item.id, item.status)}>Voltar</button>
                                        <button className={styles.btnStatusAction} style={{ backgroundColor: '#28a745' }} onClick={() => handleAvancarStatus(item.id, item.status)}>Liquidar</button>
                                        <button className={styles.btnStatusAction} style={{ backgroundColor: '#0284c7' }} onClick={() => handleAbrirEdicao(item)}>Editar</button>
                                        <button className={styles.btnStatusAction} style={{ backgroundColor: '#dc2626' }} onClick={() => handleExcluirNF(item.id, item.numeroNF)}>Excluir</button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* TABELA 3: LIQUIDADAS */}
            <div className={styles.statusSection}>
                <div className={styles.sectionHeader}><h3 className={styles.tituloLiquidada}>Liquidadas (Pagas e Concluídas)</h3><span className={`${styles.badge} ${styles.badgeLiquidada}`}>{nfsLiquidadas.length}</span></div>
                <div className={styles.tableContainer}>
                    <table className={styles.customTable}>
                        <thead><tr><th className={styles.colNF}>NF</th><th className={styles.colNE}>NE Vinculada</th><th className={styles.colProcesso}>Processo</th><th className={styles.colFornecedor}>Fornecedor</th><th className={styles.colValor}>Valor</th><th className={styles.colAcoes}>Ações</th></tr></thead>
                        <tbody>
                            {nfsLiquidadas.map(item => (
                                <tr key={item.id}>
                                    <td><button className={styles.btnLinkTabela} onClick={() => item.linkDriveNF && window.open(item.linkDriveNF, '_blank')}>{item.numeroNF}</button></td>
                                    <td>{item.numeroNEVinculada} <span className={styles.vinculoTag}>{item.tipoVinculo || 'NE'}</span></td>
                                    <td>{item.processo}</td><td className={styles.textLeft}>{item.fornecedor}</td><td className={styles.textRight}>{item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td><div className={styles.acoesContainer}>
                                        <button className={styles.btnStatusAction} style={{ backgroundColor: '#2563eb' }} onClick={() => handleVoltarStatus(item.id, item.status)}>Estornar Liquidação</button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL COM NOVO LAYOUT */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalForm}>
                        <div className={styles.modalHeader}>
                            <BsPlusSquareFill />
                            <h3>{idEmEdicao ? 'EDITAR NOTA FISCAL (NF)' : 'GERAR NOVA NOTA FISCAL (NF)'}</h3>
                        </div>
                        
                        <form className={styles.formStyled} onSubmit={handleSalvarNF}>
                            <div className={styles.formContent}>
                                <div className={styles.formSection}>
                                    <div className={styles.sectionHeader_Modal}><BsInfoCircleFill /> <h4>1. VÍNCULO DE ORIGEM</h4></div>
                                    <div className={styles.inputGroup} style={{gridColumn: 'span 2'}}>
                                        <label>Documento de Empenho Base (NE / RPNP)</label>
                                        <select className={styles.selectPrimary} value={idNeSelecionada} onChange={(e) => handleMudarNE(e.target.value)} required>
                                            <option value="">-- Selecione a origem --</option>
                                            <optgroup label="NOTAS DE EMPENHO">
                                                {listaNEs.map(ne => <option key={ne.id} value={`NE__${ne.id}`}>{ne.numeroNE} - {ne.nomeFornecedor}</option>)}
                                            </optgroup>
                                            <optgroup label="RPNP">
                                                {listaRPNPs.map(r => <option key={r.id} value={`RPNP__${r.id}`}>{r.numeroNE} - {r.nomeFornecedor}</option>)}
                                            </optgroup>
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.formSection}>
                                    <div className={styles.sectionHeader_Modal}><BsFileEarmarkTextFill /> <h4>2. DADOS DO LANÇAMENTO</h4></div>
                                    <div className={styles.inputGrid_Modal}>
                                        <div className={styles.inputGroup}><label>Número da NF</label><input type="text" className={styles.inputField} value={numeroNF} onChange={(e) => setNumeroNF(e.target.value)} required /></div>
                                        <div className={styles.inputGroup}><label>Valor da NF</label><input type="text" className={styles.inputField} value={valorNF} onChange={(e) => setValorNF(e.target.value)} required /></div>
                                        <div className={styles.inputGroup} style={{gridColumn: 'span 2'}}><label>Link da NF no Drive</label><input type="url" className={styles.inputField} value={linkDriveNF} onChange={(e) => setLinkDriveNF(e.target.value)} required /></div>
                                    </div>
                                </div>

                                <div className={styles.formSection}>
                                    <div className={styles.sectionHeader_Modal}><BsBuilding /> <h4>3. FORNECEDOR E PROCESSO</h4></div>
                                    <div className={styles.inputGrid_Modal}>
                                        <div className={styles.inputGroup} style={{gridColumn: 'span 2'}}><label>Razão Social</label><input type="text" className={styles.inputDisabled} value={dadosPreenchidos.fornecedor} disabled /></div>
                                        <div className={styles.inputGroup}><label>CNPJ</label><input type="text" className={styles.inputDisabled} value={dadosPreenchidos.cnpj} disabled /></div>
                                        <div className={styles.inputGroup}>
                                            <label>Número do Processo</label>
                                            <input type="text" className={!isNovoProcesso ? styles.inputDisabled : styles.inputField} value={processoNF} onChange={(e) => setProcessoNF(e.target.value)} disabled={!isNovoProcesso} required />
                                        </div>
                                    </div>
                                    <div className={styles.checkboxWrapper}>
                                        <input type="checkbox" checked={isNovoProcesso} onChange={(e) => { setIsNovoProcesso(e.target.checked); if(!e.target.checked) setProcessoNF(dadosPreenchidos.processoOriginal); }} />
                                        <label>Utilizar processo diferente do empenho original</label>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.formFooter}>
                                <button type="button" className={styles.btnCancelar} onClick={fecharE_Limpar}>CANCELAR</button>
                                <button type="submit" className={styles.btnSalvar}>SINCRONIZAR LANÇAMENTO</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Invoice