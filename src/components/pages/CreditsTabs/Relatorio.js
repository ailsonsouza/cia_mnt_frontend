import { useState, useEffect, useMemo } from 'react';
import { BsArrowRight } from 'react-icons/bs';
import styles from '../../styles/styles_pages/styles_creditsTabs/Relatorio.module.css';
import { useAuth } from '../../context/AuthContext';

function Relatorio({ onVerDetalhesNC, onVerDetalhesNE }) {
    const { usuarioAtual } = useAuth();
    const [listaNCs, setListaNCs] = useState([]);
    const [listaNEs, setListaNEs] = useState([]);
    const [listaRPNPs, setListaRPNPs] = useState([]);
    const [listaNFs, setListaNFs] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [abaAtiva, setAbaAtiva] = useState('creditos');
    
    // Filtros para CRÉDITOS
    const [filtroDocumento, setFiltroDocumento] = useState('');
    const [filtroDetentor, setFiltroDetentor] = useState('');
    
    // Status do empenho para CRÉDITOS
    const [statusEmpenho, setStatusEmpenho] = useState({
        todas: true,
        empenhadas: false,
        aEmpenhar: false
    });
    
    // Filtros para EMPENHOS
    const [filtroEmpenhoDocumento, setFiltroEmpenhoDocumento] = useState('');
    const [filtroEmpenhoDetentor, setFiltroEmpenhoDetentor] = useState('');
    
    // Status para EMPENHOS
    const [statusEmpenhoEmpenhos, setStatusEmpenhoEmpenhos] = useState({
        todas: true,
        liquidados: false,
        aLiquidar: false
    });
    
    // Filtros para RPNP
    const [filtroRPNPDocumento, setFiltroRPNPDocumento] = useState('');
    const [filtroRPNPDDetentor, setFiltroRPNPDDetentor] = useState('');
    
    // Status para RPNP
    const [statusRPNP, setStatusRPNP] = useState({
        todas: true,
        liquidados: false,
        aLiquidar: false
    });

    const [ordenacao, setOrdenacao] = useState({ campo: 'detentor', direcao: 'asc' });
    const [ugSelecionada, setUgSelecionada] = useState('ambos');

    // ==================== FUNÇÕES DE PERMISSÃO ====================
    
    // Verifica se o usuário pode ver uma NC específica
    const podeVerNC = (nc) => {
        const nivel = usuarioAtual.nivel;
        const secao = usuarioAtual.secao;
        
        if (nivel === 'DESCENTRALIZADORA') {
            return true;
        }
        
        if (nivel === 'INTERMEDIARIA') {
            return nc.detentor === secao || nc.detentorOriginal === secao;
        }
        
        if (nivel === 'REQUISITANTE') {
            return nc.detentor === secao;
        }
        
        return false;
    };

    // Verifica se o usuário pode ver uma NE específica
    const podeVerNE = (ne) => {
        const nivel = usuarioAtual.nivel;
        const secao = usuarioAtual.secao;
        
        if (nivel === 'DESCENTRALIZADORA') {
            return true;
        }
        
        if (nivel === 'INTERMEDIARIA') {
            const ncOrigem = listaNCs.find(nc => nc.id === ne.idNcVinculada);
            return ncOrigem && (ncOrigem.detentor === secao || ncOrigem.detentorOriginal === secao);
        }
        
        if (nivel === 'REQUISITANTE') {
            const ncOrigem = listaNCs.find(nc => nc.id === ne.idNcVinculada);
            return ncOrigem && ncOrigem.detentor === secao;
        }
        
        return false;
    };

    // Verifica se o usuário pode ver um RPNP específico
    const podeVerRPNP = (rpnp) => {
        const nivel = usuarioAtual.nivel;
        const secao = usuarioAtual.secao;
        
        if (nivel === 'DESCENTRALIZADORA') {
            return true;
        }
        
        if (nivel === 'INTERMEDIARIA') {
            return rpnp.detentor === secao;
        }
        
        if (nivel === 'REQUISITANTE') {
            return rpnp.detentor === secao;
        }
        
        return false;
    };

    const carregarDados = async () => {
        setCarregando(true);
        try {
            const [resNC, resNE, resRPNP, resNF] = await Promise.all([
                fetch('http://localhost:5000/credits_nc').then(r => r.json()),
                fetch('http://localhost:5000/credits_ne').then(r => r.json()),
                fetch('http://localhost:5000/credits_rpnp').then(r => r.json()),
                fetch('http://localhost:5000/credits_nf').then(r => r.json())
            ]);
            
            setListaNCs(Array.isArray(resNC) ? resNC : []);
            setListaNEs(Array.isArray(resNE) ? resNE : []);
            setListaRPNPs(Array.isArray(resRPNP) ? resRPNP : []);
            setListaNFs(Array.isArray(resNF) ? resNF : []);
        } catch (err) {
            console.error("Erro ao carregar dados:", err);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, []);

    const handleStatusChange = (status) => {
        if (status === 'todas') {
            setStatusEmpenho({ todas: true, empenhadas: false, aEmpenhar: false });
        } else if (status === 'empenhadas') {
            setStatusEmpenho({ todas: false, empenhadas: true, aEmpenhar: false });
        } else if (status === 'aEmpenhar') {
            setStatusEmpenho({ todas: false, empenhadas: false, aEmpenhar: true });
        }
    };

    const handleStatusEmpenhoChange = (status) => {
        if (status === 'todas') {
            setStatusEmpenhoEmpenhos({ todas: true, liquidados: false, aLiquidar: false });
        } else if (status === 'liquidados') {
            setStatusEmpenhoEmpenhos({ todas: false, liquidados: true, aLiquidar: false });
        } else if (status === 'aLiquidar') {
            setStatusEmpenhoEmpenhos({ todas: false, liquidados: false, aLiquidar: true });
        }
    };

    const handleStatusRPNPChange = (status) => {
        if (status === 'todas') {
            setStatusRPNP({ todas: true, liquidados: false, aLiquidar: false });
        } else if (status === 'liquidados') {
            setStatusRPNP({ todas: false, liquidados: true, aLiquidar: false });
        } else if (status === 'aLiquidar') {
            setStatusRPNP({ todas: false, liquidados: false, aLiquidar: true });
        }
    };

    const filtrarPorUG = (dados, campoFonte = 'fonteRecurso') => {
        if (ugSelecionada === 'ambos') return dados;
        return dados.filter(item => item[campoFonte] === ugSelecionada);
    };

    const calcularDiasDesdeGeracao = (dataGeracao) => {
        if (!dataGeracao) return null;
        const dataEmpenho = new Date(dataGeracao);
        const dataAtual = new Date();
        dataEmpenho.setHours(0, 0, 0, 0);
        dataAtual.setHours(0, 0, 0, 0);
        const diferenca = Math.floor((dataAtual - dataEmpenho) / (1000 * 60 * 60 * 24));
        return diferenca;
    };

    const calcularSaldoAtualNE = (neId, valorEmpenhado) => {
        const nfsDaNe = listaNFs.filter(nf => nf.idNeVinculada === neId);
        const totalLiquidado = nfsDaNe.reduce((sum, nf) => sum + (parseFloat(nf.valor) || 0), 0);
        return valorEmpenhado - totalLiquidado;
    };

    const buscarTodasNEsDaArvore = (ncId, todasNCs, todasNEs) => {
        const ncAtual = todasNCs.find(nc => nc.id === ncId);
        if (!ncAtual) return [];
        
        const nesDiretas = todasNEs.filter(ne => ne.idNcVinculada === ncId);
        const transferencias = todasNCs.filter(nc => nc.documentoAnterior === ncAtual.codigoUnico);
        const nesTransferencias = transferencias.flatMap(transf => 
            buscarTodasNEsDaArvore(transf.id, todasNCs, todasNEs)
        );
        
        return [...nesDiretas, ...nesTransferencias];
    };

    const calcularValorEmpenhadoArvore = (ncId) => {
        const todasNEsArvore = buscarTodasNEsDaArvore(ncId, listaNCs, listaNEs);
        return todasNEsArvore.reduce((sum, ne) => sum + (ne.valorAtual || 0), 0);
    };

    const calcularValorDisponivelArvore = (nc) => {
        const valorEmpenhadoTotal = calcularValorEmpenhadoArvore(nc.id);
        const valorOriginal = nc.valorOriginal || 0;
        return valorOriginal - valorEmpenhadoTotal;
    };

    const isTotalmenteEmpenhada = (nc) => {
        const valorOriginal = nc.valorOriginal || 0;
        const valorEmpenhadoTotal = calcularValorEmpenhadoArvore(nc.id);
        return valorOriginal > 0 && valorEmpenhadoTotal >= valorOriginal;
    };

    const isPendenteEmpenho = (nc) => {
        const valorOriginal = nc.valorOriginal || 0;
        const valorEmpenhadoTotal = calcularValorEmpenhadoArvore(nc.id);
        return valorEmpenhadoTotal < valorOriginal;
    };

    const formatarPrazo = (prazo) => {
        if (!prazo) return 'Não informado';
        if (prazo === 'EMPENHO IMEDIATO') return 'Imediato';
        const partes = prazo.split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return prazo;
    };

    const isPrazoVencido = (prazo) => {
        if (!prazo || prazo === 'EMPENHO IMEDIATO') return false;
        const dataPrazo = new Date(prazo);
        const hoje = new Date();
        dataPrazo.setHours(0, 0, 0, 0);
        hoje.setHours(0, 0, 0, 0);
        return dataPrazo < hoje;
    };

    // Agrupar NCs por código original (aplicando filtro UG e permissão)
    const ncsUnicas = useMemo(() => {
        const ncsFiltradasPorUG = filtrarPorUG(listaNCs, 'fonteRecurso');
        const ncsPermitidas = ncsFiltradasPorUG.filter(nc => podeVerNC(nc));
        
        const mapaNCs = new Map();
        
        ncsPermitidas.forEach(nc => {
            const chave = nc.codigoOrigemPermanente || nc.codigoUnico;
            if (!mapaNCs.has(chave)) {
                mapaNCs.set(chave, nc);
            }
        });
        
        return Array.from(mapaNCs.values());
    }, [listaNCs, ugSelecionada, usuarioAtual]);

    // Filtrar e ordenar NCs
    const ncsFiltradas = useMemo(() => {
        let resultado = ncsUnicas.filter(nc => {
            const passaDocumento = (nc.nc || '').toLowerCase().includes(filtroDocumento.toLowerCase());
            const passaDetentor = (nc.detentor || '').toLowerCase().includes(filtroDetentor.toLowerCase());
            
            let passaStatus = true;
            if (statusEmpenho.empenhadas) {
                passaStatus = isTotalmenteEmpenhada(nc);
            } else if (statusEmpenho.aEmpenhar) {
                passaStatus = isPendenteEmpenho(nc);
            }
            
            return passaDocumento && passaDetentor && passaStatus;
        });
        
        resultado.sort((a, b) => {
            let valorA, valorB;
            if (ordenacao.campo === 'detentor') {
                valorA = a.detentor || '';
                valorB = b.detentor || '';
            } else if (ordenacao.campo === 'prazoEmpenho') {
                valorA = formatarPrazo(a.prazoEmpenho);
                valorB = formatarPrazo(b.prazoEmpenho);
            } else {
                valorA = a.detentor || '';
                valorB = b.detentor || '';
            }
            
            if (ordenacao.direcao === 'asc') {
                return valorA > valorB ? 1 : -1;
            } else {
                return valorA < valorB ? 1 : -1;
            }
        });
        
        return resultado;
    }, [ncsUnicas, filtroDocumento, filtroDetentor, statusEmpenho, ordenacao]);

    // Calcular totais da tela para CRÉDITOS
    const totaisTela = useMemo(() => {
        const totalValorNC = ncsFiltradas.reduce((sum, nc) => sum + (nc.valorOriginal || 0), 0);
        const totalValorEmpenhado = ncsFiltradas.reduce((sum, nc) => sum + calcularValorEmpenhadoArvore(nc.id), 0);
        const totalValorAtual = ncsFiltradas.reduce((sum, nc) => sum + calcularValorDisponivelArvore(nc), 0);
        return { totalValorNC, totalValorEmpenhado, totalValorAtual };
    }, [ncsFiltradas]);

    // Dados para aba EMPENHOS (aplicando filtro de permissão)
    const empenhosData = useMemo(() => {
        // CORREÇÃO: Filtrar NEs pela fonteRecurso da NC vinculada
        let nesFiltradas = [...listaNEs];
        
        if (ugSelecionada !== 'ambos') {
            nesFiltradas = listaNEs.filter(ne => {
                const ncOrigem = listaNCs.find(nc => nc.id === ne.idNcVinculada);
                return ncOrigem && ncOrigem.fonteRecurso === ugSelecionada;
            });
        }
        
        const nesPermitidas = nesFiltradas.filter(ne => podeVerNE(ne));
        
        return nesPermitidas.map(ne => {
            const ncOrigem = listaNCs.find(nc => nc.id === ne.idNcVinculada);
            const saldoAtual = calcularSaldoAtualNE(ne.id, ne.valorAtual || 0);
            const diasDesdeGeracao = calcularDiasDesdeGeracao(ne.dataGeracaoNE);
            return {
                id: ne.id,
                numero: ne.numeroNE,
                numeroNC: ncOrigem?.nc || 'N/A',
                idNC: ncOrigem?.id,
                detentor: ncOrigem?.detentor || '-',
                valorEmpenhado: ne.valorAtual || 0,
                saldoAtual: saldoAtual,
                dataGeracao: ne.dataGeracaoNE,
                diasDesdeGeracao: diasDesdeGeracao,
                finalidade: ne.finalidade || ncOrigem?.finalidade || '',
                observacao: ne.observacoes || '',
                ultimaAtualizacaoObs: ne.ultimaAtualizacaoObs || '',
                status: ne.valorAtual > 0 ? 'Em Andamento' : 'Finalizado'
            };
        });
    }, [listaNEs, listaNCs, listaNFs, ugSelecionada, usuarioAtual]);

    // Filtrar empenhos
    const empenhosFiltrados = useMemo(() => {
        return empenhosData.filter(e => {
            const passaDocumento = (e.numero || '').toLowerCase().includes(filtroEmpenhoDocumento.toLowerCase());
            const passaDetentor = (e.detentor || '').toLowerCase().includes(filtroEmpenhoDetentor.toLowerCase());
            
            let passaStatus = true;
            if (statusEmpenhoEmpenhos.liquidados) {
                passaStatus = e.saldoAtual === 0;
            } else if (statusEmpenhoEmpenhos.aLiquidar) {
                passaStatus = e.saldoAtual > 0;
            }
            
            return passaDocumento && passaDetentor && passaStatus;
        });
    }, [empenhosData, filtroEmpenhoDocumento, filtroEmpenhoDetentor, statusEmpenhoEmpenhos]);

    // Ordenar empenhos
    const empenhosOrdenados = useMemo(() => {
        return [...empenhosFiltrados].sort((a, b) => {
            let valorA, valorB;
            if (ordenacao.campo === 'detentor') {
                valorA = a.detentor || '';
                valorB = b.detentor || '';
            } else if (ordenacao.campo === 'dataGeracao') {
                if (a.dataGeracao === 'EMPENHO IMEDIATO' && b.dataGeracao !== 'EMPENHO IMEDIATO') return -1;
                if (a.dataGeracao !== 'EMPENHO IMEDIATO' && b.dataGeracao === 'EMPENHO IMEDIATO') return 1;
                valorA = a.dataGeracao || '';
                valorB = b.dataGeracao || '';
            } else {
                valorA = a.detentor || '';
                valorB = b.detentor || '';
            }
            
            if (ordenacao.direcao === 'asc') {
                return valorA > valorB ? 1 : -1;
            } else {
                return valorA < valorB ? 1 : -1;
            }
        });
    }, [empenhosFiltrados, ordenacao]);

    const totaisEmpenhosTela = useMemo(() => {
        const totalValorEmpenhado = empenhosFiltrados.reduce((sum, e) => sum + e.valorEmpenhado, 0);
        const totalSaldoAtual = empenhosFiltrados.reduce((sum, e) => sum + e.saldoAtual, 0);
        return { totalValorEmpenhado, totalSaldoAtual };
    }, [empenhosFiltrados]);

    // Dados para aba RPNP (aplicando filtro de permissão)
    const rpnpData = useMemo(() => {
        const rpnpsFiltradasPorUG = filtrarPorUG(listaRPNPs, 'fonteRecurso');
        const rpnpsPermitidas = rpnpsFiltradasPorUG.filter(rp => podeVerRPNP(rp));
        
        return rpnpsPermitidas.map(rp => {
            const saldoAtual = calcularSaldoAtualNE(rp.id, rp.valorAtual || 0);
            const diasDesdeGeracao = calcularDiasDesdeGeracao(rp.dataGeracao);
            return {
                id: rp.id,
                numero: rp.numeroNE,
                detentor: rp.detentor || '-',
                valorInscrito: rp.valorAtual || 0,
                saldoAtual: saldoAtual,
                dataGeracao: rp.dataGeracao,
                diasDesdeGeracao: diasDesdeGeracao,
                finalidade: rp.finalidade || '',
                observacao: rp.observacoes || '',
                ultimaAtualizacaoObs: rp.ultimaAtualizacaoObs || ''
            };
        });
    }, [listaRPNPs, listaNFs, ugSelecionada, usuarioAtual]);

    // Filtrar RPNPs
    const rpnpsFiltrados = useMemo(() => {
        return rpnpData.filter(r => {
            const passaDocumento = (r.numero || '').toLowerCase().includes(filtroRPNPDocumento.toLowerCase());
            const passaDetentor = (r.detentor || '').toLowerCase().includes(filtroRPNPDDetentor.toLowerCase());
            
            let passaStatus = true;
            if (statusRPNP.liquidados) {
                passaStatus = r.saldoAtual === 0;
            } else if (statusRPNP.aLiquidar) {
                passaStatus = r.saldoAtual > 0;
            }
            
            return passaDocumento && passaDetentor && passaStatus;
        });
    }, [rpnpData, filtroRPNPDocumento, filtroRPNPDDetentor, statusRPNP]);

    // Ordenar RPNPs
    const rpnpsOrdenados = useMemo(() => {
        return [...rpnpsFiltrados].sort((a, b) => {
            let valorA, valorB;
            if (ordenacao.campo === 'detentor') {
                valorA = a.detentor || '';
                valorB = b.detentor || '';
            } else {
                valorA = a.detentor || '';
                valorB = b.detentor || '';
            }
            
            if (ordenacao.direcao === 'asc') {
                return valorA > valorB ? 1 : -1;
            } else {
                return valorA < valorB ? 1 : -1;
            }
        });
    }, [rpnpsFiltrados, ordenacao]);

    const totaisRPNPTela = useMemo(() => {
        const totalValor = rpnpsFiltrados.reduce((sum, r) => sum + r.valorInscrito, 0);
        const totalSaldoAtual = rpnpsFiltrados.reduce((sum, r) => sum + r.saldoAtual, 0);
        return { totalValor, totalSaldoAtual };
    }, [rpnpsFiltrados]);

    // DADOS PARA DASHBOARD
    const ncsDashboard = useMemo(() => {
        const ncsFiltradasPorUG = filtrarPorUG(listaNCs, 'fonteRecurso');
        return ncsFiltradasPorUG.filter(nc => podeVerNC(nc));
    }, [listaNCs, ugSelecionada, usuarioAtual]);

    const nesDashboard = useMemo(() => {
        const nesFiltradasPorUG = filtrarPorUG(listaNEs, 'fonteRecurso');
        return nesFiltradasPorUG.filter(ne => podeVerNE(ne));
    }, [listaNEs, ugSelecionada, usuarioAtual]);

    const rpnpsDashboard = useMemo(() => {
        const rpnpsFiltradasPorUG = filtrarPorUG(listaRPNPs, 'fonteRecurso');
        return rpnpsFiltradasPorUG.filter(rp => podeVerRPNP(rp));
    }, [listaRPNPs, ugSelecionada, usuarioAtual]);

    const nfsDashboard = useMemo(() => {
        return filtrarPorUG(listaNFs, 'fonteRecurso');
    }, [listaNFs, ugSelecionada]);

    // KPIs
    const kpis = useMemo(() => {
        const totalCreditos = ncsDashboard.reduce((sum, nc) => sum + (nc.valorOriginal || 0), 0);
        const totalEmpenhado = nesDashboard.reduce((sum, ne) => sum + (ne.valorAtual || 0), 0);
        const totalLiquidado = nfsDashboard
            .filter(nf => nf.status === 'LIQUIDADA')
            .reduce((sum, nf) => sum + (parseFloat(nf.valor) || 0), 0);
        const totalRPNPInscrito = rpnpsDashboard.reduce((sum, rp) => sum + (rp.valorAtual || 0), 0);
        const totalRPNPLiquidado = nfsDashboard
            .filter(nf => nf.status === 'LIQUIDADA')
            .reduce((sum, nf) => {
                const rpnpVinculado = rpnpsDashboard.find(rp => rp.id === nf.idNeVinculada);
                return rpnpVinculado ? sum + (parseFloat(nf.valor) || 0) : sum;
            }, 0);
        
        return {
            totalCreditos,
            totalEmpenhado,
            totalLiquidado,
            totalRPNPInscrito,
            totalRPNPLiquidado
        };
    }, [ncsDashboard, nesDashboard, rpnpsDashboard, nfsDashboard]);

    const formatarMoeda = (valor) => {
        if (typeof valor !== 'number') return 'R$ 0,00';
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatarData = (data) => {
        if (!data) return '-';
        if (data === 'EMPENHO IMEDIATO') return 'Imediato';
        const partes = data.split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return data;
    };

    const handleOrdenar = (campo) => {
        setOrdenacao(prev => ({
            campo,
            direcao: prev.campo === campo && prev.direcao === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getOrdenacaoIcon = (campo) => {
        if (ordenacao.campo !== campo) return '↕️';
        return ordenacao.direcao === 'asc' ? '↑' : '↓';
    };

    if (carregando) {
        return <div className={styles.loader}>Carregando relatório...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.headerWithSelector}>
                <h2>Relatório Geral</h2>
                <div className={styles.ugSelector}>
                    <div className={styles.ugToggle}>
                        <button 
                            className={`${styles.ugOption} ${ugSelecionada === 'ambos' ? styles.active : ''}`}
                            onClick={() => setUgSelecionada('ambos')}
                        >
                            AMBOS
                        </button>
                        <button 
                            className={`${styles.ugOption} ${ugSelecionada === '160' ? styles.active : ''}`}
                            onClick={() => setUgSelecionada('160')}
                        >
                            160212
                        </button>
                        <button 
                            className={`${styles.ugOption} ${ugSelecionada === '167' ? styles.active : ''}`}
                            onClick={() => setUgSelecionada('167')}
                        >
                            167212
                        </button>
                    </div>
                </div>
            </div>
            
            <div className={styles.reportTabs}>
                <button 
                    className={`${styles.reportTab} ${abaAtiva === 'creditos' ? styles.reportTabAtivo : ''}`}
                    onClick={() => setAbaAtiva('creditos')}
                >
                    📋 CRÉDITOS
                    <span className={styles.tabCount}>{ncsFiltradas.length}</span>
                </button>
                <button 
                    className={`${styles.reportTab} ${abaAtiva === 'empenhos' ? styles.reportTabAtivo : ''}`}
                    onClick={() => setAbaAtiva('empenhos')}
                >
                    📝 EMPENHOS
                    <span className={styles.tabCount}>{empenhosFiltrados.length}</span>
                </button>
                <button 
                    className={`${styles.reportTab} ${abaAtiva === 'rpnp' ? styles.reportTabAtivo : ''}`}
                    onClick={() => setAbaAtiva('rpnp')}
                >
                    📄 RPNP
                    <span className={styles.tabCount}>{rpnpsFiltrados.length}</span>
                </button>
                <button 
                    className={`${styles.reportTab} ${abaAtiva === 'dashboard' ? styles.reportTabAtivo : ''}`}
                    onClick={() => setAbaAtiva('dashboard')}
                >
                    📊 DASHBOARD
                </button>
            </div>

            <div className={styles.reportContent}>
                {/* ABA CRÉDITOS */}
                {abaAtiva === 'creditos' && (
                    <>
                        <div className={styles.filterBarSingle}>
                            <div className={styles.filterGroup}>
                                <label>Nota de Crédito</label>
                                <input type="text" placeholder="Buscar..." value={filtroDocumento} onChange={(e) => setFiltroDocumento(e.target.value)} />
                            </div>
                            <div className={styles.filterGroup}>
                                <label>Detentor</label>
                                <input type="text" placeholder="Buscar..." value={filtroDetentor} onChange={(e) => setFiltroDetentor(e.target.value)} />
                            </div>
                            <div className={styles.filterGroupCheckboxes}>
                                <label>STATUS:</label>
                                <div className={styles.checkboxGroup}>
                                    <label className={styles.checkboxLabel}>
                                        <input type="checkbox" checked={statusEmpenho.todas} onChange={() => handleStatusChange('todas')} />
                                        <span>TODAS</span>
                                    </label>
                                    <label className={styles.checkboxLabel}>
                                        <input type="checkbox" checked={statusEmpenho.empenhadas} onChange={() => handleStatusChange('empenhadas')} />
                                        <span>EMPENHADAS</span>
                                    </label>
                                    <label className={styles.checkboxLabel}>
                                        <input type="checkbox" checked={statusEmpenho.aEmpenhar} onChange={() => handleStatusChange('aEmpenhar')} />
                                        <span>A EMPENHAR</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div className={styles.totalTopo} style={{ marginBottom: '15px' }}>
                            <div className={styles.totalTopoItem}>
                                <span>Total em N.C.:</span>
                                <strong>{formatarMoeda(totaisTela.totalValorNC)}</strong>
                            </div>
                            <div className={styles.totalTopoItem}>
                                <span>Total Empenhado:</span>
                                <strong>{formatarMoeda(totaisTela.totalValorEmpenhado)}</strong>
                            </div>
                            <div className={styles.totalTopoItem}>
                                <span>Valor em Tela:</span>
                                <strong>{formatarMoeda(totaisTela.totalValorAtual)}</strong>
                            </div>
                        </div>

                        <div className={styles.tableContainer}>
                            <table className={styles.dataTable}>
                                <colgroup>
                                    <col style={{ width: '13%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '12%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '12%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '33%' }} />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th onClick={() => handleOrdenar('nc')} style={{ cursor: 'pointer', textAlign: 'center' }}>Nota de Crédito</th>
                                        <th onClick={() => handleOrdenar('detentor')} style={{ cursor: 'pointer', textAlign: 'center' }}>Detentor {getOrdenacaoIcon('detentor')}</th>
                                        <th onClick={() => handleOrdenar('prazoEmpenho')} style={{ cursor: 'pointer', textAlign: 'center' }}>Prazo para Empenho {getOrdenacaoIcon('prazoEmpenho')}</th>
                                        <th style={{ textAlign: 'center' }}>Valor da NC</th>
                                        <th style={{ textAlign: 'center' }}>Valor Empenhado</th>
                                        <th style={{ textAlign: 'center' }}>Valor Disponível</th>
                                        <th style={{ textAlign: 'center' }}>Finalidade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ncsFiltradas.map(nc => {
                                        const valorEmpenhado = calcularValorEmpenhadoArvore(nc.id);
                                        const valorDisponivel = calcularValorDisponivelArvore(nc);
                                        const prazoVencido = isPrazoVencido(nc.prazoEmpenho);
                                        const totalmenteEmpenhada = isTotalmenteEmpenhada(nc);
                                        
                                        return (
                                            <tr key={nc.id}>
                                                <td className={styles.documentoCell} style={{ textAlign: 'center' }}>
                                                    <button className={styles.linkDocumento} onClick={() => onVerDetalhesNC && onVerDetalhesNC(nc.id)}>
                                                        {nc.nc}
                                                    </button>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>{nc.detentor || '-'}</td>
                                                <td className={prazoVencido ? styles.prazoVencido : ''} style={{ textAlign: 'center' }}>{formatarPrazo(nc.prazoEmpenho)}</td>
                                                <td className={styles.valorCell} style={{ textAlign: 'center' }}>{formatarMoeda(nc.valorOriginal)}</td>
                                                <td className={`${styles.valorCell} ${totalmenteEmpenhada ? styles.zerado : ''}`} style={{ textAlign: 'center' }}>{formatarMoeda(valorEmpenhado)}</td>
                                                <td className={`${styles.valorCell} ${valorDisponivel === 0 ? styles.zerado : ''}`} style={{ textAlign: 'center' }}>{formatarMoeda(valorDisponivel)}</td>
                                                <td className={styles.finalidadeCell}>{nc.finalidade}</td>
                                            </tr>
                                        );
                                    })}
                                    {ncsFiltradas.length === 0 && (
                                        <tr><td colSpan="7" className={styles.emptyRow}>Nenhum crédito encontrado.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ABA EMPENHOS */}
                {abaAtiva === 'empenhos' && (
                    <>
                        <div className={styles.filterBarSingle}>
                            <div className={styles.filterGroup}>
                                <label>Nº do Empenho</label>
                                <input type="text" placeholder="Buscar..." value={filtroEmpenhoDocumento} onChange={(e) => setFiltroEmpenhoDocumento(e.target.value)} />
                            </div>
                            <div className={styles.filterGroup}>
                                <label>Detentor</label>
                                <input type="text" placeholder="Buscar..." value={filtroEmpenhoDetentor} onChange={(e) => setFiltroEmpenhoDetentor(e.target.value)} />
                            </div>
                            <div className={styles.filterGroupCheckboxes}>
                                <label>STATUS:</label>
                                <div className={styles.checkboxGroup}>
                                    <label className={styles.checkboxLabel}>
                                        <input type="checkbox" checked={statusEmpenhoEmpenhos.todas} onChange={() => handleStatusEmpenhoChange('todas')} />
                                        <span>TODOS</span>
                                    </label>
                                    <label className={styles.checkboxLabel}>
                                        <input type="checkbox" checked={statusEmpenhoEmpenhos.liquidados} onChange={() => handleStatusEmpenhoChange('liquidados')} />
                                        <span>LIQUIDADOS</span>
                                    </label>
                                    <label className={styles.checkboxLabel}>
                                        <input type="checkbox" checked={statusEmpenhoEmpenhos.aLiquidar} onChange={() => handleStatusEmpenhoChange('aLiquidar')} />
                                        <span>A LIQUIDAR</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div className={styles.totalTopo} style={{ marginBottom: '15px' }}>
                            <div className={styles.totalTopoItem}>
                                <span>Total em tela (Valor Empenhado):</span>
                                <strong>{formatarMoeda(totaisEmpenhosTela.totalValorEmpenhado)}</strong>
                            </div>
                            <div className={styles.totalTopoItem}>
                                <span>Total em tela (Saldo Atual):</span>
                                <strong>{formatarMoeda(totaisEmpenhosTela.totalSaldoAtual)}</strong>
                            </div>
                        </div>

                        <div className={styles.tableContainer}>
                            <table className={styles.dataTable}>
                                <colgroup>
                                    <col style={{ width: '12%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '20%' }} />
                                    <col style={{ width: '18%' }} />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'center' }}>Nº Empenho</th>
                                        <th style={{ textAlign: 'center' }}>NC Origem</th>
                                        <th onClick={() => handleOrdenar('detentor')} style={{ cursor: 'pointer', textAlign: 'center' }}>Detentor {getOrdenacaoIcon('detentor')}</th>
                                        <th onClick={() => handleOrdenar('dataGeracao')} style={{ cursor: 'pointer', textAlign: 'center' }}>Data {getOrdenacaoIcon('dataGeracao')}</th>
                                        <th style={{ textAlign: 'center' }}>Valor Empenhado</th>
                                        <th style={{ textAlign: 'center' }}>Saldo Atual</th>
                                        <th style={{ textAlign: 'center' }}>Finalidade</th>
                                        <th style={{ textAlign: 'center' }}>Observações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {empenhosOrdenados.map(empenho => (
                                        <tr key={empenho.id}>
                                            <td style={{ textAlign: 'center' }}>
                                                <button className={styles.linkDocumento} onClick={() => onVerDetalhesNE && onVerDetalhesNE(empenho.id)}>{empenho.numero}</button>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button className={styles.linkDocumento} onClick={() => onVerDetalhesNC && onVerDetalhesNC(empenho.idNC)}>{empenho.numeroNC}</button>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>{empenho.detentor}</td>
                                            <td style={{ textAlign: 'center' }}>{formatarData(empenho.dataGeracao)}</td>
                                            <td className={styles.valorCell} style={{ textAlign: 'center' }}>{formatarMoeda(empenho.valorEmpenhado)}</td>
                                            <td className={`${styles.valorCell} ${empenho.saldoAtual === 0 ? styles.zerado : ''}`} style={{ textAlign: 'center' }}>{formatarMoeda(empenho.saldoAtual)}</td>
                                            <td className={styles.finalidadeCell}>{empenho.finalidade}</td>
                                            <td className={styles.observacaoCell}>
                                                {empenho.ultimaAtualizacaoObs} 
                                                {empenho.observacao && empenho.observacao.trim() !== '' && (
                                                    <BsArrowRight style={{ margin: '0 4px', color: '#e20909' }} />
                                                )} 
                                                {empenho.observacao || ''}
                                            </td>
                                        </tr>
                                    ))}
                                    {empenhosFiltrados.length === 0 && (
                                        <tr><td colSpan="8" className={styles.emptyRow}>Nenhum empenho encontrado.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ABA RPNP */}
                {abaAtiva === 'rpnp' && (
                    <>
                        <div className={styles.filterBarSingle}>
                            <div className={styles.filterGroup}>
                                <label>Nº RPNP</label>
                                <input type="text" placeholder="Buscar..." value={filtroRPNPDocumento} onChange={(e) => setFiltroRPNPDocumento(e.target.value)} />
                            </div>
                            <div className={styles.filterGroup}>
                                <label>Detentor</label>
                                <input type="text" placeholder="Buscar..." value={filtroRPNPDDetentor} onChange={(e) => setFiltroRPNPDDetentor(e.target.value)} />
                            </div>
                            <div className={styles.filterGroupCheckboxes}>
                                <label>STATUS:</label>
                                <div className={styles.checkboxGroup}>
                                    <label className={styles.checkboxLabel}>
                                        <input type="checkbox" checked={statusRPNP.todas} onChange={() => handleStatusRPNPChange('todas')} />
                                        <span>TODOS</span>
                                    </label>
                                    <label className={styles.checkboxLabel}>
                                        <input type="checkbox" checked={statusRPNP.liquidados} onChange={() => handleStatusRPNPChange('liquidados')} />
                                        <span>LIQUIDADOS</span>
                                    </label>
                                    <label className={styles.checkboxLabel}>
                                        <input type="checkbox" checked={statusRPNP.aLiquidar} onChange={() => handleStatusRPNPChange('aLiquidar')} />
                                        <span>A LIQUIDAR</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div className={styles.totalTopo} style={{ marginBottom: '15px' }}>
                            <div className={styles.totalTopoItem}>
                                <span>Total em tela (Valor Inscrito):</span>
                                <strong>{formatarMoeda(totaisRPNPTela.totalValor)}</strong>
                            </div>
                            <div className={styles.totalTopoItem}>
                                <span>Total em tela (Saldo Atual):</span>
                                <strong>{formatarMoeda(totaisRPNPTela.totalSaldoAtual)}</strong>
                            </div>
                        </div>

                        <div className={styles.tableContainer}>
                            <table className={styles.dataTable}>
                                <colgroup>
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '30%' }} />
                                    <col style={{ width: '30%' }} />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'center' }}>Nº RPNP</th>
                                        <th onClick={() => handleOrdenar('detentor')} style={{ cursor: 'pointer', textAlign: 'center' }}>Detentor {getOrdenacaoIcon('detentor')}</th>
                                        <th style={{ textAlign: 'center' }}>Valor Inscrito</th>
                                        <th style={{ textAlign: 'center' }}>Saldo Atual</th>
                                        <th style={{ textAlign: 'center' }}>Finalidade</th>
                                        <th style={{ textAlign: 'center' }}>Observações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rpnpsOrdenados.map(rp => (
                                        <tr key={rp.id}>
                                            <td style={{ textAlign: 'center' }}>
                                                <button className={styles.linkDocumento} onClick={() => onVerDetalhesNE && onVerDetalhesNE(rp.id)}>{rp.numero}</button>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>{rp.detentor}</td>
                                            <td className={styles.valorCell} style={{ textAlign: 'center' }}>{formatarMoeda(rp.valorInscrito)}</td>
                                            <td className={`${styles.valorCell} ${rp.saldoAtual === 0 ? styles.zerado : ''}`} style={{ textAlign: 'center' }}>{formatarMoeda(rp.saldoAtual)}</td>
                                            <td className={styles.finalidadeCell}>{rp.finalidade}</td>
                                            <td className={styles.observacaoCell}>
                                                {rp.ultimaAtualizacaoObs} 
                                                {rp.observacao && rp.observacao.trim() !== '' && (
                                                    <BsArrowRight style={{ margin: '0 4px', color: '#e20909' }} />
                                                )} 
                                                {rp.observacao || ''}
                                            </td>
                                        </tr>
                                    ))}
                                    {rpnpsFiltrados.length === 0 && (
                                        <tr><td colSpan="6" className={styles.emptyRow}>Nenhum RPNP encontrado.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ABA DASHBOARD */}
                {abaAtiva === 'dashboard' && (
                    <div className={styles.dashboardContainer}>
                        <div className={styles.kpiGrid}>
                            <div className={styles.kpiCard}>
                                <div className={styles.kpiIcon}>💰</div>
                                <div className={styles.kpiTitle}>Total de Créditos</div>
                                <div className={styles.kpiValue}>{formatarMoeda(kpis.totalCreditos)}</div>
                            </div>
                            <div className={styles.kpiCard}>
                                <div className={styles.kpiIcon}>📝</div>
                                <div className={styles.kpiTitle}>Total Empenhado</div>
                                <div className={styles.kpiValue}>{formatarMoeda(kpis.totalEmpenhado)}</div>
                            </div>
                            <div className={styles.kpiCard}>
                                <div className={styles.kpiIcon}>✅</div>
                                <div className={styles.kpiTitle}>Total Liquidado</div>
                                <div className={styles.kpiValue}>{formatarMoeda(kpis.totalLiquidado)}</div>
                            </div>
                            <div className={styles.kpiCard}>
                                <div className={styles.kpiIcon}>📄</div>
                                <div className={styles.kpiTitle}>Total Inscrito em RPNP</div>
                                <div className={styles.kpiValue}>{formatarMoeda(kpis.totalRPNPInscrito)}</div>
                            </div>
                            <div className={styles.kpiCard}>
                                <div className={styles.kpiIcon}>✅📄</div>
                                <div className={styles.kpiTitle}>Total Liquidado RPNP</div>
                                <div className={styles.kpiValue}>{formatarMoeda(kpis.totalRPNPLiquidado)}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Relatorio;