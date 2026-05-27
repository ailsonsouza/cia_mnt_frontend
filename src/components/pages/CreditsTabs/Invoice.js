import { useState, useEffect } from 'react'
import styles from '../../styles/styles_pages/styles_creditsTabs/Invoice.module.css'
import { BsPlusSquareFill, BsInfoCircleFill, BsFileEarmarkTextFill, BsBuilding, BsLink45Deg, BsPlus, BsTrash } from 'react-icons/bs'
import { useAuth } from '../../context/AuthContext'

function Invoice({ onClose, onSuccess, onVerDetalhesNE }) {
    const { usuarioAtual } = useAuth();
    const [listaNFs, setListaNFs] = useState([])
    const [listaNEs, setListaNEs] = useState([])
    const [listaRPNPs, setListaRPNPs] = useState([])
    const [listaNCs, setListaNCs] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)

    const [idEmEdicao, setIdEmEdicao] = useState(null)
    const [numeroNF, setNumeroNF] = useState('')
    const [processoNF, setProcessoNF] = useState('')
    const [isNovoProcesso, setIsNovoProcesso] = useState(false)
    const [linkDriveNF, setLinkDriveNF] = useState('')
    
    const [itensNF, setItensNF] = useState([
        { id: Date.now(), tipo: 'NE', idVinculo: '', valor: '', numeroDocumento: '', fornecedor: '' }
    ])
    
    const [dadosPreenchidos, setDadosPreenchidos] = useState({ fornecedor: '', cnpj: '', processoOriginal: '', tipoOrigem: '' })
    const [nesDisponiveis, setNesDisponiveis] = useState([])
    const [rpnpDisponiveis, setRpnpDisponiveis] = useState([])
    const [carregandoDocumentos, setCarregandoDocumentos] = useState(false)

    const [filtroNF, setFiltroNF] = useState('')
    const [filtroNE, setFiltroNE] = useState('')
    const [filtroFornecedor, setFiltroFornecedor] = useState('')

    // ==================== FUNÇÕES DE PERMISSÃO ====================

    // Função para buscar a NC raiz (original) percorrendo a árvore
    const buscarNCRaiz = (ncId, todasNCs) => {
        const ncAtual = todasNCs.find(nc => nc.id === ncId);
        if (!ncAtual) return null;
        
        let raiz = ncAtual;
        let current = ncAtual;
        
        while (current && current.documentoAnterior) {
            const pai = todasNCs.find(nc => nc.codigoUnico === current.documentoAnterior);
            if (pai) {
                raiz = pai;
                current = pai;
            } else {
                break;
            }
        }
        
        return raiz;
    };

    // Função para verificar se uma seção está na cadeia de transferências da NC
    const secaoEstaNaArvore = (ncId, secao, todasNCs) => {
        const ncAtual = todasNCs.find(nc => nc.id === ncId);
        if (!ncAtual) return false;
        
        if (ncAtual.detentor === secao) return true;
        if (ncAtual.detentorOriginal === secao) return true;
        
        let current = ncAtual;
        while (current && current.documentoAnterior) {
            const pai = todasNCs.find(nc => nc.codigoUnico === current.documentoAnterior);
            if (pai) {
                if (pai.detentor === secao || pai.detentorOriginal === secao) return true;
                current = pai;
            } else {
                break;
            }
        }
        
        return false;
    };

    // CORREÇÃO: Verifica se o usuário pode ver uma NF específica (suporta NE e RPNP)
    const podeVerNF = (nf) => {
        const nivel = usuarioAtual.nivel;
        const secao = usuarioAtual.secao;
        
        // DESCENTRALIZADORA vê tudo
        if (nivel === 'DESCENTRALIZADORA') {
            return true;
        }
        
        let ncOrigem = null;
        
        // Verifica se é NE ou RPNP
        if (nf.tipoVinculo === 'NE' || !nf.tipoVinculo) {
            // É NE
            const neVinculada = listaNEs.find(ne => ne.id === nf.idNeVinculada);
            if (neVinculada) {
                ncOrigem = listaNCs.find(nc => nc.id === neVinculada.idNcVinculada);
            }
        } else if (nf.tipoVinculo === 'RPNP') {
            // É RPNP
            const rpnpVinculado = listaRPNPs.find(rp => rp.id === nf.idNeVinculada);
            if (rpnpVinculado) {
                // RPNP pode não ter NC vinculada (RPNP com NC digitada)
                if (rpnpVinculado.idNcVinculada) {
                    ncOrigem = listaNCs.find(nc => nc.id === rpnpVinculado.idNcVinculada);
                } else {
                    // RPNP sem NC vinculada: usa o próprio RPNP para verificação
                    if (nivel === 'INTERMEDIARIA' || nivel === 'REQUISITANTE') {
                        // Permite se o RPNP pertence à seção do usuário
                        return rpnpVinculado.detentor === secao;
                    }
                    return false;
                }
            }
        }
        
        if (!ncOrigem) {
            // Se não encontrou NC origem, verifica diretamente pelo criador da NF
            if (nivel === 'REQUISITANTE') {
                return nf.criadoPor === secao;
            }
            return false;
        }
        
        if (nivel === 'INTERMEDIARIA') {
            return secaoEstaNaArvore(ncOrigem.id, secao, listaNCs);
        }
        
        if (nivel === 'REQUISITANTE') {
            // REQUISITANTE: vê se é detentor da NC OU se criou a NF
            return ncOrigem.detentor === secao || nf.criadoPor === secao;
        }
        
        return false;
    };

    // Verifica se o usuário pode editar/excluir/alterar status de uma NF
    const podeEditarNF = (nf) => {
        return nf.criadoPor === usuarioAtual.secao;
    };

    // Função para obter o detentor da NE/RPNP (CORRIGIDA)
    const obterDetentor = (idNeVinculada, tipoVinculo) => {
        if (tipoVinculo === 'NE') {
            const ne = listaNEs.find(ne => ne.id === idNeVinculada);
            if (ne) {
                const ncOrigem = listaNCs.find(nc => nc.id === ne.idNcVinculada);
                return ncOrigem?.detentor || '-';
            }
        } else if (tipoVinculo === 'RPNP') {
            const rpnp = listaRPNPs.find(rp => rp.id === idNeVinculada);
            if (rpnp) {
                // RPNP pode não ter NC vinculada
                if (rpnp.idNcVinculada) {
                    const ncOrigem = listaNCs.find(nc => nc.id === rpnp.idNcVinculada);
                    return ncOrigem?.detentor || rpnp.detentor || '-';
                } else {
                    // RPNP autônomo: usa o próprio detentor do RPNP
                    return rpnp.detentor || '-';
                }
            }
        }
        return '-';
    };

    // Carregar NCs para validação de permissão
    const carregarNCs = () => {
        fetch('http://localhost:5000/credits_nc')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setListaNCs(data); })
            .catch(err => console.error("Erro ao carregar NCs:", err));
    };

    // Buscar NFs
    const carregarNFs = () => {
        fetch('http://localhost:5000/credits_nf')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setListaNFs(data); })
            .catch(err => console.error("Erro ao carregar NFs:", err));
    };

    // Buscar NEs e RPNPs com saldo disponível
    const carregarDocumentosDisponiveis = async () => {
        setCarregandoDocumentos(true);
        try {
            const resNE = await fetch('http://localhost:5000/credits_ne');
            const nes = await resNE.json();
            setListaNEs(nes);
            
            const resRPNP = await fetch('http://localhost:5000/credits_rpnp');
            const rpnps = await resRPNP.json();
            setListaRPNPs(rpnps);
            
            const resNF = await fetch('http://localhost:5000/credits_nf');
            const nfs = await resNF.json();
            
            const nesComSaldo = nes.map(ne => {
                const nfsDaNe = nfs.filter(nf => nf.idNeVinculada === ne.id);
                const totalLiquidado = nfsDaNe.reduce((sum, nf) => sum + (parseFloat(nf.valor) || 0), 0);
                const saldoDisponivel = (ne.valorAtual || 0) - totalLiquidado;
                return { ...ne, saldoDisponivel };
            }).filter(ne => ne.saldoDisponivel > 0);
            
            setNesDisponiveis(nesComSaldo);
            
            const rpnpsComSaldo = rpnps.map(rp => {
                const nfsDoRpnp = nfs.filter(nf => nf.idNeVinculada === rp.id);
                const totalLiquidado = nfsDoRpnp.reduce((sum, nf) => sum + (parseFloat(nf.valor) || 0), 0);
                const saldoDisponivel = (rp.valorAtual || 0) - totalLiquidado;
                return { ...rp, saldoDisponivel };
            }).filter(rp => rp.saldoDisponivel > 0);
            
            setRpnpDisponiveis(rpnpsComSaldo);
        } catch (err) {
            console.error("Erro ao carregar documentos disponíveis:", err);
        } finally {
            setCarregandoDocumentos(false);
        }
    };

    const carregarDadosDoBanco = () => {
        carregarNCs();
        carregarNFs();
        carregarDocumentosDisponiveis();
    };

    useEffect(() => { 
        carregarDadosDoBanco();
    }, []);

    const valorTotalNF = itensNF.reduce((total, item) => {
        const valor = parseFloat(item.valor.replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
        return total + valor;
    }, 0);

    const handleAddItem = () => {
        setItensNF([...itensNF, { id: Date.now(), tipo: 'NE', idVinculo: '', valor: '', numeroDocumento: '', fornecedor: '' }]);
    };

    const handleRemoveItem = (id) => {
        if (itensNF.length === 1) {
            alert('A NF deve ter pelo menos um item vinculado');
            return;
        }
        setItensNF(itensNF.filter(item => item.id !== id));
    };

    const handleItemChange = (itemId, campo, valor) => {
        if (campo === 'idVinculo') {
            setItensNF(prevItens => {
                return prevItens.map(item => {
                    if (item.id === itemId) {
                        const [tipo, idReal] = valor.split('__');
                        const updated = { 
                            ...item, 
                            idVinculo: valor,
                            tipo: tipo,
                            idReal: idReal
                        };
                        
                        if (tipo === 'NE') {
                            const ne = nesDisponiveis.find(n => n.id === idReal);
                            if (ne) {
                                updated.numeroDocumento = ne.numeroNE;
                                updated.fornecedor = ne.nomeFornecedor;
                                if (prevItens.findIndex(i => i.id === itemId) === 0) {
                                    setDadosPreenchidos({
                                        fornecedor: ne.nomeFornecedor,
                                        cnpj: ne.cnpjFornecedor,
                                        processoOriginal: ne.processo || '',
                                        tipoOrigem: 'NE'
                                    });
                                }
                            }
                        } else if (tipo === 'RPNP') {
                            const rpnp = rpnpDisponiveis.find(r => r.id === idReal);
                            if (rpnp) {
                                updated.numeroDocumento = rpnp.numeroNE;
                                updated.fornecedor = rpnp.nomeFornecedor;
                                if (prevItens.findIndex(i => i.id === itemId) === 0) {
                                    setDadosPreenchidos({
                                        fornecedor: rpnp.nomeFornecedor,
                                        cnpj: rpnp.cnpjFornecedor,
                                        processoOriginal: rpnp.processo || '',
                                        tipoOrigem: 'RPNP'
                                    });
                                }
                            }
                        }
                        
                        return updated;
                    }
                    return item;
                });
            });
        } else if (campo === 'valor') {
            setItensNF(prevItens => {
                return prevItens.map(item => {
                    if (item.id === itemId) {
                        return { ...item, valor: valor };
                    }
                    return item;
                });
            });
        }
    };

    const handleSalvarNF = (e) => {
        e.preventDefault();

        if (valorTotalNF <= 0) {
            alert('Valor total da NF deve ser maior que zero');
            return;
        }

        for (const item of itensNF) {
            if (!item.idVinculo) {
                alert('Selecione a NE/RPNP para todos os itens');
                return;
            }
            const valorItem = parseFloat(item.valor.replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
            if (valorItem <= 0) {
                alert('Informe o valor para cada item da NF');
                return;
            }
        }

        const promises = itensNF.map(async (item, index) => {
            const valorNumerico = parseFloat(item.valor.replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
            const idReal = item.idReal || item.idVinculo.split('__')[1];
            const tipo = item.tipo || item.idVinculo.split('__')[0];
            let numeroNEVinculada = item.numeroDocumento || '';
            
            const dadosNF = {
                numeroNF: `${numeroNF}${itensNF.length > 1 ? `-${String.fromCharCode(65 + index)}` : ''}`,
                idNeVinculada: idReal,
                tipoVinculo: tipo,
                numeroNEVinculada,
                fornecedor: dadosPreenchidos.fornecedor || item.fornecedor,
                cnpj: dadosPreenchidos.cnpj,
                processo: processoNF || dadosPreenchidos.processoOriginal,
                valor: valorNumerico,
                linkDriveNF,
                status: "NAO_ENVIADA",
                criadoPor: usuarioAtual.secao
            };

            if (idEmEdicao && index === 0) {
                const nfOriginal = listaNFs.find(i => i.id === idEmEdicao) || {};
                return fetch(`http://localhost:5000/credits_nf/${idEmEdicao}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...nfOriginal, ...dadosNF })
                });
            } else {
                return fetch('http://localhost:5000/credits_nf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...dadosNF, id: Math.random().toString(36).substr(2, 9) })
                });
            }
        });

        Promise.all(promises)
            .then(() => {
                alert(`Nota Fiscal cadastrada com sucesso!\nValor total: R$ ${valorTotalNF.toFixed(2)}`);
                carregarDadosDoBanco();
                fecharE_Limpar();
                if (onSuccess) onSuccess();
            })
            .catch(err => {
                console.error('Erro ao salvar:', err);
                alert('Erro ao cadastrar Nota Fiscal');
            });
    };

    const handleAvancarStatus = (id, statusAtual, nf) => {
        if (!podeEditarNF(nf)) {
            alert('❌ Você não tem permissão para alterar esta Nota Fiscal!');
            return;
        }
        const proximoStatus = statusAtual === "NAO_ENVIADA" ? "ENVIADA_LIQUIDACAO" : "LIQUIDADA";
        fetch(`http://localhost:5000/credits_nf/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: proximoStatus })
        }).then(() => carregarDadosDoBanco());
    };

    const handleVoltarStatus = (id, statusAtual, nf) => {
        if (!podeEditarNF(nf)) {
            alert('❌ Você não tem permissão para alterar esta Nota Fiscal!');
            return;
        }
        const statusAnterior = statusAtual === "LIQUIDADA" ? "ENVIADA_LIQUIDACAO" : "NAO_ENVIADA";
        fetch(`http://localhost:5000/credits_nf/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: statusAnterior })
        }).then(() => carregarDadosDoBanco());
    };

    const handleExcluirNF = (id, numeroIdentificador, nf) => {
        if (!podeEditarNF(nf)) {
            alert('❌ Você não tem permissão para excluir esta Nota Fiscal!');
            return;
        }
        if (window.confirm(`Deseja realmente excluir permanentemente a Nota Fiscal Nº ${numeroIdentificador}?`)) {
            fetch(`http://localhost:5000/credits_nf/${id}`, { method: 'DELETE' }).then(() => carregarDadosDoBanco());
        }
    };

    const handleAbrirEdicao = (item) => {
        if (!podeEditarNF(item)) {
            alert('❌ Você não tem permissão para editar esta Nota Fiscal!');
            return;
        }
        setIdEmEdicao(item.id);
        setNumeroNF(item.numeroNF?.split('-')[0] || '');
        setProcessoNF(item.processo || '');
        setLinkDriveNF(item.linkDriveNF || '');
        setItensNF([{
            id: Date.now(),
            tipo: item.tipoVinculo || 'NE',
            idVinculo: `${item.tipoVinculo || 'NE'}__${item.idNeVinculada}`,
            idReal: item.idNeVinculada,
            valor: item.valor?.toString() || '',
            numeroDocumento: item.numeroNEVinculada,
            fornecedor: item.fornecedor
        }]);
        setDadosPreenchidos({
            fornecedor: item.fornecedor || '',
            cnpj: item.cnpj || '',
            processoOriginal: item.processo || '',
            tipoOrigem: item.tipoVinculo || 'NE'
        });
        setIsNovoProcesso(false);
        setIsModalOpen(true);
    };

    const fecharE_Limpar = () => {
        setIdEmEdicao(null);
        setNumeroNF('');
        setProcessoNF('');
        setLinkDriveNF('');
        setItensNF([{ id: Date.now(), tipo: 'NE', idVinculo: '', valor: '', numeroDocumento: '', fornecedor: '' }]);
        setIsNovoProcesso(false);
        setDadosPreenchidos({ fornecedor: '', cnpj: '', processoOriginal: '', tipoOrigem: '' });
        setIsModalOpen(false);
        if (onClose) {
            onClose();
        }
        carregarDadosDoBanco();
    };

    // Filtrar NFs por permissão de visualização
    const nfsComPermissao = listaNFs.filter(nf => podeVerNF(nf));

    const nfsFiltradas = nfsComPermissao.filter(item => (
        (item.numeroNF || '').toLowerCase().includes(filtroNF.toLowerCase()) &&
        (item.numeroNEVinculada || '').toLowerCase().includes(filtroNE.toLowerCase()) &&
        (item.fornecedor || '').toLowerCase().includes(filtroFornecedor.toLowerCase())
    ));

    const nfsNaoEnviadas = nfsFiltradas.filter(item => item.status === "NAO_ENVIADA");
    const nfsEnviadas = nfsFiltradas.filter(item => item.status === "ENVIADA_LIQUIDACAO");
    const nfsLiquidadas = nfsFiltradas.filter(item => item.status === "LIQUIDADA");

    // Se for usado como modal (tem onClose), retorna apenas o formulário modal
    if (onClose) {
        return (
            <div className={styles.modalOverlay}>
                <div className={styles.modalForm}>
                    <div className={styles.modalHeader}>
                        <BsPlusSquareFill />
                        <h3>{idEmEdicao ? 'EDITAR NOTA FISCAL (NF)' : 'GERAR NOVA NOTA FISCAL (NF)'}</h3>
                    </div>
                    
                    <form className={styles.formStyled} onSubmit={handleSalvarNF}>
                        <div className={styles.formContent}>
                            <div className={styles.formSection}>
                                <div className={styles.sectionHeader_Modal}><BsInfoCircleFill /> <h4>1. DADOS DA NOTA FISCAL</h4></div>
                                <div className={styles.inputGrid_Modal}>
                                    <div className={styles.inputGroup}><label>Número da NF</label><input type="text" className={styles.inputField} value={numeroNF} onChange={(e) => setNumeroNF(e.target.value)} required /></div>
                                    <div className={styles.inputGroup}><label>Valor Total da NF</label><input type="text" className={styles.inputField} value={`R$ ${valorTotalNF.toFixed(2)}`} disabled style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold', color: '#2f855a' }} /></div>
                                    <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}><label>Link da NF no Drive</label><input type="url" className={styles.inputField} value={linkDriveNF} onChange={(e) => setLinkDriveNF(e.target.value)} required /></div>
                                </div>
                            </div>

                            <div className={styles.formSection}>
                                <div className={styles.sectionHeader_Modal}><BsFileEarmarkTextFill /> <h4>2. ITENS DA NOTA FISCAL (NEs/RPNPs)</h4></div>
                                {carregandoDocumentos ? (
                                    <div className={styles.carregandoMsg}>Carregando documentos disponíveis...</div>
                                ) : (
                                    <>
                                        {itensNF.map((item, index) => (
                                            <div key={item.id} className={styles.itemNFContainer}>
                                                <div className={styles.itemNFHeader}>
                                                    <strong>Item {index + 1}</strong>
                                                    {itensNF.length > 1 && (
                                                        <button type="button" className={styles.btnRemoveItem} onClick={() => handleRemoveItem(item.id)}>
                                                            <BsTrash /> Remover
                                                        </button>
                                                    )}
                                                </div>
                                                <div className={styles.inputGrid_Modal}>
                                                    <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                                                        <label>NE / RPNP</label>
                                                        <select 
                                                            className={styles.selectPrimary} 
                                                            value={item.idVinculo || ""} 
                                                            onChange={(e) => handleItemChange(item.id, 'idVinculo', e.target.value)} 
                                                            required
                                                        >
                                                            <option value="">-- Selecione --</option>
                                                            {nesDisponiveis.length > 0 && (
                                                                <optgroup label="NOTAS DE EMPENHO">
                                                                    {nesDisponiveis.map(ne => (
                                                                        <option key={ne.id} value={`NE__${ne.id}`}>
                                                                            {ne.numeroNE} - Saldo: R$ {ne.saldoDisponivel.toFixed(2)} - {ne.nomeFornecedor}
                                                                        </option>
                                                                    ))}
                                                                </optgroup>
                                                            )}
                                                            {rpnpDisponiveis.length > 0 && (
                                                                <optgroup label="RPNP">
                                                                    {rpnpDisponiveis.map(r => (
                                                                        <option key={r.id} value={`RPNP__${r.id}`}>
                                                                            {r.numeroNE} - Saldo: R$ {r.saldoDisponivel.toFixed(2)} - {r.nomeFornecedor}
                                                                        </option>
                                                                    ))}
                                                                </optgroup>
                                                            )}
                                                        </select>
                                                    </div>
                                                    <div className={styles.inputGroup}>
                                                        <label>Valor (R$)</label>
                                                        <input type="text" className={styles.inputField} value={item.valor} onChange={(e) => handleItemChange(item.id, 'valor', e.target.value)} placeholder="0,00" required />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <button type="button" className={styles.btnAddItem} onClick={handleAddItem}>
                                            <BsPlus /> Adicionar outro item
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className={styles.formSection}>
                                <div className={styles.sectionHeader_Modal}><BsBuilding /> <h4>3. FORNECEDOR E PROCESSO</h4></div>
                                <div className={styles.inputGrid_Modal}>
                                    <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}><label>Razão Social</label><input type="text" className={styles.inputDisabled} value={dadosPreenchidos.fornecedor} disabled /></div>
                                    <div className={styles.inputGroup}><label>CNPJ</label><input type="text" className={styles.inputDisabled} value={dadosPreenchidos.cnpj} disabled /></div>
                                    <div className={styles.inputGroup}>
                                        <label>Número do Processo</label>
                                        <input type="text" className={!isNovoProcesso ? styles.inputDisabled : styles.inputField} value={processoNF || dadosPreenchidos.processoOriginal} onChange={(e) => setProcessoNF(e.target.value)} disabled={!isNovoProcesso} required />
                                    </div>
                                </div>
                                <div className={styles.checkboxWrapper}>
                                    <input type="checkbox" checked={isNovoProcesso} onChange={(e) => { setIsNovoProcesso(e.target.checked); if(!e.target.checked) setProcessoNF(''); }} />
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
        );
    }

    // Se não for modal, mostra a página completa com as tabelas
    return (
        <div className={styles.mainContainer}>
            <div className={styles.filterBar}>
                <div className={styles.filterGroup}><label>Número da NF</label><input type="text" value={filtroNF} onChange={(e) => setFiltroNF(e.target.value)} /></div>
                <div className={styles.filterGroup}><label>NE / RPNP</label><input type="text" value={filtroNE} onChange={(e) => setFiltroNE(e.target.value)} /></div>
                <div className={styles.filterGroup}><label>Fornecedor</label><input type="text" value={filtroFornecedor} onChange={(e) => setFiltroFornecedor(e.target.value)} /></div>
            </div>

            {/* TABELA 1: NÃO ENVIADAS */}
            <div className={styles.statusSection}>
                <div className={styles.sectionHeader}><h3 className={styles.tituloNaoEnviada}>Não Enviadas para Liquidação</h3><span className={`${styles.badge} ${styles.badgeNaoEnviada}`}>{nfsNaoEnviadas.length}</span></div>
                <div className={styles.tableContainer}>
                    <table className={styles.customTable}>
                        <thead>
                            <tr>
                                <th className={styles.colNF}>NF</th>
                                <th className={styles.colNE}>NE / RPNP</th>
                                <th className={styles.colDetentor}>Detentor</th>
                                <th className={styles.colProcesso}>Processo</th>
                                <th className={styles.colFornecedor}>Fornecedor</th>
                                <th className={styles.colValor}>Valor</th>
                                <th className={styles.colAcoes}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {nfsNaoEnviadas.map(item => {
                                const podeEditar = podeEditarNF(item);
                                const detentor = obterDetentor(item.idNeVinculada, item.tipoVinculo);
                                return (
                                    <tr key={item.id}>
                                        <td><button className={styles.btnLinkTabela} onClick={() => item.linkDriveNF && window.open(item.linkDriveNF, '_blank')}>{item.numeroNF}</button></td>
                                        <td>
                                            <button 
                                                className={styles.linkDocumento}
                                                onClick={() => onVerDetalhesNE && onVerDetalhesNE(item.idNeVinculada)}
                                                title="Clique para ver detalhes"
                                            >
                                                {item.numeroNEVinculada}
                                            </button>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>{detentor}</td>
                                        <td>{item.processo}</td>
                                        <td >{item.fornecedor}</td>
                                        <td style={{ fontWeight: "bold" }}>{item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                        <td>
                                            <div className={styles.acoesContainer}>
                                                <button 
                                                    className={styles.btnStatusAction} 
                                                    onClick={() => handleAvancarStatus(item.id, item.status, item)}
                                                    disabled={!podeEditar}
                                                    style={!podeEditar ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                                >
                                                    Enviar Liquidação
                                                </button>
                                                <button 
                                                    className={styles.btnStatusAction} 
                                                    style={{ backgroundColor: '#0284c7' }} 
                                                    onClick={() => handleAbrirEdicao(item)}
                                                    disabled={!podeEditar}
                                                >
                                                    Editar
                                                </button>
                                                <button 
                                                    className={styles.btnStatusAction} 
                                                    style={{ backgroundColor: '#dc2626' }} 
                                                    onClick={() => handleExcluirNF(item.id, item.numeroNF, item)}
                                                    disabled={!podeEditar}
                                                >
                                                    Excluir
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* TABELA 2: ENVIADAS */}
            <div className={styles.statusSection}>
                <div className={styles.sectionHeader}><h3 className={styles.tituloEnviada}>Enviadas para Liquidação (Em Processo)</h3><span className={`${styles.badge} ${styles.badgeEnviada}`}>{nfsEnviadas.length}</span></div>
                <div className={styles.tableContainer}>
                    <table className={styles.customTable}>
                        <thead>
                            <tr>
                                <th className={styles.colNF}>NF</th>
                                <th className={styles.colNE}>NE / RPNP</th>
                                <th className={styles.colDetentor}>Detentor</th>
                                <th className={styles.colProcesso}>Processo</th>
                                <th className={styles.colFornecedor}>Fornecedor</th>
                                <th className={styles.colValor}>Valor</th>
                                <th className={styles.colAcoes}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {nfsEnviadas.map(item => {
                                const podeEditar = podeEditarNF(item);
                                const detentor = obterDetentor(item.idNeVinculada, item.tipoVinculo);
                                return (
                                    <tr key={item.id}>
                                        <td><button className={styles.btnLinkTabela} onClick={() => item.linkDriveNF && window.open(item.linkDriveNF, '_blank')}>{item.numeroNF}</button></td>
                                        <td>
                                            <button 
                                                className={styles.linkDocumento}
                                                onClick={() => onVerDetalhesNE && onVerDetalhesNE(item.idNeVinculada)}
                                                title="Clique para ver detalhes"
                                            >
                                                {item.numeroNEVinculada}
                                            </button>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>{detentor}</td>
                                        <td>{item.processo}</td>
                                        <td>{item.fornecedor}</td>
                                        <td style={{ fontWeight: "bold" }}>{item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                        <td>
                                            <div className={styles.acoesContainer}>
                                                <button 
                                                    className={styles.btnStatusAction} 
                                                    style={{ backgroundColor: '#2563eb' }} 
                                                    onClick={() => handleVoltarStatus(item.id, item.status, item)}
                                                    disabled={!podeEditar}
                                                >
                                                    Voltar
                                                </button>
                                                <button 
                                                    className={styles.btnStatusAction} 
                                                    style={{ backgroundColor: '#28a745' }} 
                                                    onClick={() => handleAvancarStatus(item.id, item.status, item)}
                                                    disabled={!podeEditar}
                                                >
                                                    Liquidar
                                                </button>
                                                <button 
                                                    className={styles.btnStatusAction} 
                                                    style={{ backgroundColor: '#0284c7' }} 
                                                    onClick={() => handleAbrirEdicao(item)}
                                                    disabled={!podeEditar}
                                                >
                                                    Editar
                                                </button>
                                                <button 
                                                    className={styles.btnStatusAction} 
                                                    style={{ backgroundColor: '#dc2626' }} 
                                                    onClick={() => handleExcluirNF(item.id, item.numeroNF, item)}
                                                    disabled={!podeEditar}
                                                >
                                                    Excluir
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* TABELA 3: LIQUIDADAS */}
            <div className={styles.statusSection}>
                <div className={styles.sectionHeader}><h3 className={styles.tituloLiquidada}>Liquidadas (Pagas e Concluídas)</h3><span className={`${styles.badge} ${styles.badgeLiquidada}`}>{nfsLiquidadas.length}</span></div>
                <div className={styles.tableContainer}>
                    <table className={styles.customTable}>
                        <thead>
                            <tr>
                                <th className={styles.colNF}>NF</th>
                                <th className={styles.colNE}>NE / RPNP</th>
                                <th className={styles.colDetentor}>Detentor</th>
                                <th className={styles.colProcesso}>Processo</th>
                                <th className={styles.colFornecedor}>Fornecedor</th>
                                <th className={styles.colValor}>Valor</th>
                                <th className={styles.colAcoes}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {nfsLiquidadas.map(item => {
                                const podeEditar = podeEditarNF(item);
                                const detentor = obterDetentor(item.idNeVinculada, item.tipoVinculo);
                                return (
                                    <tr key={item.id}>
                                        <td><button className={styles.btnLinkTabela} onClick={() => item.linkDriveNF && window.open(item.linkDriveNF, '_blank')}>{item.numeroNF}</button></td>
                                        <td>
                                            <button 
                                                className={styles.linkDocumento}
                                                onClick={() => onVerDetalhesNE && onVerDetalhesNE(item.idNeVinculada)}
                                                title="Clique para ver detalhes"
                                            >
                                                {item.numeroNEVinculada}
                                            </button>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>{detentor}</td>
                                        <td>{item.processo}</td>
                                        <td>{item.fornecedor}</td>
                                        <td style={{ fontWeight: "bold" }}>{item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                        <td>
                                            <div className={styles.acoesContainer}>
                                                <button 
                                                    className={styles.btnStatusAction} 
                                                    style={{ backgroundColor: '#2563eb' }} 
                                                    onClick={() => handleVoltarStatus(item.id, item.status, item)}
                                                    disabled={!podeEditar}
                                                >
                                                    Estornar Liquidação
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL DE INCLUSÃO/EDIÇÃO */}
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
                                    <div className={styles.sectionHeader_Modal}><BsInfoCircleFill /> <h4>1. DADOS DA NOTA FISCAL</h4></div>
                                    <div className={styles.inputGrid_Modal}>
                                        <div className={styles.inputGroup}><label>Número da NF</label><input type="text" className={styles.inputField} value={numeroNF} onChange={(e) => setNumeroNF(e.target.value)} required /></div>
                                        <div className={styles.inputGroup}><label>Valor Total da NF</label><input type="text" className={styles.inputField} value={`R$ ${valorTotalNF.toFixed(2)}`} disabled style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold', color: '#2f855a' }} /></div>
                                        <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}><label>Link da NF no Drive</label><input type="url" className={styles.inputField} value={linkDriveNF} onChange={(e) => setLinkDriveNF(e.target.value)} required /></div>
                                    </div>
                                </div>

                                <div className={styles.formSection}>
                                    <div className={styles.sectionHeader_Modal}><BsFileEarmarkTextFill /> <h4>2. ITENS DA NOTA FISCAL (NEs/RPNPs)</h4></div>
                                    {carregandoDocumentos ? (
                                        <div className={styles.carregandoMsg}>Carregando documentos disponíveis...</div>
                                    ) : (
                                        <>
                                            {itensNF.map((item, index) => (
                                                <div key={item.id} className={styles.itemNFContainer}>
                                                    <div className={styles.itemNFHeader}>
                                                        <strong>Item {index + 1}</strong>
                                                        {itensNF.length > 1 && (
                                                            <button type="button" className={styles.btnRemoveItem} onClick={() => handleRemoveItem(item.id)}>
                                                                <BsTrash /> Remover
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className={styles.inputGrid_Modal}>
                                                        <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                                                            <label>NE / RPNP</label>
                                                            <select 
                                                                className={styles.selectPrimary} 
                                                                value={item.idVinculo || ""} 
                                                                onChange={(e) => handleItemChange(item.id, 'idVinculo', e.target.value)} 
                                                                required
                                                            >
                                                                <option value="">-- Selecione --</option>
                                                                {nesDisponiveis.length > 0 && (
                                                                    <optgroup label="NOTAS DE EMPENHO">
                                                                        {nesDisponiveis.map(ne => (
                                                                            <option key={ne.id} value={`NE__${ne.id}`}>
                                                                                {ne.numeroNE} - Saldo: R$ {ne.saldoDisponivel.toFixed(2)} - {ne.nomeFornecedor}
                                                                            </option>
                                                                        ))}
                                                                    </optgroup>
                                                                )}
                                                                {rpnpDisponiveis.length > 0 && (
                                                                    <optgroup label="RPNP">
                                                                        {rpnpDisponiveis.map(r => (
                                                                            <option key={r.id} value={`RPNP__${r.id}`}>
                                                                                {r.numeroNE} - Saldo: R$ {r.saldoDisponivel.toFixed(2)} - {r.nomeFornecedor}
                                                                            </option>
                                                                        ))}
                                                                    </optgroup>
                                                                )}
                                                            </select>
                                                        </div>
                                                        <div className={styles.inputGroup}>
                                                            <label>Valor (R$)</label>
                                                            <input type="text" className={styles.inputField} value={item.valor} onChange={(e) => handleItemChange(item.id, 'valor', e.target.value)} placeholder="0,00" required />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button type="button" className={styles.btnAddItem} onClick={handleAddItem}>
                                                <BsPlus /> Adicionar outro item
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div className={styles.formSection}>
                                    <div className={styles.sectionHeader_Modal}><BsBuilding /> <h4>3. FORNECEDOR E PROCESSO</h4></div>
                                    <div className={styles.inputGrid_Modal}>
                                        <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}><label>Razão Social</label><input type="text" className={styles.inputDisabled} value={dadosPreenchidos.fornecedor} disabled /></div>
                                        <div className={styles.inputGroup}><label>CNPJ</label><input type="text" className={styles.inputDisabled} value={dadosPreenchidos.cnpj} disabled /></div>
                                        <div className={styles.inputGroup}>
                                            <label>Número do Processo</label>
                                            <input type="text" className={!isNovoProcesso ? styles.inputDisabled : styles.inputField} value={processoNF || dadosPreenchidos.processoOriginal} onChange={(e) => setProcessoNF(e.target.value)} disabled={!isNovoProcesso} required />
                                        </div>
                                    </div>
                                    <div className={styles.checkboxWrapper}>
                                        <input type="checkbox" checked={isNovoProcesso} onChange={(e) => { setIsNovoProcesso(e.target.checked); if(!e.target.checked) setProcessoNF(''); }} />
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
    );
}

export default Invoice;