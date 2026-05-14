import { useState, useEffect } from 'react'
import styles from '../../styles/styles_pages/styles_creditsTabs/Invoice.module.css'

function Invoice() {
    const [listaNFs, setListaNFs] = useState([])
    const [listaNEs, setListaNEs] = useState([])
    const [listaRPNPs, setListaRPNPs] = useState([]) // Loaded to allow dual-binding options
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Form fields states
    const [idEmEdicao, setIdEmEdicao] = useState(null)
    const [numeroNF, setNumeroNF] = useState('')
    const [idNeSelecionada, setIdNeSelecionada] = useState('')
    const [valorNF, setValorNF] = useState('')
    const [processoNF, setProcessoNF] = useState('')
    const [isNovoProcesso, setIsNovoProcesso] = useState(false)
    const [linkDriveNF, setLinkDriveNF] = useState('')
    
    // Automatic field injection tracker
    const [dadosPreenchidos, setDadosPreenchidos] = useState({ fornecedor: '', cnpj: '', processoOriginal: '', tipoOrigem: '' })

    // Search filter inputs states
    const [filtroNF, setFiltroNF] = useState('')
    const [filtroNE, setFiltroNE] = useState('')
    const [filtroFornecedor, setFiltroFornecedor] = useState('')

    // 1. CARREGAMENTO INICIAL DE TODAS AS COLEÇÕES DO BANCO
    const carregarDadosDoBanco = () => {
        fetch('http://localhost:5000/credits_nf')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setListaNFs(data) })
            .catch(err => console.error("Erro ao carregar NFs:", err))

        fetch('http://localhost:5000/credits_ne')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setListaNEs(data) })
            .catch(err => console.error("Erro ao carregar NEs:", err))

        // LOAD ADDED: Fetches the RPNP items to inject them into the modal select list
        fetch('http://localhost:5000/credits_rpnp')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setListaRPNPs(data) })
            .catch(err => console.error("Erro ao carregar RPNPs:", err))
    }

    useEffect(() => {
        carregarDadosDoBanco()
    }, [])

    // 2. MONITORAMENTO: Varre coleções convencionais e de RPNP para preencher metadados
    const handleMudarNE = (idCombinado) => {
        setIdNeSelecionada(idCombinado)
        if (!idCombinado) {
            setDadosPreenchidos({ fornecedor: '', cnpj: '', processoOriginal: '', tipoOrigem: '' })
            setProcessoNF('')
            return
        }

        // Separa o prefixo do ID real (Ex: "NE_k7gMZA7G7mo" ou "RPNP_x9a1c3v5b")
        const [tipo, idReal] = idCombinado.split('__')

        if (tipo === 'NE') {
            const neEncontrada = listaNEs.find(item => item.id === idReal)
            if (neEncontrada) {
                const procOrig = neEncontrada.numeroProcessoNE || neEncontrada.idNcVinculada || 'Não Informado'
                setDadosPreenchidos({
                    fornecedor: neEncontrada.nomeFornecedor || '',
                    cnpj: neEncontrada.cnpjFornecedor || '',
                    processoOriginal: procOrig,
                    tipoOrigem: 'NE'
                })
                if (!isNovoProcesso) setProcessoNF(procOrig)
            }
        } else if (tipo === 'RPNP') {
            const rpnpEncontrado = listaRPNPs.find(item => item.id === idReal)
            if (rpnpEncontrado) {
                const procOrig = rpnpEncontrado.processo || 'Não Informado'
                setDadosPreenchidos({
                    fornecedor: rpnpEncontrado.nomeFornecedor || '',
                    cnpj: rpnpEncontrado.cnpjFornecedor || '',
                    processoOriginal: procOrig,
                    tipoOrigem: 'RPNP'
                })
                if (!isNovoProcesso) setProcessoNF(procOrig)
            }
        }
    }

    // 3. SALVAMENTO DA NOTA FISCAL (POST / PUT)
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
            numeroNF,
            idNeVinculada: idRealNE, // Preserva o ID real limpo no banco para os cálculos de saldos
            tipoVinculo: tipoOrigem,  // Injeta flag ("NE" ou "RPNP") para o mapeamento dinâmico
            numeroNEVinculada,
            fornecedor: dadosPreenchidos.fornecedor,
            cnpj: dadosPreenchidos.cnpj,
            processo: processoNF,
            valor: valorTratado,
            linkDriveNF
        }

        if (idEmEdicao) {
            const nfOriginal = listaNFs.find(item => item.id === idEmEdicao) || {}
            fetch(`http://localhost:5000/credits_nf/${idEmEdicao}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...nfOriginal, ...dadosNF })
            })
            .then(res => { if (!res.ok) throw new Error(); return res.json() })
            .then(() => {
                alert('Nota Fiscal atualizada com sucesso!')
                carregarDadosDoBanco()
                fecharE_Limpar()
            })
            .catch(() => alert('Erro ao atualizar a Nota Fiscal.'))
        } else {
            const novaNF = {
                ...dadosNF,
                id: Math.random().toString(36).substr(2, 9),
                status: "NAO_ENVIADA"
            }

            fetch('http://localhost:5000/credits_nf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novaNF)
            })
            .then(res => { if (!res.ok) throw new Error(); return res.json() })
            .then(() => {
                alert('Nota Fiscal cadastrada e salva com sucesso!')
                carregarDadosDoBanco()
                fecharE_Limpar()
            })
            .catch(() => alert('Erro de gravação no banco de dados.'))
        }
    }

    const handleAvancarStatus = (id, statusAtual) => {
        const proximoStatus = statusAtual === "NAO_ENVIADA" ? "ENVIADA_LIQUIDACAO" : "LIQUIDADA";
        fetch(`http://localhost:5000/credits_nf/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: proximoStatus })
        })
        .then(() => carregarDadosDoBanco())
        .catch(err => console.error(err))
    }

    const handleVoltarStatus = (id, statusAtual) => {
        const statusAnterior = statusAtual === "LIQUIDADA" ? "ENVIADA_LIQUIDACAO" : "NAO_ENVIADA";
        fetch(`http://localhost:5000/credits_nf/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: statusAnterior })
        })
        .then(() => carregarDadosDoBanco())
        .catch(err => console.error(err))
    }

    const handleExcluirNF = (id, numeroIdentificador) => {
        const confirmacao = window.confirm(`Deseja realmente excluir permanentemente a Nota Fiscal Nº ${numeroIdentificador}?`);
        if (!confirmacao) return;
        fetch(`http://localhost:5000/credits_nf/${id}`, { method: 'DELETE' })
            .then(() => { alert('Nota Fiscal removida com sucesso!'); carregarDadosDoBanco(); })
            .catch(err => console.error(err));
    }

    const handleAbrirEdicao = (item) => {
        setIdEmEdicao(item.id)
        setNumeroNF(item.numeroNF || '')
        
        // Reconstrói o ID combinado para manter a seleção reativa no select list
        const tipoPrefixo = item.tipoVinculo || 'NE'
        setIdNeSelecionada(`${tipoPrefixo}__${item.idNeVinculada}`)
        
        setValorNF(item.valor || '')
        setProcessoNF(item.processo || '')
        setLinkDriveNF(item.linkDriveNF || '')
        
        let procOriginal = 'Não Informado'
        if (tipoPrefixo === 'NE') {
            const ne = listaNEs.find(n => n.id === item.idNeVinculada)
            if (ne) procOriginal = ne.numeroProcessoNE || ne.idNcVinculada || 'Não Informado'
        } else {
            const rpnp = listaRPNPs.find(r => r.id === item.idNeVinculada)
            if (rpnp) procOriginal = rpnp.processo || 'Não Informado'
        }

        setDadosPreenchidos({
            fornecedor: item.fornecedor || '',
            cnpj: item.cnpj || '',
            processoOriginal: procOriginal,
            tipoOrigem: tipoPrefixo
        })
        setIsNovoProcesso(item.processo !== procOriginal)
        setIsModalOpen(true)
    }

    const fecharE_Limpar = () => {
        setIdEmEdicao(null); setNumeroNF(''); setIdNeSelecionada(''); setValorNF(''); setProcessoNF(''); setLinkDriveNF('');
        setIsNovoProcesso(false); setDadosPreenchidos({ fornecedor: '', cnpj: '', processoOriginal: '', tipoOrigem: '' });
        setIsModalOpen(false)
    }

    const nfsFiltradas = listaNFs.filter(item => {
        return (
            (item.numeroNF || '').toLowerCase().includes(filtroNF.toLowerCase()) &&
            (item.numeroNEVinculada || '').toLowerCase().includes(filtroNE.toLowerCase()) &&
            (item.fornecedor || '').toLowerCase().includes(filtroFornecedor.toLowerCase())
        )
    })

    const nfsNaoEnviadas = nfsFiltradas.filter(item => item.status === "NAO_ENVIADA")
    const nfsEnviadas = nfsFiltradas.filter(item => item.status === "ENVIADA_LIQUIDACAO")
    const nfsLiquidadas = nfsFiltradas.filter(item => item.status === "LIQUIDADA")

    return (
        <div className={styles.mainContainer}>
            <div className={styles.actionPanel}>
                <button className={styles.btnIncluir} onClick={() => setIsModalOpen(true)}>
                    Incluir Nota Fiscal
                </button>
            </div>

            <div className={styles.filterBar}>
                <div className={styles.filterGroup}>
                    <label>Número da NF</label>
                    <input type="text" placeholder="Buscar..." value={filtroNF} onChange={(e) => setFiltroNF(e.target.value)} />
                </div>
                <div className={styles.filterGroup}>
                    <label>Nota de Empenho (NE)</label>
                    <input type="text" placeholder="Buscar..." value={filtroNE} onChange={(e) => setFiltroNE(e.target.value)} />
                </div>
                <div className={styles.filterGroup}>
                    <label>Fornecedor</label>
                    <input type="text" placeholder="Buscar..." value={filtroFornecedor} onChange={(e) => setFiltroFornecedor(e.target.value)} />
                </div>
            </div>

            {/* TABELA 1: NÃO ENVIADAS */}
            <div className={styles.statusSection}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.tituloNaoEnviada}>Não Enviadas para Liquidação</h3>
                    <span className={`${styles.badge} ${styles.badgeNaoEnviada}`}>{nfsNaoEnviadas.length}</span>
                </div>
                <div className={styles.tableContainer}>
                    <table className={styles.customTable}>
                        <thead>
                            <tr>
                                <th className={styles.colNF}>NF</th>
                                <th className={styles.colNE}>NE Vinculada</th>
                                <th className={styles.colProcesso}>Processo</th>
                                <th className={styles.colFornecedor}>Fornecedor</th>
                                <th className={styles.colValor}>Valor</th>
                                <th className={styles.colAcoes}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {nfsNaoEnviadas.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        <button type="button" className={styles.btnLinkTabela} onClick={() => item.linkDriveNF && window.open(item.linkDriveNF, '_blank', 'noopener,noreferrer')}>
                                            {item.numeroNF}
                                        </button>
                                    </td>
                                    <td>{item.numeroNEVinculada} <span className={styles.vinculoTag}>{item.tipoVinculo || 'NE'}</span></td>
                                    <td>{item.processo}</td>
                                    <td className={styles.textLeft}>{item.fornecedor}</td>
                                    <td className={styles.textRight}>{(item.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td>
                                        <div className={styles.acoesContainer}>
                                            <button className={styles.btnStatusAction} onClick={() => handleAvancarStatus(item.id, item.status)}>Enviar Liquidação</button>
                                            <button className={styles.btnStatusAction} style={{ backgroundColor: '#0284c7' }} onClick={() => handleAbrirEdicao(item)}>Editar</button>
                                            <button className={styles.btnStatusAction} style={{ backgroundColor: '#dc2626' }} onClick={() => handleExcluirNF(item.id, item.numeroNF)}>Excluir</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {nfsNaoEnviadas.length === 0 && <tr><td colSpan="6" className={styles.emptyRow}>Nenhuma NF nesta seção.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* TABELA 2: ENVIADAS */}
            <div className={styles.statusSection}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.tituloEnviada}>Enviadas para Liquidação (Em Processo)</h3>
                    <span className={`${styles.badge} ${styles.badgeEnviada}`}>{nfsEnviadas.length}</span>
                </div>
                <div className={styles.tableContainer}>
                    <table className={styles.customTable}>
                        <thead>
                            <tr>
                                <th className={styles.colNF}>NF</th>
                                <th className={styles.colNE}>NE Vinculada</th>
                                <th className={styles.colProcesso}>Processo</th>
                                <th className={styles.colFornecedor}>Fornecedor</th>
                                <th className={styles.colValor}>Valor</th>
                                <th className={styles.colAcoes}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {nfsEnviadas.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        <button type="button" className={styles.btnLinkTabela} onClick={() => item.linkDriveNF && window.open(item.linkDriveNF, '_blank', 'noopener,noreferrer')}>
                                            {item.numeroNF}
                                        </button>
                                    </td>
                                    <td>{item.numeroNEVinculada} <span className={styles.vinculoTag}>{item.tipoVinculo || 'NE'}</span></td>
                                    <td>{item.processo}</td>
                                    <td className={styles.textLeft}>{item.fornecedor}</td>
                                    <td className={styles.textRight}>{(item.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td>
                                        <div className={styles.acoesContainer}>
                                            <button className={styles.btnStatusAction} style={{ backgroundColor: '#2563eb' }} onClick={() => handleVoltarStatus(item.id, item.status)}>Voltar</button>
                                            <button className={styles.btnStatusAction} style={{ backgroundColor: '#28a745' }} onClick={() => handleAvancarStatus(item.id, item.status)}>Liquidar</button>
                                            <button className={styles.btnStatusAction} style={{ backgroundColor: '#0284c7' }} onClick={() => handleAbrirEdicao(item)}>Editar</button>
                                            <button className={styles.btnStatusAction} style={{ backgroundColor: '#dc2626' }} onClick={() => handleExcluirNF(item.id, item.numeroNF)}>Excluir</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {nfsEnviadas.length === 0 && <tr><td colSpan="6" className={styles.emptyRow}>Nenhuma NF em processo de liquidação.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* TABELA 3: LIQUIDADAS */}
            <div className={styles.statusSection}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.tituloLiquidada}>Liquidadas (Pagas e Concluídas)</h3>
                    <span className={`${styles.badge} ${styles.badgeLiquidada}`}>{nfsLiquidadas.length}</span>
                </div>
                <div className={styles.tableContainer}>
                    <table className={styles.customTable}>
                        <thead>
                            <tr>
                                <th className={styles.colNF}>NF</th>
                                <th className={styles.colNE}>NE Vinculada</th>
                                <th className={styles.colProcesso}>Processo</th>
                                <th className={styles.colFornecedor}>Fornecedor</th>
                                <th className={styles.colValor}>Valor</th>
                                <th className={styles.colAcoes}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {nfsLiquidadas.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        <button type="button" className={styles.btnLinkTabela} onClick={() => item.linkDriveNF && window.open(item.linkDriveNF, '_blank', 'noopener,noreferrer')}>
                                            {item.numeroNF}
                                        </button>
                                    </td>
                                    <td>{item.numeroNEVinculada} <span className={styles.vinculoTag}>{item.tipoVinculo || 'NE'}</span></td>
                                    <td>{item.processo}</td>
                                    <td className={styles.textLeft}>{item.fornecedor}</td>
                                    <td className={styles.textRight}>{(item.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td>
                                        <div className={styles.acoesContainer}>
                                            <button className={styles.btnStatusAction} style={{ backgroundColor: '#2563eb' }} onClick={() => handleVoltarStatus(item.id, item.status)}>Estornar Liquidação</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {nfsLiquidadas.length === 0 && <tr><td colSpan="6" className={styles.emptyRow}>Nenhuma NF liquidada.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL DE CADASTRO / EDIÇÃO */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>{idEmEdicao ? 'Editar Nota Fiscal (NF)' : 'Inserir Nova Nota Fiscal (NF)'}</h2>
                        <form className={styles.modalForm} onSubmit={handleSalvarNF}>
                            
                            <div className={styles.formGroupFull}>
                                <label>Vincular Empenho Orçamentário (NE convencional ou RPNP)</label>
                                <select value={idNeSelecionada} onChange={(e) => handleMudarNE(e.target.value)} required className={styles.selectPrimary}>
                                    <option value="">-- Selecione o documento de origem correspondente --</option>
                                    
                                    {/* SEÇÃO INTERNA 1: Notas de Empenho da Carga Padrão */}
                                    <optgroup label="NOTAS DE EMPENHO ATIVAS (CRÉDITOS)">
                                        {listaNEs.map(ne => (
                                            <option key={ne.id} value={`NE__${ne.id}`}>NE Nº {ne.numeroNE} ({ne.nomeFornecedor})</option>
                                        ))}
                                    </optgroup>

                                    {/* INTEGRADO: Seção interna 2 injetando as Notas do RPNP salvos */}
                                    <optgroup label="RESTOS A PAGAR NÃO PROCESSADOS (RPNP)">
                                        {listaRPNPs.map(rpnp => (
                                            <option key={rpnp.id} value={`RPNP__${rpnp.id}`}>RPNP Nº {rpnp.numeroNE} ({rpnp.nomeFornecedor})</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Número da Nota Fiscal</label>
                                <input type="text" placeholder="Ex: NF 1042" value={numeroNF} onChange={(e) => setNumeroNF(e.target.value)} required />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Valor da NF (R$)</label>
                                <input type="text" placeholder="Ex: 4500,00" value={valorNF} onChange={(e) => setValorNF(e.target.value)} required />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Nome do Fornecedor</label>
                                <input type="text" value={dadosPreenchidos.fornecedor} disabled className={styles.inputDisabled} />
                            </div>

                            <div className={styles.formGroup}>
                                <label>CNPJ Fornecedor</label>
                                <input type="text" value={dadosPreenchidos.cnpj} disabled className={styles.inputDisabled} />
                            </div>

                            <div className={styles.formGroupFull}>
                                <label>Link da NF no Google Drive</label>
                                <input type="url" placeholder="https://google.com..." value={linkDriveNF} onChange={(e) => setLinkDriveNF(e.target.value)} required />
                            </div>

                            <div className={styles.formGroupFull} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                                <input type="checkbox" checked={isNovoProcesso} onChange={(e) => {
                                    setIsNovoProcesso(e.target.checked)
                                    if(!e.target.checked) setProcessoNF(dadosPreenchidos.processoOriginal)
                                    else setProcessoNF('')
                                }} style={{ width: '16px', height: '16px' }} />
                                <label style={{ fontSize: '11px', color: '#1e295d', fontWeight: 'bold', cursor: 'pointer' }}>Utilizar um novo número de processo diferente do empenho base</label>
                            </div>

                            <div className={styles.formGroupFull}>
                                <label>Número do Processo</label>
                                <input type="text" value={processoNF} onChange={(e) => setProcessoNF(e.target.value)} disabled={!isNovoProcesso && idNeSelecionada !== ''} className={(!isNovoProcesso && idNeSelecionada !== '') ? styles.inputDisabled : ''} required />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="submit" className={styles.btnSalvar}>Sincronizar Lançamento</button>
                                <button type="button" className={styles.btnCancelar} onClick={fecharE_Limpar}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Invoice
