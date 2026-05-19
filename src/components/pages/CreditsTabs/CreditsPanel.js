import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useMemo, useCallback } from 'react';
import styles from '../../styles/styles_pages/styles_creditsTabs/CreditsPanel.module.css';
import CreditsCard from './CreditsCard'; 
import CreditsCardNC from './CreditsCardNC';
import CreditsCardNCDisabled from './CreditsCardNCDisabled';
import TransferModal from './modais/TransferModal'

// O componente agora recebe a fonte (160 ou 167) e a UG dinamicamente
function CreditsPanel({ fonteAlvo, ugAlvo, onVerDetalhes }) {
    const { usuarioAtual } = useAuth();
    const [listaNCs, setListaNCs] = useState([]);
    const [listaNEs, setListaNEs] = useState([]);
    const [listaNFs, setListaNFs] = useState([]); 
    const [listaItensPregao, setListaItensPregao] = useState([]);
    
    // Aba ativa dentro do componente
    const [abaNEsAtiva, setAbaNEsAtiva] = useState('em_andamento'); // 'em_andamento' ou 'finalizados'
    
    // Estados para os filtros centralizados
    const [filtroNC, setFiltroNC] = useState('');
    const [filtroProcesso, setFiltroProcesso] = useState('');
    const [filtroOM, setFiltroOM] = useState('');
    const [filtroFornecedor, setFiltroFornecedor] = useState('');

    // Estados para o Modal de Edição
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [tipoEdicao, setTipoEdicao] = useState(''); 
    const [idEmEdicao, setIdEmEdicao] = useState('');
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [creditoParaTransferir, setCreditoParaTransferir] = useState(null);

    // Campos controlados do formulário de edição
    const [campoNumero, setCampoNumero] = useState('');
    const [campoProcesso, setCampoProcesso] = useState('');
    const [campoFinalidade, setCampoFinalidade] = useState('');
    const [campoOM, setCampoOM] = useState('');
    const [campoValor, setCampoValor] = useState('');
    const [campoLink, setCampoLink] = useState('');
    
    const [campoPrazo, setCampoPrazo] = useState('');
    const [campoIsImediato, setCampoIsImediato] = useState(false);

    // Campos de NE controlados por regras dinâmicas
    const [idMaterialSelecionado, setIdMaterialSelecionado] = useState('');
    const [descricaoItemManual, setDescricaoItemManual] = useState('');
    const [campoFornecedor, setCampoFornecedor] = useState('');
    const [campoCnpj, setCampoCnpj] = useState('');
    const [isModoManual, setIsModoManual] = useState(false);
    const [idNcVinculadaANe, setIdNcVinculadaANe] = useState('');

    useEffect(() => {
        if (campoIsImediato) {
            setCampoPrazo('EMPENHO IMEDIATO');
        } else {
            setCampoPrazo(anterior => anterior === 'EMPENHO IMEDIATO' ? '' : anterior);
        }
    }, [campoIsImediato]);

    const handleConfirmarRecebimento = (credito) => {
        // Atualiza o crédito recebido: statusRecebimento = 'RECEBIDO'
        const creditoAtualizado = {
            ...credito,
            statusRecebimento: 'RECEBIDO'
        };

        // Busca o crédito original (remetente) para remover da visualização
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
                        
                        // Atualiza o crédito original (remove da visualização do remetente)
                        fetch(`http://localhost:5000/credits_nc/${creditoOriginal.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(creditoOriginalAtualizado)
                        });
                    }
                });
        }

        // Atualiza o crédito recebido
        fetch(`http://localhost:5000/credits_nc/${credito.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(creditoAtualizado)
        })
        .then(() => {
            alert(`Crédito ${credito.codigoUnico} recebido com sucesso!`);
            carregarDados(); // Recarrega os dados
        })
        .catch(err => {
            console.error('Erro ao confirmar recebimento:', err);
            alert('Erro ao confirmar recebimento. Tente novamente.');
        });
    };

    // Otimização: useCallback evita recriação da função e renderizações extras
    const carregarDados = useCallback(() => {
        fetch('http://localhost:5000/credits_nc')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // FILTRAGEM DINÂMICA: Baseada na propriedade 'fonteAlvo' recebida
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

    // Otimização O(1): Criação de índices mapeados para evitar múltiplos laços .find() lentos
    const ncMap = useMemo(() => new Map(listaNCs.map(nc => [nc.id, nc])), [listaNCs]);

    // Otimização: Pré-calcula o fluxo financeiro de todas as NEs de uma vez só por renderização
    const fluxoFinNeMap = useMemo(() => {
        const mapa = new Map();
        listaNEs.forEach(ne => {
            const nfsDaNe = listaNFs.filter(nf => nf.idNeVinculada === ne.id);
            const emLiquidacao = nfsDaNe.filter(nf => nf.status === 'ENVIADA_LIQUIDACAO').reduce((s, nf) => s + (parseFloat(nf.valor) || 0), 0);
            const liquidado = nfsDaNe.filter(nf => nf.status === 'LIQUIDADA').reduce((s, nf) => s + (parseFloat(nf.valor) || 0), 0);
            mapa.set(ne.id, { emLiquidacao, liquidado });
        });
        return mapa;
    }, [listaNEs, listaNFs]);

    const handleMudarMaterialEdicao = (valorSelect) => {
        setIdMaterialSelecionado(valorSelect);
        if (valorSelect === 'OUTRO') {
            setIsModoManual(true); 
            setDescricaoItemManual(''); 
            setCampoFornecedor(''); 
            setCampoCnpj('');
        } else if (valorSelect !== '') {
            setIsModoManual(false); 
            setDescricaoItemManual('');
            const itemPregao = listaItensPregao.find(item => item.id === valorSelect);
            if (itemPregao) { 
                setCampoFornecedor(itemPregao.fornecedor || ''); 
                setCampoCnpj(itemPregao.cnpj || ''); 
            }
        } else {
            setIsModoManual(false); 
            setDescricaoItemManual(''); 
            setCampoFornecedor(''); 
            setCampoCnpj('');
        }
    };

    const handleAbrirTransferencia = (credito) => {
        
        
        // REQUISITANTE não pode transferir
        if (usuarioAtual.nivel === 'REQUISITANTE') {
            alert('Seu perfil não tem permissão para transferir créditos');
            return;
        }
        
        setCreditoParaTransferir(credito);
        setIsTransferModalOpen(true);
    };

    const handleExcluirItem = (id, tipo, numeroIdentificador, item) => {
        // REGRA DE EXCLUSÃO:
        // Apenas a seção que CRIOU o crédito original pode excluir
        // Para identificar o criador, comparamos se o codigoUnico é igual ao codigoOrigemPermanente
        // Isso significa que é o registro original (não um transferido)
        
        const isCriadorOriginal = item.codigoUnico === item.codigoOrigemPermanente;
        
        if (!isCriadorOriginal) {
            alert('❌ Apenas a seção que criou o crédito original pode excluí-lo!');
            return;
        }
        
        // Verificação adicional: o detentor atual deve ser o mesmo que o criador
        if (item.detentor !== usuarioAtual.secao) {
            alert('❌ Você não tem permissão para excluir este crédito!');
            return;
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

    const handleAbrirEdicao = (item, tipo) => {
        setTipoEdicao(tipo);
        setIdEmEdicao(item.id);
        setIsEditModalOpen(true);

        if (tipo === 'NC') {
            setCampoNumero(item.nc || '');
            setCampoProcesso(item.processo || '');
            setCampoFinalidade(item.finalidade || '');
            setCampoOM(item.omAplicacao || '');
            setCampoValor(item.valor ? item.valor.toString() : '');
            setCampoLink(item.linkDrive || '');
            
            const prazoSalvo = item.prazoEmpenho || '';
            setCampoPrazo(prazoSalvo);
            setCampoIsImediato(prazoSalvo.toUpperCase() === 'EMPENHO IMEDIATO');
        } else {
            setCampoNumero(item.numeroNE || '');
            setCampoLink(item.linkDriveNE || '');
            setIdNcVinculadaANe(item.idNcVinculada || '');

            const ncOrigem = ncMap.get(item.idNcVinculada);
            if (ncOrigem) {
                setCampoProcesso(ncOrigem.processo || '');
                setCampoFinalidade(ncOrigem.finalidade || '');
                setCampoOM(ncOrigem.omAplicacao || '');
                setCampoValor(ncOrigem.valor ? ncOrigem.valor.toString() : '');
            }

            const itemCorrespondente = listaItensPregao.find(i => `Item ${i.item} - ${i.descricao}` === item.materialNE);
            if (itemCorrespondente) {
                setIsModoManual(false); 
                setIdMaterialSelecionado(itemCorrespondente.id); 
                setDescricaoItemManual('');
                setCampoFornecedor(itemCorrespondente.fornecedor || ''); 
                setCampoCnpj(itemCorrespondente.cnpj || '');
            } else {
                setIsModoManual(true); 
                setIdMaterialSelecionado('OUTRO'); 
                setDescricaoItemManual(item.materialNE || '');
                setCampoFornecedor(item.nomeFornecedor || ''); 
                setCampoCnpj(item.cnpjFornecedor || '');
            }
        }
    };

    const handleAbrirDetalhar = (item, tipo) => {
        if (tipo === 'NC') {
            if (item.linkDrive) window.open(item.linkDrive, '_blank', 'noopener,noreferrer');
            else alert('Link do Google Drive não localizado.');
        } else {
            // Chama a função do pai para mudar a aba ativa na mesma janela
            if (onVerDetalhes) {
                onVerDetalhes(item.id);
            }
        }
    };

    const handleSalvarEdicao = (e) => {
        e.preventDefault();

        if (tipoEdicao === 'NC') {
            const ncEncontrada = listaNCs.find(n => n.id === idEmEdicao) || {};
            const dadosAltualizadosNC = {
                ...ncEncontrada,
                nc: campoNumero,
                processo: campoProcesso,
                finalidade: campoFinalidade,
                omAplicacao: campoOM,
                linkDrive: campoLink,
                prazoEmpenho: campoPrazo, 
                valor: parseFloat(campoValor) || 0
            };

            fetch(`http://localhost:5000/credits_nc/${idEmEdicao}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosAltualizadosNC)
            }).then(() => { alert('Nota de Crédito atualizada!'); fecharModalEdicao(); });

        } else {
            const confirmacaoNC = window.confirm("Atenção: Você realizou alterações nos dados de origem da Nota de Crédito (NC) vinculada. Deseja confirmar essas mudanças na NC base?");
            if (!confirmacaoNC) return;

            const ncOriginal = ncMap.get(idNcVinculadaANe) || {};
            const dadosAltualizadosNC = {
                ...ncOriginal,
                processo: campoProcesso,
                finalidade: campoFinalidade,
                omAplicacao: campoOM,
                valor: parseFloat(campoValor) || 0
            };

            fetch(`http://localhost:5000/credits_nc/${idNcVinculadaANe}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosAltualizadosNC)
            });

            const neEncontrada = listaNEs.find(n => n.id === idEmEdicao) || {};
            let textoMaterialFinal = isModoManual ? descricaoItemManual : (`Item ${(listaItensPregao.find(i => i.id === idMaterialSelecionado) || {}).item} - ${(listaItensPregao.find(i => i.id === idMaterialSelecionado) || {}).descricao}`);
            
            const dadosAltualizadosNE = {
                ...neEncontrada,
                numeroNE: campoNumero,
                materialNE: textoMaterialFinal,
                nomeFornecedor: campoFornecedor,
                cnpjFornecedor: campoCnpj,
                linkDriveNE: campoLink
            };

            fetch(`http://localhost:5000/credits_ne/${idEmEdicao}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosAltualizadosNE)
            }).then(() => { alert('Nota de Empenho atualizada com sucesso!'); fecharModalEdicao(); });
        }
    };

    const fecharModalEdicao = () => { setIsEditModalOpen(false); carregarDados(); };

    // Filtros para NCs
    const ncsDisponiveis = useMemo(() => {
        const ncsDaSecao = listaNCs.filter(card => 
            card.detentor === usuarioAtual.secao &&
            (card.statusRecebimento === 'RECEBIDO' || card.statusRecebimento === undefined) && // ← RECEBIDOS ou sem status (criados diretamente)
            (card.nc || '').toLowerCase().includes(filtroNC.toLowerCase()) && 
            (card.processo || '').toLowerCase().includes(filtroProcesso.toLowerCase()) && 
            (card.omAplicacao || '').toLowerCase().includes(filtroOM.toLowerCase()) && 
            (card.fornecedor || '').toLowerCase().includes(filtroFornecedor.toLowerCase())
        );
        const idsNcEmpenhadas = new Set(listaNEs.map(ne => ne.idNcVinculada));
        return ncsDaSecao.filter(nc => !idsNcEmpenhadas.has(nc.id));
    }, [listaNCs, listaNEs, filtroNC, filtroProcesso, filtroOM, filtroFornecedor, usuarioAtual.secao]);

    const creditosEnviadosPendentes = useMemo(() => {
        // Primeiro, pega todos os créditos que o remetente tem
        const creditosDoRemetente = listaNCs.filter(card => 
            card.detentor === usuarioAtual.secao &&
            card.transferenciaPendente === true
        );
        
        // Para cada crédito do remetente com transferência pendente, busca o crédito destino
        const codigosTransferidos = creditosDoRemetente.map(card => card.codigoTransferido).filter(Boolean);
        
        // Retorna os créditos destino (que estão com status PENDENTE e detentor diferente)
        return listaNCs.filter(card => 
            codigosTransferidos.includes(card.codigoUnico) &&
            card.statusRecebimento === 'PENDENTE'
        );
    }, [listaNCs, usuarioAtual.secao]);

    const creditosRecebidos = useMemo(() => {
        return listaNCs.filter(card => 
            card.documentoAnterior !== null && 
            card.documentoAnterior !== undefined &&
            card.detentor === usuarioAtual.secao &&
            card.statusRecebimento === 'PENDENTE' &&  // ← APENAS PENDENTES
            (card.nc || '').toLowerCase().includes(filtroNC.toLowerCase()) && 
            (card.processo || '').toLowerCase().includes(filtroProcesso.toLowerCase()) && 
            (card.omAplicacao || '').toLowerCase().includes(filtroOM.toLowerCase()) && 
            (card.fornecedor || '').toLowerCase().includes(filtroFornecedor.toLowerCase())
        );
    }, [listaNCs, filtroNC, filtroProcesso, filtroOM, filtroFornecedor, usuarioAtual.secao]);


    // Prepara os dados das NEs com todas as informações necessárias
    const nesCompletas = useMemo(() => {
        return listaNEs
            .filter(ne => ncMap.has(ne.idNcVinculada))
            .map(ne => {
                const ncOrigem = ncMap.get(ne.idNcVinculada) || {};
                const { emLiquidacao, liquidado } = fluxoFinNeMap.get(ne.id) || { emLiquidacao: 0, liquidado: 0 };
                const saldoAtual = (ncOrigem.valor || 0) - emLiquidacao - liquidado;
                
                return {
                    ...ne,
                    ncOrigem,
                    emLiquidacao,
                    liquidado,
                    saldoAtual
                };
            });
    }, [listaNEs, ncMap, fluxoFinNeMap]);

    // Aplica os filtros nas NEs
    const nesFiltradas = useMemo(() => {
        return nesCompletas.filter(ne => {
            const ncOrigem = ne.ncOrigem;
            return (
                ((ne.numeroNE || '').toLowerCase().includes(filtroNC.toLowerCase()) || (ncOrigem.nc || '').toLowerCase().includes(filtroNC.toLowerCase())) && 
                (ncOrigem.processo || '').toLowerCase().includes(filtroProcesso.toLowerCase()) && 
                (ncOrigem.omAplicacao || '').toLowerCase().includes(filtroOM.toLowerCase()) && 
                (ne.nomeFornecedor || '').toLowerCase().includes(filtroFornecedor.toLowerCase())
            );
        });
    }, [nesCompletas, filtroNC, filtroProcesso, filtroOM, filtroFornecedor]);

    // Subdivisões dentro de EM ANDAMENTO (agora com 4 subdivisões):
    // 1. RECEBIMENTO (CONFIRME O RECEBIMENTO DA NOTA DE CRÉDITO) - NEs com NF status ENVIADA_LIQUIDACAO
    // 2. ENVIADO (AGUARDANDO RECEBIMENTO DO DESTINATÁRIO) - NEs que não tem NFs vinculadas
    // 3. NOTAS DE CRÉDITO (SALDO DISPONÍVEL) - NCs disponíveis
    // 4. NOTAS DE EMPENHO (CRÉDITO EMPENHADO) - NEs com NFs em andamento mas sem liquidação concluída

    const enviadoAguardando = useMemo(() => {
        return nesFiltradas.filter(ne => {
            // NEs sem NFs vinculadas
            return ne.emLiquidacao === 0 && ne.liquidado === 0;
        });
    }, [nesFiltradas]);

    const recebimentoConfirmacao = useMemo(() => {
        return nesFiltradas.filter(ne => {
            // NEs com NF em status ENVIADA_LIQUIDACAO (aguardando confirmação de recebimento)
            return ne.emLiquidacao > 0 && ne.liquidado === 0;
        });
    }, [nesFiltradas]);

    const notasEmpenhoEmAndamento = useMemo(() => {
        return nesFiltradas.filter(ne => {
            // NEs que tem liquidação parcial (já tem NFs liquidadas) E saldo > 0
            return ne.liquidado > 0 && ne.saldoAtual > 0;
        });
    }, [nesFiltradas]);

    // Para FINALIZADOS: NEs com saldo = 0
    const nesFinalizados = useMemo(() => {
        return nesFiltradas.filter(ne => ne.saldoAtual === 0);
    }, [nesFiltradas]);

    return (
        <div className={styles.container}>
            {/* O cabeçalho agora consome a propriedade 'ugAlvo' dinâmica */}
            <h2>Painel de Gestão Orçamentária - UG {ugAlvo}</h2>
            
            <div className={styles.filterBar}>
                <div className={styles.filterGroup}>
                    <label>Nº do Documento (NC ou NE)</label>
                    <input type="text" placeholder="Buscar..." value={filtroNC} onChange={(e) => setFiltroNC(e.target.value)} />
                </div>
                <div className={styles.filterGroup}>
                    <label>Número do Processo</label>
                    <input type="text" placeholder="Buscar..." value={filtroProcesso} onChange={(e) => setFiltroProcesso(e.target.value)} />
                </div>
                <div className={styles.filterGroup}>
                    <label>OM de Aplicação</label>
                    <input type="text" placeholder="Buscar..." value={filtroOM} onChange={(e) => setFiltroOM(e.target.value)} />
                </div>
                <div className={styles.filterGroup}>
                    <label>Fornecedor</label>
                    <input type="text" placeholder="Buscar..." value={filtroFornecedor} onChange={(e) => setFiltroFornecedor(e.target.value)} />
                </div>
            </div>

            {/* ABAS PRINCIPAIS */}
            <div className={styles.nesSection}>
                <div className={styles.nesTabs}>
                    <button 
                        className={`${styles.nesTab} ${abaNEsAtiva === 'em_andamento' ? styles.nesTabAtivo : ''}`}
                        onClick={() => setAbaNEsAtiva('em_andamento')}
                    >
                        <span className={styles.tabIcon}>🟡</span>
                        EM ANDAMENTO
                        <span className={styles.tabBadge}>{enviadoAguardando.length + recebimentoConfirmacao.length + notasEmpenhoEmAndamento.length}</span>
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

                            {/* SUBDIVISÃO 2: RECEBIMENTO (CONFIRME O RECEBIMENTO DA NOTA DE CRÉDITO) */}
                            <div className={styles.subsectionDivider} style={{ marginTop: '40px' }}>
                                <div className={styles.subsectionHeader}>
                                    <span className={styles.subsectionIcon}>✅📋</span>
                                    <h4>RECEBIMENTO (CONFIRME O RECEBIMENTO DA NOTA DE CRÉDITO)</h4>
                                    <span className={styles.subsectionBadgeRecebimento}>{creditosRecebidos.length}</span>
                                </div>
                                <p className={styles.subsectionDescription}>
                                    Créditos recebidos de outras seções, aguardando confirmação de recebimento
                                </p>
                            </div>
                            <div className={styles.cardGrid}>
                                {creditosRecebidos.map((card) => (
                                    <CreditsCardNC 
                                        key={card.id}
                                        numeroNC={card.nc} 
                                        valor={card.valor}
                                        prazoEmpenho={card.prazoEmpenho}
                                        finalidade={card.finalidade}
                                        detentor={card.detentor}
                                        linkDrive={card.linkDrive}
                                        mostrarBotaoReceber={true}  // ← Mostra apenas botão RECEBER
                                        onReceber={() => handleConfirmarRecebimento(card)}
                                        onDelete={() => handleExcluirItem(card.id, 'NC', card.nc, card)}
                                        // Os outros botões não são passados
                                    />
                                ))}
                                {creditosRecebidos.length === 0 && (
                                    <p className={styles.noResultsInline}>Nenhum crédito recebido aguardando confirmação.</p>
                                )}
                            </div>
                            
                            {/* SUBDIVISÃO 1: ENVIADO (AGUARDANDO RECEBIMENTO DO DESTINATÁRIO) */}
                            <div className={styles.subsectionDivider}>
                                <div className={styles.subsectionHeader}>
                                    <span className={styles.subsectionIcon}>📨</span>
                                    <h4>ENVIADO (AGUARDANDO RECEBIMENTO DO DESTINATÁRIO)</h4>
                                    <span className={styles.subsectionBadge}>{creditosEnviadosPendentes.length}</span>
                                </div>
                                <p className={styles.subsectionDescription}>
                                    Créditos transferidos para outras seções, aguardando confirmação de recebimento
                                </p>
                            </div>
                            <div className={styles.cardGrid}>
                                {creditosEnviadosPendentes.map((card) => (
                                    <CreditsCardNCDisabled 
                                        key={card.id}
                                        numeroNC={card.nc}  // ← PASSA O NÚMERO DA NC (ex: 2026NC000009)
                                        valor={card.valor}
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

                            

                            {/* SUBDIVISÃO 3: NOTAS DE CRÉDITO (SALDO DISPONÍVEL) */}
                            <div className={styles.subsectionDivider} style={{ marginTop: '40px' }}>
                                <div className={styles.subsectionHeader}>
                                    <span className={styles.subsectionIcon}>💰</span>
                                    <h4>NOTAS DE CRÉDITO (SALDO DISPONÍVEL)</h4>
                                    <span className={styles.subsectionBadge}>{ncsDisponiveis.length}</span>
                                </div>
                                <p className={styles.subsectionDescription}>
                                    Créditos disponíveis para novos empenhos
                                </p>
                            </div>
                            <div className={styles.cardGrid}>
                                {ncsDisponiveis.map((card) => (
                                     <CreditsCardNC 
                                        key={card.id}
                                        numeroNC={card.nc} 
                                        valor={card.valor}
                                        prazoEmpenho={card.prazoEmpenho}
                                        finalidade={card.finalidade}
                                        detentor={card.detentor || "detentor"}  // ← será usado posteriormente
                                        linkDrive={card.linkDrive}
                                        onEdit={() => handleAbrirEdicao(card, 'NC')}
                                        onDetail={() => handleAbrirDetalhar(card, 'NC')}
                                        onDelete={() => handleExcluirItem(card.id, 'NC', card.nc, card)}
                                        onTransferir={() => handleAbrirTransferencia(card)}
                                        onEmpenhar={() => alert(`Empenhar NC ${card.nc} - Abrir modal de NE`)}
                                    />
                                ))}
                                {ncsDisponiveis.length === 0 && (
                                    <p className={styles.noResultsInline}>Nenhuma NC disponível.</p>
                                )}
                            </div>

                            {/* SUBDIVISÃO 4: NOTAS DE EMPENHO (CRÉDITO EMPENHADO) */}
                            <div className={styles.subsectionDivider} style={{ marginTop: '40px' }}>
                                <div className={styles.subsectionHeader}>
                                    <span className={styles.subsectionIcon}>📝</span>
                                    <h4>NOTAS DE EMPENHO (CRÉDITO EMPENHADO)</h4>
                                    <span className={styles.subsectionBadge}>{notasEmpenhoEmAndamento.length}</span>
                                </div>
                                <p className={styles.subsectionDescription}>
                                    Empenhos já emitidos e com liquidações parciais em andamento
                                </p>
                            </div>
                            <div className={styles.cardGrid}>
                                {notasEmpenhoEmAndamento.map((ne) => (
                                    <CreditsCard 
                                        key={ne.id}
                                        numeroNE={ne.numeroNE} 
                                        finalidade={ne.ncOrigem.finalidade}
                                        processo={ne.ncOrigem.processo}
                                        material={ne.materialNE} 
                                        om={ne.ncOrigem.omAplicacao}
                                        fornecedor={ne.nomeFornecedor} 
                                        valorAtual={ne.saldoAtual} 
                                        linkDrive={ne.linkDriveNE}
                                        tempoCronologico={ne.dataGeracaoNE}
                                        numeroNC={`NC Origem: ${ne.ncOrigem.nc || 'N/D'}`}
                                        onEdit={() => handleAbrirEdicao(ne, 'NE')}
                                        onDetail={() => handleAbrirDetalhar(ne, 'NE')}
                                        onDelete={() => handleExcluirItem(ne.id, 'NE', ne.numeroNE)}
                                    />
                                ))}
                                {notasEmpenhoEmAndamento.length === 0 && (
                                    <p className={styles.noResultsInline}>Nenhum empenho em andamento.</p>
                                )}
                            </div>
                        </>
                    ) : (
                        /* ABA FINALIZADOS - SEM SUBDIVISÕES */
                        <>
                            <div className={styles.subsectionDivider}>
                                <div className={styles.subsectionHeader}>
                                    <span className={styles.subsectionIcon}>✅</span>
                                    <h4>EMPENHOS FINALIZADOS</h4>
                                    <span className={styles.subsectionBadgeFinalizado}>{nesFinalizados.length}</span>
                                </div>
                                <p className={styles.subsectionDescription}>
                                    Notas de Empenho com saldo totalmente utilizado
                                </p>
                            </div>
                            <div className={styles.cardGrid}>
                                {nesFinalizados.map((ne) => (
                                    <CreditsCard 
                                        key={ne.id}
                                        numeroNE={ne.numeroNE} 
                                        finalidade={ne.ncOrigem.finalidade}
                                        processo={ne.ncOrigem.processo}
                                        material={ne.materialNE} 
                                        om={ne.ncOrigem.omAplicacao}
                                        fornecedor={ne.nomeFornecedor} 
                                        valorAtual={ne.saldoAtual} 
                                        linkDrive={ne.linkDriveNE}
                                        tempoCronologico={ne.dataGeracaoNE}
                                        numeroNC={`NC Origem: ${ne.ncOrigem.nc || 'N/D'}`}
                                        onEdit={() => handleAbrirEdicao(ne, 'NE')}
                                        onDetail={() => handleAbrirDetalhar(ne, 'NE')}
                                        onDelete={() => handleExcluirItem(ne.id, 'NE', ne.numeroNE)}
                                    />
                                ))}
                                {nesFinalizados.length === 0 && (
                                    <p className={styles.noResultsInline}>Nenhum empenho finalizado.</p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            
            {/* MODAL DE TRANSFERIR */}
            {isTransferModalOpen && creditoParaTransferir && (
                <TransferModal
                    creditoOriginal={creditoParaTransferir}
                    onClose={() => {
                        setIsTransferModalOpen(false);
                        setCreditoParaTransferir(null);
                    }}
                    onSuccess={() => {
                        carregarDados();
                    }}
                />
            )}

            {/* MODAL DE EDIÇÃO */}
            {isEditModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>Editar {tipoEdicao === 'NC' ? 'Nota de Crédito' : 'Nota de Empenho'}</h2>
                        <form className={styles.modalForm} onSubmit={handleSalvarEdicao}>
                            <div className={styles.formGroup}>
                                <label>Número da {tipoEdicao}</label>
                                <input type="text" value={campoNumero} onChange={(e) => setCampoNumero(e.target.value)} required />
                            </div>
                            {tipoEdicao === 'NC' ? (
                                <>
                                    <div className={styles.formGroup}>
                                        <label>Valor Monetário (R$)</label>
                                        <input type="number" value={campoValor} onChange={(e) => setCampoValor(e.target.value)} required />
                                    </div>
                                    <div className={styles.formGroupFull}>
                                        <label>OM de Aplicação</label>
                                        <input type="text" value={campoOM} onChange={(e) => setCampoOM(e.target.value)} required />
                                    </div>
                                    <div className={styles.formGroupFull}>
                                        <label>Número do Processo</label>
                                        <input type="text" value={campoProcesso} onChange={(e) => setCampoProcesso(e.target.value)} required />
                                    </div>
                                    <div className={styles.formGroupFull}>
                                        <label>Prazo para Empenho</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '100%' }}>
                                            <input type={campoIsImediato ? "text" : "date"} value={campoPrazo} onChange={(e) => setCampoPrazo(e.target.value)} disabled={campoIsImediato} required style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e0', borderRadius: '4px' }} />
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={campoIsImediato} onChange={(e) => setCampoIsImediato(e.target.checked)} /> Empenho Imediato
                                            </label>
                                        </div>
                                    </div>
                                    <div className={styles.formGroupFull}>
                                        <label>Finalidade do Crédito</label>
                                        <textarea value={campoFinalidade} onChange={(e) => setCampoFinalidade(e.target.value)} required style={{height: '55px'}} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ gridColumn: 'span 2', backgroundColor: '#fffaf0', padding: '10px', border: '1px solid #feebc8', borderRadius: '4px', margin: '5px 0' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#dd6b20', display: 'block', marginBottom: '8px', textAlign: 'center' }}>DADOS DA NOTA DE CRÉDITO (NC ORIGEM)</span>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            <div className={styles.formGroup}>
                                                <label>OM Aplicação NC</label>
                                                <input type="text" value={campoOM} onChange={(e) => setCampoOM(e.target.value)} required />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Valor da NC (R$)</label>
                                                <input type="number" value={campoValor} onChange={(e) => setCampoValor(e.target.value)} required />
                                            </div>
                                            <div className={styles.formGroupFull}>
                                                <label>Nº Processo NC</label>
                                                <input type="text" value={campoProcesso} onChange={(e) => setCampoProcesso(e.target.value)} required />
                                            </div>
                                            <div className={styles.formGroupFull}>
                                                <label>Finalidade da NC</label>
                                                <textarea value={campoFinalidade} onChange={(e) => setCampoFinalidade(e.target.value)} required style={{height: '40px', resize: 'none'}} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.formGroupFull} style={{ marginTop: '5px' }}>
                                        <label>Descrição do Material Empenhado</label>
                                        <select value={idMaterialSelecionado} onChange={(e) => handleMudarMaterialEdicao(e.target.value)} required style={{padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', width: '100%'}}>
                                            <option value="">-- Selecione o item homologado no Pregão --</option>
                                            {listaItensPregao.map(item => <option key={item.id} value={item.id}>Item {item.item} - {item.descricao.substring(0, 55)}...</option>)}
                                            <option value="OUTRO" style={{color: '#dc3545', fontWeight: 'bold'}}>+ OUTRA MODALIDADE (CARONA, DISPENSA ELETRÔNICA, ETC.)</option>
                                        </select>
                                    </div>
                                    {isModoManual && (
                                        <div className={styles.formGroupFull}>
                                            <label style={{color: '#dc3545'}}>Descrição do Material Manual</label>
                                            <input type="text" value={descricaoItemManual} onChange={(e) => setDescricaoItemManual(e.target.value)} required />
                                        </div>
                                    )}
                                    <div className={styles.formGroup}>
                                        <label>Nome do Fornecedor</label>
                                        <input type="text" value={campoFornecedor} onChange={(e) => setCampoFornecedor(e.target.value)} disabled={!isModoManual} required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>CNPJ da Empresa</label>
                                        <input type="text" value={campoCnpj} onChange={(e) => setCampoCnpj(e.target.value)} disabled={!isModoManual} required />
                                    </div>
                                </>
                            )}
                            <div className={styles.formGroupFull}>
                                <label>Link de Compartilhamento Google Drive</label>
                                <input type="url" value={campoLink} onChange={(e) => setCampoLink(e.target.value)} required />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="submit" className={styles.btnSalvar}>Salvar Alterações</button>
                                <button type="button" className={styles.btnCancelar} onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreditsPanel;