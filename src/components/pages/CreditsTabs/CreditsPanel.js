import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useMemo, useCallback } from 'react';
import styles from '../../styles/styles_pages/styles_creditsTabs/CreditsPanel.module.css';

import CreditsCard from './CreditsCard'; 
import CreditsCardNC from './CreditsCardNC';
import CreditsCardNCDisabled from './CreditsCardNCDisabled';
import TransferModal from './modais/TransferModal';
import NewNE from './NewNE';
import CancelarNEModal from './modais/CancelarNEModal';
import EditarNEModal from './modais/EditarNEModal';
import EditarNCModal from './modais/EditarNCModal';
import NCDetail from './NCDetail';

function CreditsPanel({ fonteAlvo, ugAlvo, onVerDetalhes, onVerDetalhesNC, onUgChange }) {
    const { usuarioAtual } = useAuth();
    const [listaNCs, setListaNCs] = useState([]);
    const [listaNEs, setListaNEs] = useState([]);
    const [listaNFs, setListaNFs] = useState([]); 
    const [listaItensPregao, setListaItensPregao] = useState([]);
    const [modoTransferencia, setModoTransferencia] = useState('transferir');
    const [isNeModalOpen, setIsNeModalOpen] = useState(false);
    const [creditoParaEmpenhar, setCreditoParaEmpenhar] = useState(null);
    const [isNCDetailOpen, setIsNCDetailOpen] = useState(false);
    const [idNCDetalhada, setIdNCDetalhada] = useState(null);
    
    const [isCancelarModalOpen, setIsCancelarModalOpen] = useState(false);
    const [isEditarNEModalOpen, setIsEditarNEModalOpen] = useState(false);
    const [isEditarNCModalOpen, setIsEditarNCModalOpen] = useState(false);
    const [neParaCancelar, setNeParaCancelar] = useState(null);
    const [neParaEditar, setNeParaEditar] = useState(null);
    const [ncParaEditar, setNcParaEditar] = useState(null);
    const [ncOrigemParaEdicao, setNcOrigemParaEdicao] = useState(null);
    
    const [abaNEsAtiva, setAbaNEsAtiva] = useState('em_andamento');
    
    const [abertoRecebimento, setAbertoRecebimento] = useState(false);
    const [abertoEnviado, setAbertoEnviado] = useState(false);
    const [abertoNCDisponivel, setAbertoNCDisponivel] = useState(false);
    const [abertoNEAndamento, setAbertoNEAndamento] = useState(false);
    
    const [filtroRecebimento, setFiltroRecebimento] = useState({ documento: '', processo: '', om: '', fornecedor: '', descricao: '' });
    const [filtroEnviado, setFiltroEnviado] = useState({ documento: '', processo: '', om: '', fornecedor: '', descricao: '' });
    const [filtroNCDisponivel, setFiltroNCDisponivel] = useState({ documento: '', processo: '', om: '', fornecedor: '', descricao: '' });
    const [filtroNEAndamento, setFiltroNEAndamento] = useState({ documento: '', processo: '', om: '', fornecedor: '', descricao: '' });

    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [creditoParaTransferir, setCreditoParaTransferir] = useState(null);

    const abrirDetalhesNC = (id) => {
        setIdNCDetalhada(id);
        setIsNCDetailOpen(true);
    };

    const voltarDaNCDetalhe = () => {
        setIsNCDetailOpen(false);
        setIdNCDetalhada(null);
    };

    const abrirDetalhesNE = (idNE) => {
        if (onVerDetalhes) {
            onVerDetalhes(idNE);
        }
    };

    const carregarDados = useCallback(() => {
        fetch('http://localhost:5000/credits_nc')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const apenasFonteEspecifica = data.filter(item => item.fonteRecurso === fonteAlvo);
                    setListaNCs(apenasFonteEspecifica);
                }
            })
            .catch(err => console.error("Erro ao carregar NCs:", err));

        fetch('http://localhost:5000/credits_ne')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setListaNEs(data);
            })
            .catch(err => console.error("Erro ao carregar NEs:", err));

        fetch('http://localhost:5000/credits_nf')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setListaNFs(data);
            })
            .catch(err => console.error("Erro ao carregar NFs:", err));

        fetch('http://localhost:5000/credits')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setListaItensPregao(data);
            })
            .catch(err => console.error("Erro ao carregar itens do pregão:", err));
    }, [fonteAlvo]);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    const podeEditarNC = (nc) => {
        // Apenas a seção que CRIOU pode editar (detentorOriginal)
        return nc.detentorOriginal === usuarioAtual.secao;
    };

    const podeEditarNE = (ne) => {
        const ncOrigem = listaNCs.find(nc => nc.id === ne.idNcVinculada);
        // Apenas a seção que CRIOU a NC pode editar a NE
        return ncOrigem && ncOrigem.detentorOriginal === usuarioAtual.secao;
    };

    const podeExcluirNC = (nc) => {
        // Apenas a seção que CRIOU pode excluir
        return nc.detentorOriginal === usuarioAtual.secao;
    };

    const handleAbrirTransferencia = (credito) => {
        setModoTransferencia('transferir');
        setCreditoParaTransferir(credito);
        setIsTransferModalOpen(true);
    };

    const handleAbrirDevolucao = (credito) => {
        if (!credito.documentoAnterior) {
            alert('Este crédito não pode ser devolvido pois é original.');
            return;
        }
        setCreditoParaTransferir(credito);
        setModoTransferencia('devolver');
        setIsTransferModalOpen(true);
    };

    const handleExcluirItem = async (id, tipo, numeroIdentificador, item) => {
        // Verifica se a seção atual é a criadora original
        if (item.detentorOriginal !== usuarioAtual.secao) {
            alert('❌ Apenas a seção que criou o crédito original pode excluí-lo!');
            return;
        }
        
        if (tipo === 'NC') {
            try {
                // Verificar se existem NEs vinculadas
                const resNEs = await fetch(`http://localhost:5000/credits_ne?idNcVinculada=${id}`);
                const nesVinculadas = await resNEs.json();
                
                if (nesVinculadas.length > 0) {
                    alert(`❌ Não é possível excluir esta NC pois existem ${nesVinculadas.length} Nota(s) de Empenho vinculada(s). Cancele as NEs primeiro.`);
                    return;
                }
                
                // Verificar se existem transferências
                const resTransferencias = await fetch(`http://localhost:5000/credits_nc?documentoAnterior=${item.codigoUnico}`);
                const transferencias = await resTransferencias.json();
                
                if (transferencias.length > 0) {
                    alert(`❌ Não é possível excluir esta NC pois existem ${transferencias.length} transferência(s) vinculada(s).`);
                    return;
                }
            } catch (err) {
                console.error('Erro ao verificar dependências:', err);
                alert('Erro ao verificar dependências da NC.');
                return;
            }
        }
        
        const confirmacao = window.confirm(`Deseja realmente excluir permanentemente o documento Nº ${numeroIdentificador}?\n\nEsta ação não pode ser desfeita.`);
        if (!confirmacao) return;
        
        const endpoint = tipo === 'NC' ? 'credits_nc' : 'credits_ne';
        fetch(`http://localhost:5000/${endpoint}/${id}`, { method: 'DELETE' })
        .then(() => { 
            alert('Documento removido com sucesso!'); 
            carregarDados(); 
        })
        .catch(err => {
            console.error('Erro ao excluir:', err);
            alert('Erro ao excluir o documento.');
        });
    };

    const handleEditarNC = (nc) => {
        if (!podeEditarNC(nc)) {
            alert('❌ Apenas a seção que criou este crédito pode editá-lo!');
            return;
        }
        setNcParaEditar(nc);
        setIsEditarNCModalOpen(true);
    };

    const handleEditarNE = (ne) => {
        if (!podeEditarNE(ne)) {
            alert('❌ Apenas a seção que criou o crédito original pode editar esta N.E.!');
            return;
        }
        const ncOrigem = listaNCs.find(nc => nc.id === ne.idNcVinculada);
        setNeParaEditar(ne);
        setNcOrigemParaEdicao(ncOrigem);
        setIsEditarNEModalOpen(true);
    };

    const handleCancelarNE = (ne) => {
        setNeParaCancelar(ne);
        setIsCancelarModalOpen(true);
    };

    const handleAbrirDetalhar = (item, tipo) => {
        if (tipo === 'NC') {
            if (item.linkDrive) window.open(item.linkDrive, '_blank', 'noopener,noreferrer');
            else alert('Link do Google Drive não localizado.');
        } else {
            if (onVerDetalhes) {
                onVerDetalhes(item.id);
            }
        }
    };

    const handleConfirmarRecebimento = (credito) => {
        const creditoAtualizado = {
            ...credito,
            statusRecebimento: 'RECEBIDO'
        };

        if (credito.documentoAnterior) {
            fetch(`http://localhost:5000/credits_nc?codigoUnico=${credito.documentoAnterior}`)
                .then(res => res.json())
                .then(data => {
                    if (data.length > 0) {
                        const creditoOriginal = data[0];
                        const creditoOriginalAtualizado = {
                            ...creditoOriginal,
                            transferenciaPendente: false,
                            codigoTransferido: null
                        };
                        
                        fetch(`http://localhost:5000/credits_nc/${creditoOriginal.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(creditoOriginalAtualizado)
                        });
                    }
                });
        }

        fetch(`http://localhost:5000/credits_nc/${credito.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(creditoAtualizado)
        })
        .then(() => {
            alert(`Crédito ${credito.codigoUnico} recebido com sucesso!`);
            carregarDados();
        })
        .catch(err => {
            console.error('Erro ao confirmar recebimento:', err);
            alert('Erro ao confirmar recebimento. Tente novamente.');
        });
    };

    const handleAbrirEmpenho = (credito) => {
        setCreditoParaEmpenhar(credito);
        setIsNeModalOpen(true);
    };

    const handleFecharNeModal = () => {
        setIsNeModalOpen(false);
        setCreditoParaEmpenhar(null);
        carregarDados();
    };

    const handleUgChange = (novaUg) => {
        if (onUgChange) {
            onUgChange(novaUg);
        }
    };

    const ncsDisponiveis = useMemo(() => {
        const ncsDaSecao = listaNCs.filter(card => 
            card.detentor === usuarioAtual.secao &&
            (card.saldoDisponivel || 0) > 0 &&
            (card.statusRecebimento === 'RECEBIDO' || card.statusRecebimento === undefined || card.statusRecebimento === null)
        );
        
        const filtrados = ncsDaSecao.filter(card => 
            (card.nc || '').toLowerCase().includes(filtroNCDisponivel.documento.toLowerCase()) &&
            (card.processo || '').toLowerCase().includes(filtroNCDisponivel.processo.toLowerCase()) &&
            (card.omAplicacao || '').toLowerCase().includes(filtroNCDisponivel.om.toLowerCase()) &&
            (card.fornecedor || '').toLowerCase().includes(filtroNCDisponivel.fornecedor.toLowerCase()) &&
            (card.finalidade || '').toLowerCase().includes(filtroNCDisponivel.descricao.toLowerCase())
        );
        
        return filtrados;
    }, [listaNCs, filtroNCDisponivel, usuarioAtual.secao]);

    const creditosEnviadosPendentes = useMemo(() => {
        const codigosDoUsuario = listaNCs
            .filter(card => card.detentor === usuarioAtual.secao)
            .map(card => card.codigoUnico);
        
        let pendentes = listaNCs.filter(card => 
            card.statusRecebimento === 'PENDENTE' &&
            card.documentoAnterior !== null &&
            card.documentoAnterior !== undefined &&
            codigosDoUsuario.includes(card.documentoAnterior)
        );
        
        pendentes = pendentes.filter(card => 
            (card.nc || '').toLowerCase().includes(filtroEnviado.documento.toLowerCase()) &&
            (card.processo || '').toLowerCase().includes(filtroEnviado.processo.toLowerCase()) &&
            (card.omAplicacao || '').toLowerCase().includes(filtroEnviado.om.toLowerCase()) &&
            (card.fornecedor || '').toLowerCase().includes(filtroEnviado.fornecedor.toLowerCase()) &&
            (card.finalidade || '').toLowerCase().includes(filtroEnviado.descricao.toLowerCase())
        );
        
        return pendentes;
    }, [listaNCs, usuarioAtual.secao, filtroEnviado]);

    const creditosRecebidos = useMemo(() => {
        let recebidos = listaNCs.filter(card => 
            card.documentoAnterior !== null && 
            card.documentoAnterior !== undefined &&
            card.detentor === usuarioAtual.secao &&
            card.statusRecebimento === 'PENDENTE'
        );
        
        recebidos = recebidos.filter(card => 
            (card.nc || '').toLowerCase().includes(filtroRecebimento.documento.toLowerCase()) &&
            (card.processo || '').toLowerCase().includes(filtroRecebimento.processo.toLowerCase()) &&
            (card.omAplicacao || '').toLowerCase().includes(filtroRecebimento.om.toLowerCase()) &&
            (card.fornecedor || '').toLowerCase().includes(filtroRecebimento.fornecedor.toLowerCase()) &&
            (card.finalidade || '').toLowerCase().includes(filtroRecebimento.descricao.toLowerCase())
        );
        
        return recebidos;
    }, [listaNCs, filtroRecebimento, usuarioAtual.secao]);

    const obterSaldoAtualNE = useCallback((neId, valorEmpenhado) => {
        const nfsDaNe = listaNFs.filter(nf => nf.idNeVinculada === neId);
        const totalLiquidado = nfsDaNe.reduce((sum, nf) => sum + (parseFloat(nf.valor) || 0), 0);
        return valorEmpenhado - totalLiquidado;
    }, [listaNFs]);

    const nesEmAndamento = useMemo(() => {
        const ncsDoUsuario = listaNCs.filter(nc => nc.detentor === usuarioAtual.secao);
        const idsNcsDoUsuario = ncsDoUsuario.map(nc => nc.id);
        
        let nes = listaNEs.filter(ne => {
            if (!idsNcsDoUsuario.includes(ne.idNcVinculada)) return false;
            const saldoAtual = obterSaldoAtualNE(ne.id, ne.valorAtual);
            return saldoAtual > 0;
        });
        
        nes = nes.filter(ne => {
            const ncOrigem = listaNCs.find(nc => nc.id === ne.idNcVinculada);
            return (
                (ne.numeroNE || '').toLowerCase().includes(filtroNEAndamento.documento.toLowerCase()) &&
                (ncOrigem?.processo || '').toLowerCase().includes(filtroNEAndamento.processo.toLowerCase()) &&
                (ncOrigem?.omAplicacao || '').toLowerCase().includes(filtroNEAndamento.om.toLowerCase()) &&
                (ne.nomeFornecedor || '').toLowerCase().includes(filtroNEAndamento.fornecedor.toLowerCase()) &&
                (ne.finalidade || ne.materialNE || '').toLowerCase().includes(filtroNEAndamento.descricao.toLowerCase())
            );
        });
        
        return nes.map(ne => ({
            ...ne,
            saldoAtual: obterSaldoAtualNE(ne.id, ne.valorAtual)
        }));
    }, [listaNEs, listaNCs, usuarioAtual.secao, filtroNEAndamento, obterSaldoAtualNE]);

    const nesFinalizados = useMemo(() => {
        const ncsDoUsuario = listaNCs.filter(nc => nc.detentor === usuarioAtual.secao);
        const idsNcsDoUsuario = ncsDoUsuario.map(nc => nc.id);
        
        let nes = listaNEs.filter(ne => {
            if (!idsNcsDoUsuario.includes(ne.idNcVinculada)) return false;
            const saldoAtual = obterSaldoAtualNE(ne.id, ne.valorAtual);
            return saldoAtual === 0;
        });
        
        return nes.map(ne => ({
            ...ne,
            saldoAtual: obterSaldoAtualNE(ne.id, ne.valorAtual)
        }));
    }, [listaNEs, listaNCs, usuarioAtual.secao, obterSaldoAtualNE]);

    const FiltrosSubdivisao = ({ filtro, setFiltro }) => (
        <div className={styles.filtrosSubdivisao}>
            <div className={styles.filtroRow}>
                <div className={styles.filtroGroup}>
                    <label>Nº do Documento</label>
                    <input type="text" placeholder="Buscar..." value={filtro.documento} onChange={(e) => setFiltro(prev => ({ ...prev, documento: e.target.value }))} />
                </div>
                <div className={styles.filtroGroup}>
                    <label>Número do Processo</label>
                    <input type="text" placeholder="Buscar..." value={filtro.processo} onChange={(e) => setFiltro(prev => ({ ...prev, processo: e.target.value }))} />
                </div>
                <div className={styles.filtroGroup}>
                    <label>OM de Aplicação</label>
                    <input type="text" placeholder="Buscar..." value={filtro.om} onChange={(e) => setFiltro(prev => ({ ...prev, om: e.target.value }))} />
                </div>
                <div className={styles.filtroGroup}>
                    <label>Fornecedor</label>
                    <input type="text" placeholder="Buscar..." value={filtro.fornecedor} onChange={(e) => setFiltro(prev => ({ ...prev, fornecedor: e.target.value }))} />
                </div>
                <div className={styles.filtroGroup}>
                    <label>Descrição</label>
                    <input type="text" placeholder="Buscar..." value={filtro.descricao} onChange={(e) => setFiltro(prev => ({ ...prev, descricao: e.target.value }))} />
                </div>
            </div>
        </div>
    );

    if (isNCDetailOpen && idNCDetalhada) {
        return (
            <NCDetail 
                idNc={idNCDetalhada}
                onVoltar={voltarDaNCDetalhe}
                onVerDetalhesNE={abrirDetalhesNE}
            />
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.ugSelectorContainer}>
                <div className={styles.ugInfo}>
                    <span className={styles.ugLabel}>UNIDADE GESTORA:</span>
                    <div className={styles.ugToggle}>
                        <button 
                            className={`${styles.ugOption} ${fonteAlvo === '160' ? styles.active : ''}`}
                            onClick={() => handleUgChange('160')}
                        >
                            160212
                        </button>
                        <button 
                            className={`${styles.ugOption} ${fonteAlvo === '167' ? styles.active : ''}`}
                            onClick={() => handleUgChange('167')}
                        >
                            167212
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.nesSection}>
                <div className={styles.nesTabs}>
                    <button 
                        className={`${styles.nesTab} ${abaNEsAtiva === 'em_andamento' ? styles.nesTabAtivo : ''}`}
                        onClick={() => setAbaNEsAtiva('em_andamento')}
                    >
                        <span className={styles.tabIcon}>🟡</span>
                        EM ANDAMENTO
                        <span className={styles.tabBadge}>{nesEmAndamento.length + creditosRecebidos.length + creditosEnviadosPendentes.length + ncsDisponiveis.length}</span>
                    </button>
                    <button 
                        className={`${styles.nesTab} ${abaNEsAtiva === 'finalizados' ? styles.nesTabAtivo : ''}`}
                        onClick={() => setAbaNEsAtiva('finalizados')}
                    >
                        <span className={styles.tabIcon}>✅</span>
                        FINALIZADOS
                        <span className={styles.tabBadgeFinalizado}>{nesFinalizados.length}</span>
                    </button>
                </div>

                <div className={styles.nesContent}>
                    {abaNEsAtiva === 'em_andamento' ? (
                        <>
                            <div className={styles.subsectionCard}>
                                <div 
                                    className={`${styles.subsectionHeader} ${abertoRecebimento ? styles.subsectionHeaderAberto : ''}`}
                                    onClick={() => setAbertoRecebimento(!abertoRecebimento)}
                                >
                                    <span className={styles.subsectionIcon}>✅📋</span>
                                    <h4>RECEBIMENTO (CONFIRME O RECEBIMENTO DA NOTA DE CRÉDITO)</h4>
                                    <span className={styles.subsectionBadgeRecebimento}>{creditosRecebidos.length}</span>
                                    <span className={styles.subsectionArrow}>{abertoRecebimento ? '▲' : '▼'}</span>
                                </div>
                                {abertoRecebimento && (
                                    <div className={styles.subsectionContent}>
                                        <FiltrosSubdivisao filtro={filtroRecebimento} setFiltro={setFiltroRecebimento} />
                                        <div className={styles.cardGrid}>
                                            {creditosRecebidos.map((card) => (
                                                <CreditsCardNC 
                                                    key={card.id}
                                                    numeroNC={card.nc}
                                                    valor={card.saldoDisponivel || card.valorOriginal}
                                                    prazoEmpenho={card.prazoEmpenho}
                                                    finalidade={card.finalidade}
                                                    detentor={card.detentor}
                                                    linkDrive={card.linkDrive}
                                                    mostrarBotaoReceber={true}
                                                    onReceber={() => handleConfirmarRecebimento(card)}
                                                />
                                            ))}
                                            {creditosRecebidos.length === 0 && (
                                                <p className={styles.noResultsInline}>Nenhum crédito recebido aguardando confirmação.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className={styles.subsectionCard}>
                                <div 
                                    className={`${styles.subsectionHeader} ${abertoEnviado ? styles.subsectionHeaderAberto : ''}`}
                                    onClick={() => setAbertoEnviado(!abertoEnviado)}
                                >
                                    <span className={styles.subsectionIcon}>📨</span>
                                    <h4>ENVIADO (AGUARDANDO RECEBIMENTO DO DESTINATÁRIO)</h4>
                                    <span className={styles.subsectionBadge}>{creditosEnviadosPendentes.length}</span>
                                    <span className={styles.subsectionArrow}>{abertoEnviado ? '▲' : '▼'}</span>
                                </div>
                                {abertoEnviado && (
                                    <div className={styles.subsectionContent}>
                                        <FiltrosSubdivisao filtro={filtroEnviado} setFiltro={setFiltroEnviado} />
                                        <div className={styles.cardGrid}>
                                            {creditosEnviadosPendentes.map((card) => (
                                                <CreditsCardNCDisabled 
                                                    key={card.id}
                                                    numeroNC={card.nc}
                                                    valor={card.saldoDisponivel || card.valorOriginal}
                                                    prazoEmpenho={card.prazoEmpenho}
                                                    finalidade={card.finalidade}
                                                    detentor={card.detentor}
                                                    linkDrive={card.linkDrive}
                                                />
                                            ))}
                                            {creditosEnviadosPendentes.length === 0 && (
                                                <p className={styles.noResultsInline}>Nenhum crédito aguardando recebimento.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={styles.subsectionCard}>
                                <div 
                                    className={`${styles.subsectionHeader} ${abertoNCDisponivel ? styles.subsectionHeaderAberto : ''}`}
                                    onClick={() => setAbertoNCDisponivel(!abertoNCDisponivel)}
                                >
                                    <span className={styles.subsectionIcon}>💰</span>
                                    <h4>NOTAS DE CRÉDITO (SALDO DISPONÍVEL)</h4>
                                    <span className={styles.subsectionBadge}>{ncsDisponiveis.length}</span>
                                    <span className={styles.subsectionArrow}>{abertoNCDisponivel ? '▲' : '▼'}</span>
                                </div>
                                {abertoNCDisponivel && (
                                    <div className={styles.subsectionContent}>
                                        <FiltrosSubdivisao filtro={filtroNCDisponivel} setFiltro={setFiltroNCDisponivel} />
                                        <div className={styles.cardGrid}>
                                            {ncsDisponiveis.map((card) => (
                                                <CreditsCardNC 
                                                    key={card.id}
                                                    numeroNC={card.nc}
                                                    valor={card.saldoDisponivel}
                                                    prazoEmpenho={card.prazoEmpenho}
                                                    finalidade={card.finalidade}
                                                    detentor={card.detentor}
                                                    linkDrive={card.linkDrive}
                                                    podeExcluir={podeExcluirNC(card)}
                                                    onEdit={() => handleEditarNC(card)}
                                                    onDetail={() => abrirDetalhesNC(card.id)}
                                                    onDelete={() => handleExcluirItem(card.id, 'NC', card.nc, card)}
                                                    onTransferir={() => handleAbrirTransferencia(card)}
                                                    onEmpenhar={() => handleAbrirEmpenho(card)}
                                                    onDevolver={card.documentoAnterior ? () => handleAbrirDevolucao(card) : null}
                                                />
                                            ))}
                                            {ncsDisponiveis.length === 0 && (
                                                <p className={styles.noResultsInline}>Nenhuma NC disponível.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={styles.subsectionCard}>
                                <div 
                                    className={`${styles.subsectionHeader} ${abertoNEAndamento ? styles.subsectionHeaderAberto : ''}`}
                                    onClick={() => setAbertoNEAndamento(!abertoNEAndamento)}
                                >
                                    <span className={styles.subsectionIcon}>📝</span>
                                    <h4>NOTAS DE EMPENHO (CRÉDITO EMPENHADO)</h4>
                                    <span className={styles.subsectionBadge}>{nesEmAndamento.length}</span>
                                    <span className={styles.subsectionArrow}>{abertoNEAndamento ? '▲' : '▼'}</span>
                                </div>
                                {abertoNEAndamento && (
                                    <div className={styles.subsectionContent}>
                                        <FiltrosSubdivisao filtro={filtroNEAndamento} setFiltro={setFiltroNEAndamento} />
                                        <div className={styles.cardGrid}>
                                            {nesEmAndamento.map((ne) => (
                                                <CreditsCard 
                                                    key={ne.id}
                                                    neId={ne.id}
                                                    numeroNE={ne.numeroNE} 
                                                    finalidade={ne.finalidade}
                                                    omAplicacao={ne.omAplicacao}
                                                    processo={ne.processo}
                                                    material={ne.materialNE} 
                                                    fornecedor={ne.nomeFornecedor} 
                                                    valorAtual={ne.valorAtual}
                                                    linkDrive={ne.linkDriveNE}
                                                    tempoCronologico={ne.dataGeracaoNE}
                                                    numeroNC={`NC Origem: ${ne.ncOrigem?.nc || 'N/D'}`}
                                                    onEdit={() => handleEditarNE(ne)}
                                                    onDetail={() => handleAbrirDetalhar(ne, 'NE')}
                                                    onCancelar={() => handleCancelarNE(ne)}
                                                />
                                            ))}
                                            {nesEmAndamento.length === 0 && (
                                                <p className={styles.noResultsInline}>Nenhum empenho em andamento.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className={styles.subsectionCard}>
                            <div className={styles.subsectionHeaderFinalizado}>
                                <span className={styles.subsectionIcon}>✅</span>
                                <h4>EMPENHOS FINALIZADOS</h4>
                                <span className={styles.subsectionBadgeFinalizado}>{nesFinalizados.length}</span>
                            </div>
                            <div className={styles.subsectionContent}>
                                <div className={styles.cardGrid}>
                                    {nesFinalizados.map((ne) => (
                                        <CreditsCard 
                                            key={ne.id}
                                            neId={ne.id}
                                            numeroNE={ne.numeroNE} 
                                            finalidade={ne.finalidade}
                                            omAplicacao={ne.omAplicacao}
                                            processo={ne.processo}
                                            material={ne.materialNE} 
                                            fornecedor={ne.nomeFornecedor} 
                                            valorAtual={ne.valorAtual}
                                            linkDrive={ne.linkDriveNE}
                                            tempoCronologico={ne.dataGeracaoNE}
                                            numeroNC={`NC Origem: ${ne.ncOrigem?.nc || 'N/D'}`}
                                            onEdit={() => handleEditarNE(ne)}
                                            onDetail={() => handleAbrirDetalhar(ne, 'NE')}
                                            onCancelar={() => handleCancelarNE(ne)}
                                        />
                                    ))}
                                    {nesFinalizados.length === 0 && (
                                        <p className={styles.noResultsInline}>Nenhum empenho finalizado.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isTransferModalOpen && creditoParaTransferir && (
                <TransferModal
                    creditoOriginal={creditoParaTransferir}
                    modo={modoTransferencia}
                    onClose={() => {
                        setIsTransferModalOpen(false);
                        setCreditoParaTransferir(null);
                        setModoTransferencia('transferir');
                    }}
                    onSuccess={() => {
                        carregarDados();
                    }}
                />
            )}

            {isNeModalOpen && (
                <NewNE 
                    onClose={handleFecharNeModal}
                    onSuccess={handleFecharNeModal}
                    creditoParaEmpenhar={creditoParaEmpenhar}
                />
            )}

            {isCancelarModalOpen && neParaCancelar && (
                <CancelarNEModal
                    ne={neParaCancelar}
                    onClose={() => {
                        setIsCancelarModalOpen(false);
                        setNeParaCancelar(null);
                    }}
                    onSuccess={() => {
                        carregarDados();
                    }}
                />
            )}

            {isEditarNEModalOpen && neParaEditar && (
                <EditarNEModal
                    ne={neParaEditar}
                    ncOrigem={ncOrigemParaEdicao}
                    onClose={() => {
                        setIsEditarNEModalOpen(false);
                        setNeParaEditar(null);
                        setNcOrigemParaEdicao(null);
                    }}
                    onSuccess={() => {
                        carregarDados();
                    }}
                />
            )}

            {isEditarNCModalOpen && ncParaEditar && (
                <EditarNCModal
                    nc={ncParaEditar}
                    onClose={() => {
                        setIsEditarNCModalOpen(false);
                        setNcParaEditar(null);
                    }}
                    onSuccess={() => {
                        carregarDados();
                    }}
                />
            )}
        </div>
    );
}

export default CreditsPanel;