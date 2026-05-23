import { useState, useEffect, useMemo } from 'react';
import styles from '../../styles/styles_pages/styles_creditsTabs/Relatorio.module.css';

function Relatorio({ onVerDetalhesNC, onVerDetalhesNE }) {
    const [listaNCs, setListaNCs] = useState([]);
    const [listaNEs, setListaNEs] = useState([]);
    const [listaRPNPs, setListaRPNPs] = useState([]);
    const [listaNFs, setListaNFs] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [abaAtiva, setAbaAtiva] = useState('creditos');
    
    // Filtros para CRÉDITOS
    const [filtroDocumento, setFiltroDocumento] = useState('');
    const [filtroDetentor, setFiltroDetentor] = useState('');
    const [filtroPrazo, setFiltroPrazo] = useState('');
    
    // Filtros para EMPENHOS
    const [filtroEmpenhoDocumento, setFiltroEmpenhoDocumento] = useState('');
    const [filtroEmpenhoDetentor, setFiltroEmpenhoDetentor] = useState('');
    const [filtroEmpenhoQtdDias, setFiltroEmpenhoQtdDias] = useState('');

    // Estado para ordenação
    const [ordenacao, setOrdenacao] = useState({ campo: 'nc', direcao: 'asc' });
    
    // Estado para UG selecionada (global)
    const [ugSelecionada, setUgSelecionada] = useState('ambos');

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

    // Função para filtrar dados por UG
    const filtrarPorUG = (dados, campoFonte = 'fonteRecurso') => {
        if (ugSelecionada === 'ambos') return dados;
        return dados.filter(item => item[campoFonte] === ugSelecionada);
    };

    // Calcular dias desde a geração do empenho
    const calcularDiasDesdeGeracao = (dataGeracao) => {
        if (!dataGeracao) return null;
        const dataEmpenho = new Date(dataGeracao);
        const dataAtual = new Date();
        dataEmpenho.setHours(0, 0, 0, 0);
        dataAtual.setHours(0, 0, 0, 0);
        const diferenca = Math.floor((dataAtual - dataEmpenho) / (1000 * 60 * 60 * 24));
        return diferenca;
    };

    // Calcular saldo atual de uma NE (valor empenhado - total de NFs)
    const calcularSaldoAtualNE = (neId, valorEmpenhado) => {
        const nfsDaNe = listaNFs.filter(nf => nf.idNeVinculada === neId);
        const totalLiquidado = nfsDaNe.reduce((sum, nf) => sum + (parseFloat(nf.valor) || 0), 0);
        return valorEmpenhado - totalLiquidado;
    };

    // Calcular valor empenhado total para uma NC
    const calcularValorEmpenhado = (ncId) => {
        const nesDaNC = listaNEs.filter(ne => ne.idNcVinculada === ncId);
        return nesDaNC.reduce((sum, ne) => sum + (ne.valorAtual || 0), 0);
    };

    // Calcular valor atual da NC (valor - valor empenhado)
    const calcularValorAtual = (nc) => {
        const valorEmpenhado = calcularValorEmpenhado(nc.id);
        return (nc.valor || 0) - valorEmpenhado;
    };

    // Formatar prazo para exibição
    const formatarPrazo = (prazo) => {
        if (!prazo) return 'Não informado';
        if (prazo === 'EMPENHO IMEDIATO') return 'Imediato';
        const partes = prazo.split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return prazo;
    };

    // Verificar se prazo está vencido
    const isPrazoVencido = (prazo) => {
        if (!prazo || prazo === 'EMPENHO IMEDIATO') return false;
        const dataPrazo = new Date(prazo);
        const hoje = new Date();
        dataPrazo.setHours(0, 0, 0, 0);
        hoje.setHours(0, 0, 0, 0);
        return dataPrazo < hoje;
    };

    // Agrupar NCs por código original (aplicando filtro UG)
    const ncsUnicas = useMemo(() => {
        const ncsFiltradasPorUG = filtrarPorUG(listaNCs, 'fonteRecurso');
        const mapaNCs = new Map();
        
        ncsFiltradasPorUG.forEach(nc => {
            const chave = nc.codigoOrigemPermanente || nc.codigoUnico;
            if (!mapaNCs.has(chave)) {
                mapaNCs.set(chave, nc);
            }
        });
        
        return Array.from(mapaNCs.values());
    }, [listaNCs, ugSelecionada]);

    // Filtrar e ordenar NCs
    const ncsFiltradas = useMemo(() => {
        let resultado = ncsUnicas.filter(nc => {
            const passaDocumento = (nc.nc || '').toLowerCase().includes(filtroDocumento.toLowerCase());
            const passaDetentor = (nc.detentor || '').toLowerCase().includes(filtroDetentor.toLowerCase());
            const prazoFormatado = formatarPrazo(nc.prazoEmpenho);
            const passaPrazo = filtroPrazo === '' || prazoFormatado.toLowerCase().includes(filtroPrazo.toLowerCase());
            return passaDocumento && passaDetentor && passaPrazo;
        });
        
        resultado.sort((a, b) => {
            let valorA, valorB;
            switch (ordenacao.campo) {
                case 'nc':
                    valorA = a.nc || '';
                    valorB = b.nc || '';
                    break;
                case 'detentor':
                    valorA = a.detentor || '';
                    valorB = b.detentor || '';
                    break;
                case 'prazoEmpenho':
                    valorA = formatarPrazo(a.prazoEmpenho);
                    valorB = formatarPrazo(b.prazoEmpenho);
                    break;
                case 'valorTotal':
                    valorA = a.valor || 0;
                    valorB = b.valor || 0;
                    break;
                case 'valorEmpenhado':
                    valorA = calcularValorEmpenhado(a.id);
                    valorB = calcularValorEmpenhado(b.id);
                    break;
                case 'valorAtual':
                    valorA = calcularValorAtual(a);
                    valorB = calcularValorAtual(b);
                    break;
                default:
                    valorA = a.nc || '';
                    valorB = b.nc || '';
            }
            
            if (ordenacao.direcao === 'asc') {
                return valorA > valorB ? 1 : -1;
            } else {
                return valorA < valorB ? 1 : -1;
            }
        });
        
        return resultado;
    }, [ncsUnicas, filtroDocumento, filtroDetentor, filtroPrazo, ordenacao]);

    // Calcular totais da tela para CRÉDITOS
    const totaisTela = useMemo(() => {
        const totalValorNC = ncsFiltradas.reduce((sum, nc) => sum + (nc.valor || 0), 0);
        const totalValorEmpenhado = ncsFiltradas.reduce((sum, nc) => sum + calcularValorEmpenhado(nc.id), 0);
        const totalValorAtual = ncsFiltradas.reduce((sum, nc) => sum + calcularValorAtual(nc), 0);
        return { totalValorNC, totalValorEmpenhado, totalValorAtual };
    }, [ncsFiltradas]);

    // Dados para aba EMPENHOS (aplicando filtro UG)
    const empenhosData = useMemo(() => {
        const nesFiltradasPorUG = filtrarPorUG(listaNEs, 'fonteRecurso');
        return nesFiltradasPorUG.map(ne => {
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
                observacao: ne.observacoes || ne.finalidade || ncOrigem?.finalidade || '',
                status: ne.valorAtual > 0 ? 'Em Andamento' : 'Finalizado'
            };
        });
    }, [listaNEs, listaNCs, listaNFs, ugSelecionada]);

    // Filtrar empenhos
    const empenhosFiltrados = useMemo(() => {
        return empenhosData.filter(e => {
            const passaDocumento = (e.numero || '').toLowerCase().includes(filtroEmpenhoDocumento.toLowerCase());
            const passaDetentor = (e.detentor || '').toLowerCase().includes(filtroEmpenhoDetentor.toLowerCase());
            const passaDias = filtroEmpenhoQtdDias === '' || (e.diasDesdeGeracao !== null && e.diasDesdeGeracao >= parseInt(filtroEmpenhoQtdDias));
            return passaDocumento && passaDetentor && passaDias;
        });
    }, [empenhosData, filtroEmpenhoDocumento, filtroEmpenhoDetentor, filtroEmpenhoQtdDias]);

    // Calcular totais da tela para EMPENHOS
    const totaisEmpenhosTela = useMemo(() => {
        const totalValorEmpenhado = empenhosFiltrados.reduce((sum, e) => sum + e.valorEmpenhado, 0);
        const totalSaldoAtual = empenhosFiltrados.reduce((sum, e) => sum + e.saldoAtual, 0);
        return { totalValorEmpenhado, totalSaldoAtual };
    }, [empenhosFiltrados]);

    // Dados para aba RPNP (aplicando filtro UG)
    const rpnpData = useMemo(() => {
        const rpnpsFiltradasPorUG = filtrarPorUG(listaRPNPs, 'fonteRecurso');
        return rpnpsFiltradasPorUG.map(rp => {
            const ncOrigem = listaNCs.find(nc => nc.id === rp.idNcVinculada);
            const saldoAtual = calcularSaldoAtualNE(rp.id, rp.valorAtual || 0);
            const diasDesdeGeracao = calcularDiasDesdeGeracao(rp.dataGeracaoNE);
            return {
                id: rp.id,
                numero: rp.numeroNE,
                numeroNC: ncOrigem?.nc || 'N/A',
                idNC: ncOrigem?.id,
                detentor: ncOrigem?.detentor || '-',
                valorEmpenhado: rp.valorAtual || 0,
                saldoAtual: saldoAtual,
                dataGeracao: rp.dataGeracaoNE,
                diasDesdeGeracao: diasDesdeGeracao,
                observacao: rp.observacoes || rp.finalidade || ncOrigem?.finalidade || '',
                status: rp.valorAtual > 0 ? 'Em Andamento' : 'Finalizado'
            };
        });
    }, [listaRPNPs, listaNCs, listaNFs, ugSelecionada]);

    // Filtrar RPNPs
    const rpnpsFiltrados = useMemo(() => {
        return rpnpData.filter(r => {
            const passaDocumento = (r.numero || '').toLowerCase().includes(filtroEmpenhoDocumento.toLowerCase());
            const passaDetentor = (r.detentor || '').toLowerCase().includes(filtroEmpenhoDetentor.toLowerCase());
            const passaDias = filtroEmpenhoQtdDias === '' || (r.diasDesdeGeracao !== null && r.diasDesdeGeracao >= parseInt(filtroEmpenhoQtdDias));
            return passaDocumento && passaDetentor && passaDias;
        });
    }, [rpnpData, filtroEmpenhoDocumento, filtroEmpenhoDetentor, filtroEmpenhoQtdDias]);

    // Calcular totais da tela para RPNP
    const totaisRPNPTela = useMemo(() => {
        const totalValor = rpnpsFiltrados.reduce((sum, r) => sum + r.valorEmpenhado, 0);
        const totalSaldoAtual = rpnpsFiltrados.reduce((sum, r) => sum + r.saldoAtual, 0);
        return { totalValor, totalSaldoAtual };
    }, [rpnpsFiltrados]);

    // ==================== DADOS PARA DASHBOARD ====================
    
    // Dados filtrados por UG para o dashboard
    const ncsDashboard = useMemo(() => {
        return filtrarPorUG(listaNCs, 'fonteRecurso');
    }, [listaNCs, ugSelecionada]);

    const nesDashboard = useMemo(() => {
        return filtrarPorUG(listaNEs, 'fonteRecurso');
    }, [listaNEs, ugSelecionada]);

    const rpnpsDashboard = useMemo(() => {
        return filtrarPorUG(listaRPNPs, 'fonteRecurso');
    }, [listaRPNPs, ugSelecionada]);

    const nfsDashboard = useMemo(() => {
        return filtrarPorUG(listaNFs, 'fonteRecurso');
    }, [listaNFs, ugSelecionada]);

    // KPIs calculados
    const kpis = useMemo(() => {
        const totalCreditos = ncsDashboard.reduce((sum, nc) => sum + (nc.valor || 0), 0);
        const totalEmpenhado = nesDashboard.reduce((sum, ne) => sum + (ne.valorAtual || 0), 0);
        const totalRPNP = rpnpsDashboard.reduce((sum, rp) => sum + (rp.valorAtual || 0), 0);
        const totalLiquidado = nfsDashboard
            .filter(nf => nf.status === 'LIQUIDADA')
            .reduce((sum, nf) => sum + (parseFloat(nf.valor) || 0), 0);
        
        const totalEmpenhosGeral = totalEmpenhado + totalRPNP;
        const taxaExecucao = totalCreditos > 0 ? (totalEmpenhosGeral / totalCreditos) * 100 : 0;
        const percentualRPNP = totalEmpenhosGeral > 0 ? (totalRPNP / totalEmpenhosGeral) * 100 : 0;
        const percentualLiquidado = totalEmpenhosGeral > 0 ? (totalLiquidado / totalEmpenhosGeral) * 100 : 0;
        
        return {
            totalCreditos,
            totalEmpenhado,
            totalRPNP,
            totalLiquidado,
            totalEmpenhosGeral,
            taxaExecucao,
            percentualRPNP,
            percentualLiquidado
        };
    }, [ncsDashboard, nesDashboard, rpnpsDashboard, nfsDashboard]);

    // Dados para gráfico de distribuição por UG
    const dadosPorUG = useMemo(() => {
        const valor160 = ncsDashboard
            .filter(nc => nc.fonteRecurso === '160')
            .reduce((sum, nc) => sum + (nc.valor || 0), 0);
        const valor167 = ncsDashboard
            .filter(nc => nc.fonteRecurso === '167')
            .reduce((sum, nc) => sum + (nc.valor || 0), 0);
        return { valor160, valor167 };
    }, [ncsDashboard]);

    // Dados para gráfico de status dos créditos
    const dadosStatus = useMemo(() => {
        const total = kpis.totalCreditos;
        const disponivel = total - kpis.totalEmpenhosGeral;
        return {
            disponivel,
            empenhado: kpis.totalEmpenhosGeral,
            liquidado: kpis.totalLiquidado
        };
    }, [kpis]);

    // Dados para distribuição por detentor
    const dadosPorDetentor = useMemo(() => {
        const detentores = {};
        ncsDashboard.forEach(nc => {
            const detentor = nc.detentor || 'Sem detentor';
            detentores[detentor] = (detentores[detentor] || 0) + (nc.valor || 0);
        });
        return Object.entries(detentores).map(([nome, valor]) => ({ nome, valor }));
    }, [ncsDashboard]);

    // Dados para evolução mensal (últimos 12 meses)
    const evolucaoMensal = useMemo(() => {
        const meses = {};
        const hoje = new Date();
        
        for (let i = 11; i >= 0; i--) {
            const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const key = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
            meses[key] = { mes: key, valor: 0 };
        }
        
        const todosEmpenhos = [...nesDashboard, ...rpnpsDashboard];
        todosEmpenhos.forEach(item => {
            const dataGeracao = item.dataGeracaoNE || item.dataGeracao;
            if (dataGeracao) {
                const data = dataGeracao.split('-');
                const key = `${data[0]}-${data[1]}`;
                if (meses[key]) {
                    meses[key].valor += item.valorAtual || 0;
                }
            }
        });
        
        return Object.values(meses);
    }, [nesDashboard, rpnpsDashboard]);

    // Prazos vencidos
    const prazosVencidos = useMemo(() => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        return ncsDashboard.filter(nc => {
            if (!nc.prazoEmpenho || nc.prazoEmpenho === 'EMPENHO IMEDIATO') return false;
            const dataPrazo = new Date(nc.prazoEmpenho);
            dataPrazo.setHours(0, 0, 0, 0);
            return dataPrazo < hoje && nc.valor > 0;
        }).slice(0, 5);
    }, [ncsDashboard]);

    const formatarMoeda = (valor) => {
        if (typeof valor !== 'number') return 'R$ 0,00';
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatarData = (data) => {
        if (!data) return '-';
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
            {/* Cabeçalho com título e seletor UG */}
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
            
            {/* ABAS PRINCIPAIS */}
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

            {/* CONTEÚDO DAS ABAS - MESMO CÓDIGO ANTERIOR, APENAS REMOVIDO O SELETOR UG DE DENTRO DO DASHBOARD */}
            <div className={styles.reportContent}>
                {/* ABA CRÉDITOS - mesmo código anterior */}
                {abaAtiva === 'creditos' && (
                    <>
                        <div className={styles.filterBar}>
                            <div className={styles.filterGroup}>
                                <label>Nota de Crédito</label>
                                <input type="text" placeholder="Buscar..." value={filtroDocumento} onChange={(e) => setFiltroDocumento(e.target.value)} />
                            </div>
                            <div className={styles.filterGroup}>
                                <label>Detentor</label>
                                <input type="text" placeholder="Buscar..." value={filtroDetentor} onChange={(e) => setFiltroDetentor(e.target.value)} />
                            </div>
                            <div className={styles.filterGroup}>
                                <label>Prazo para Empenho</label>
                                <input type="text" placeholder="Buscar (Ex: 12/2025 ou Imediato)..." value={filtroPrazo} onChange={(e) => setFiltroPrazo(e.target.value)} />
                            </div>
                            <div className={styles.totalTopo}>
                                <div className={styles.totalTopoItem}>
                                    <span>Total em tela (Valor da NC):</span>
                                    <strong>{formatarMoeda(totaisTela.totalValorNC)}</strong>
                                </div>
                                <div className={styles.totalTopoItem}>
                                    <span>Total em tela (Valor Empenhado):</span>
                                    <strong>{formatarMoeda(totaisTela.totalValorEmpenhado)}</strong>
                                </div>
                                <div className={styles.totalTopoItem}>
                                    <span>Total em tela (Valor em Tela):</span>
                                    <strong>{formatarMoeda(totaisTela.totalValorAtual)}</strong>
                                </div>
                            </div>
                        </div>

                        <div className={styles.tableContainer}>
                            <table className={styles.dataTable}>
                                <colgroup>
                                    <col style={{ width: '13%' }} />
                                    <col style={{ width: '20%' }} />
                                    <col style={{ width: '12%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '25%' }} />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th onClick={() => handleOrdenar('nc')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                            Nota de Crédito {getOrdenacaoIcon('nc')}
                                        </th>
                                        <th onClick={() => handleOrdenar('detentor')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                            Detentor {getOrdenacaoIcon('detentor')}
                                        </th>
                                        <th onClick={() => handleOrdenar('prazoEmpenho')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                            Prazo para Empenho {getOrdenacaoIcon('prazoEmpenho')}
                                        </th>
                                        <th onClick={() => handleOrdenar('valorTotal')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                            Valor da NC {getOrdenacaoIcon('valorTotal')}
                                        </th>
                                        <th onClick={() => handleOrdenar('valorEmpenhado')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                            Valor Empenhado {getOrdenacaoIcon('valorEmpenhado')}
                                        </th>
                                        <th onClick={() => handleOrdenar('valorAtual')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                            Valor em Tela {getOrdenacaoIcon('valorAtual')}
                                        </th>
                                        <th style={{ textAlign: 'center' }}>Finalidade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ncsFiltradas.map(nc => {
                                        const valorEmpenhado = calcularValorEmpenhado(nc.id);
                                        const valorAtual = calcularValorAtual(nc);
                                        const prazoVencido = isPrazoVencido(nc.prazoEmpenho);
                                        
                                        return (
                                            <tr key={nc.id}>
                                                <td className={styles.documentoCell} style={{ textAlign: 'center' }}>
                                                    <button 
                                                        className={styles.linkDocumento}
                                                        onClick={() => onVerDetalhesNC && onVerDetalhesNC(nc.id)}
                                                        title="Clique para ver detalhes"
                                                    >
                                                        {nc.nc}
                                                    </button>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>{nc.detentor || '-'}</td>
                                                <td className={prazoVencido ? styles.prazoVencido : ''} style={{ textAlign: 'center' }}>
                                                    {formatarPrazo(nc.prazoEmpenho)}
                                                </td>
                                                <td className={styles.valorCell} style={{ textAlign: 'center' }}>{formatarMoeda(nc.valor)}</td>
                                                <td className={styles.valorCell} style={{ textAlign: 'center' }}>{formatarMoeda(valorEmpenhado)}</td>
                                                <td className={`${styles.valorCell} ${valorAtual === 0 ? styles.zerado : ''}`} style={{ textAlign: 'center' }}>
                                                    {formatarMoeda(valorAtual)}
                                                </td>
                                                <td className={styles.finalidadeCell}>{nc.finalidade}</td>
                                            </tr>
                                        );
                                    })}
                                    {ncsFiltradas.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className={styles.emptyRow} style={{ textAlign: 'center' }}>
                                                Nenhum crédito encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ABA EMPENHOS - mesmo código anterior */}
                {abaAtiva === 'empenhos' && (
                    <>
                        <div className={styles.filterBar}>
                            <div className={styles.filterGroup}>
                                <label>Nº do Empenho</label>
                                <input type="text" placeholder="Buscar..." value={filtroEmpenhoDocumento} onChange={(e) => setFiltroEmpenhoDocumento(e.target.value)} />
                            </div>
                            <div className={styles.filterGroup}>
                                <label>Detentor</label>
                                <input type="text" placeholder="Buscar..." value={filtroEmpenhoDetentor} onChange={(e) => setFiltroEmpenhoDetentor(e.target.value)} />
                            </div>
                            <div className={styles.filterGroup}>
                                <label>Qtd Dias (a partir de)</label>
                                <input type="number" placeholder="Ex: 30" value={filtroEmpenhoQtdDias} onChange={(e) => setFiltroEmpenhoQtdDias(e.target.value)} />
                            </div>
                            <div className={styles.totalTopo}>
                                <div className={styles.totalTopoItem}>
                                    <span>Total em tela (Valor Empenhado):</span>
                                    <strong>{formatarMoeda(totaisEmpenhosTela.totalValorEmpenhado)}</strong>
                                </div>
                                <div className={styles.totalTopoItem}>
                                    <span>Total em tela (Saldo Atual):</span>
                                    <strong>{formatarMoeda(totaisEmpenhosTela.totalSaldoAtual)}</strong>
                                </div>
                            </div>
                        </div>

                        <div className={styles.tableContainer}>
                            <table className={styles.dataTable}>
                                <colgroup>
                                    <col style={{ width: '12%' }} />
                                    <col style={{ width: '12%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '36%' }} />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'center' }}>Nº Empenho</th>
                                        <th style={{ textAlign: 'center' }}>NC Origem</th>
                                        <th style={{ textAlign: 'center' }}>Detentor</th>
                                        <th style={{ textAlign: 'center' }}>Data</th>
                                        <th style={{ textAlign: 'center' }}>Valor Empenhado</th>
                                        <th style={{ textAlign: 'center' }}>Saldo Atual</th>
                                        <th style={{ textAlign: 'center' }}>Observação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {empenhosFiltrados.map(empenho => (
                                        <tr key={empenho.id}>
                                            <td style={{ textAlign: 'center' }}>
                                                <button 
                                                    className={styles.linkDocumento}
                                                    onClick={() => onVerDetalhesNE && onVerDetalhesNE(empenho.id)}
                                                    title="Clique para ver detalhes do empenho"
                                                >
                                                    {empenho.numero}
                                                </button>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button 
                                                    className={styles.linkDocumento}
                                                    onClick={() => onVerDetalhesNC && onVerDetalhesNC(empenho.idNC)}
                                                    title="Clique para ver detalhes da NC"
                                                >
                                                    {empenho.numeroNC}
                                                </button>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>{empenho.detentor}</td>
                                            <td style={{ textAlign: 'center' }}>{formatarData(empenho.dataGeracao)}</td>
                                            <td className={styles.valorCell} style={{ textAlign: 'center' }}>{formatarMoeda(empenho.valorEmpenhado)}</td>
                                            <td className={`${styles.valorCell} ${empenho.saldoAtual === 0 ? styles.zerado : ''}`} style={{ textAlign: 'center' }}>
                                                {formatarMoeda(empenho.saldoAtual)}
                                            </td>
                                            <td className={styles.observacaoCell}>{empenho.observacao}</td>
                                        </tr>
                                    ))}
                                    {empenhosFiltrados.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className={styles.emptyRow} style={{ textAlign: 'center' }}>
                                                Nenhum empenho encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ABA RPNP - mesmo código anterior */}
                {abaAtiva === 'rpnp' && (
                    <>
                        <div className={styles.filterBar}>
                            <div className={styles.filterGroup}>
                                <label>Nº RPNP</label>
                                <input type="text" placeholder="Buscar..." value={filtroEmpenhoDocumento} onChange={(e) => setFiltroEmpenhoDocumento(e.target.value)} />
                            </div>
                            <div className={styles.filterGroup}>
                                <label>Detentor</label>
                                <input type="text" placeholder="Buscar..." value={filtroEmpenhoDetentor} onChange={(e) => setFiltroEmpenhoDetentor(e.target.value)} />
                            </div>
                            <div className={styles.filterGroup}>
                                <label>Qtd Dias (a partir de)</label>
                                <input type="number" placeholder="Ex: 30" value={filtroEmpenhoQtdDias} onChange={(e) => setFiltroEmpenhoQtdDias(e.target.value)} />
                            </div>
                            <div className={styles.totalTopo}>
                                <div className={styles.totalTopoItem}>
                                    <span>Total em tela (Valor):</span>
                                    <strong>{formatarMoeda(totaisRPNPTela.totalValor)}</strong>
                                </div>
                                <div className={styles.totalTopoItem}>
                                    <span>Total em tela (Saldo Atual):</span>
                                    <strong>{formatarMoeda(totaisRPNPTela.totalSaldoAtual)}</strong>
                                </div>
                            </div>
                        </div>

                        <div className={styles.tableContainer}>
                            <table className={styles.dataTable}>
                                <colgroup>
                                    <col style={{ width: '12%' }} />
                                    <col style={{ width: '12%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '36%' }} />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'center' }}>Nº RPNP</th>
                                        <th style={{ textAlign: 'center' }}>NC Origem</th>
                                        <th style={{ textAlign: 'center' }}>Detentor</th>
                                        <th style={{ textAlign: 'center' }}>Data</th>
                                        <th style={{ textAlign: 'center' }}>Valor</th>
                                        <th style={{ textAlign: 'center' }}>Saldo Atual</th>
                                        <th style={{ textAlign: 'center' }}>Observação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rpnpsFiltrados.map(rp => (
                                        <tr key={rp.id}>
                                            <td style={{ textAlign: 'center' }}>
                                                <button 
                                                    className={styles.linkDocumento}
                                                    onClick={() => onVerDetalhesNE && onVerDetalhesNE(rp.id)}
                                                    title="Clique para ver detalhes do RPNP"
                                                >
                                                    {rp.numero}
                                                </button>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button 
                                                    className={styles.linkDocumento}
                                                    onClick={() => onVerDetalhesNC && onVerDetalhesNC(rp.idNC)}
                                                    title="Clique para ver detalhes da NC"
                                                >
                                                    {rp.numeroNC}
                                                </button>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>{rp.detentor}</td>
                                            <td style={{ textAlign: 'center' }}>{formatarData(rp.dataGeracao)}</td>
                                            <td className={styles.valorCell} style={{ textAlign: 'center' }}>{formatarMoeda(rp.valorEmpenhado)}</td>
                                            <td className={`${styles.valorCell} ${rp.saldoAtual === 0 ? styles.zerado : ''}`} style={{ textAlign: 'center' }}>
                                                {formatarMoeda(rp.saldoAtual)}
                                            </td>
                                            <td className={styles.observacaoCell}>{rp.observacao}</td>
                                        </tr>
                                    ))}
                                    {rpnpsFiltrados.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className={styles.emptyRow} style={{ textAlign: 'center' }}>
                                                Nenhum RPNP encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ABA DASHBOARD - sem o seletor UG (já está no cabeçalho) */}
                {abaAtiva === 'dashboard' && (
                    <div className={styles.dashboardContainer}>
                        {/* Cards de KPIs */}
                        <div className={styles.kpiGrid}>
                            <div className={styles.kpiCard}>
                                <div className={styles.kpiIcon}>💰</div>
                                <div className={styles.kpiTitle}>Total de Créditos</div>
                                <div className={styles.kpiValue}>{formatarMoeda(kpis.totalCreditos)}</div>
                            </div>
                            <div className={styles.kpiCard}>
                                <div className={styles.kpiIcon}>📝</div>
                                <div className={styles.kpiTitle}>Total Empenhado</div>
                                <div className={styles.kpiValue}>{formatarMoeda(kpis.totalEmpenhosGeral)}</div>
                            </div>
                            <div className={styles.kpiCard}>
                                <div className={styles.kpiIcon}>✅</div>
                                <div className={styles.kpiTitle}>Total Liquidado</div>
                                <div className={styles.kpiValue}>{formatarMoeda(kpis.totalLiquidado)}</div>
                            </div>
                            <div className={styles.kpiCard}>
                                <div className={styles.kpiIcon}>📊</div>
                                <div className={styles.kpiTitle}>Taxa de Execução</div>
                                <div className={styles.kpiValue}>{kpis.taxaExecucao.toFixed(1)}<small>%</small></div>
                                <div className={styles.executionBar}>
                                    <div className={styles.executionFill} style={{ width: `${Math.min(kpis.taxaExecucao, 100)}%` }}></div>
                                </div>
                            </div>
                            <div className={styles.kpiCard}>
                                <div className={styles.kpiIcon}>🔄</div>
                                <div className={styles.kpiTitle}>RPNP / Liquidado</div>
                                <div className={styles.kpiValue}>{kpis.percentualRPNP.toFixed(1)}<small>%</small> / {kpis.percentualLiquidado.toFixed(1)}<small>%</small></div>
                                <div className={styles.executionBar}>
                                    <div className={styles.executionFill} style={{ width: `${Math.min(kpis.percentualRPNP, 100)}%`, backgroundColor: '#ed8936' }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Gráficos duplos */}
                        <div className={styles.dashboardDoubleGrid}>
                            {/* Distribuição por UG */}
                            <div className={styles.dashboardCard}>
                                <h3>📊 Distribuição por UG</h3>
                                <div className={styles.pieChart}>
                                    {kpis.totalCreditos > 0 ? (
                                        <>
                                            <svg className={styles.pieSvg} viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="40" fill="#e2e8f0" />
                                                <circle cx="50" cy="50" r="40" fill="#2b6cb0" stroke="white" strokeWidth="2" 
                                                    strokeDasharray={`${(dadosPorUG.valor160 / kpis.totalCreditos) * 251} 251`}
                                                    transform="rotate(-90 50 50)" />
                                            </svg>
                                            <div className={styles.pieLegend}>
                                                <div className={styles.legendItem}>
                                                    <div className={styles.legendColor} style={{ backgroundColor: '#2b6cb0' }}></div>
                                                    <span className={styles.legendLabel}>160212</span>
                                                    <span className={styles.legendValue}>{formatarMoeda(dadosPorUG.valor160)}</span>
                                                </div>
                                                <div className={styles.legendItem}>
                                                    <div className={styles.legendColor} style={{ backgroundColor: '#ed8936' }}></div>
                                                    <span className={styles.legendLabel}>167212</span>
                                                    <span className={styles.legendValue}>{formatarMoeda(dadosPorUG.valor167)}</span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <p>Nenhum dado disponível</p>
                                    )}
                                </div>
                            </div>

                            {/* Status dos Créditos */}
                            <div className={styles.dashboardCard}>
                                <h3>📈 Status dos Créditos</h3>
                                <div className={styles.pieChart}>
                                    {kpis.totalCreditos > 0 ? (
                                        <>
                                            <svg className={styles.pieSvg} viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="40" fill="#e2e8f0" />
                                                <circle cx="50" cy="50" r="40" fill="#2f855a" stroke="white" strokeWidth="2" 
                                                    strokeDasharray={`${(dadosStatus.disponivel / kpis.totalCreditos) * 251} 251`}
                                                    transform="rotate(-90 50 50)" />
                                                <circle cx="50" cy="50" r="30" fill="#ed8936" stroke="white" strokeWidth="2" 
                                                    strokeDasharray={`${(dadosStatus.empenhado / kpis.totalCreditos) * 188} 188`}
                                                    transform="rotate(-90 50 50)" />
                                            </svg>
                                            <div className={styles.pieLegend}>
                                                <div className={styles.legendItem}>
                                                    <div className={styles.legendColor} style={{ backgroundColor: '#2f855a' }}></div>
                                                    <span className={styles.legendLabel}>Disponível</span>
                                                    <span className={styles.legendValue}>{formatarMoeda(dadosStatus.disponivel)}</span>
                                                </div>
                                                <div className={styles.legendItem}>
                                                    <div className={styles.legendColor} style={{ backgroundColor: '#ed8936' }}></div>
                                                    <span className={styles.legendLabel}>Empenhado</span>
                                                    <span className={styles.legendValue}>{formatarMoeda(dadosStatus.empenhado)}</span>
                                                </div>
                                                <div className={styles.legendItem}>
                                                    <div className={styles.legendColor} style={{ backgroundColor: '#38a169' }}></div>
                                                    <span className={styles.legendLabel}>Liquidado</span>
                                                    <span className={styles.legendValue}>{formatarMoeda(dadosStatus.liquidado)}</span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <p>Nenhum dado disponível</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Evolução Mensal */}
                        <div className={styles.dashboardCard} style={{ marginBottom: '30px' }}>
                            <h3>📅 Evolução Mensal (Empenhos)</h3>
                            <div className={styles.barChart}>
                                {evolucaoMensal.length > 0 ? (
                                    evolucaoMensal.map((item, index) => {
                                        const maxValor = Math.max(...evolucaoMensal.map(m => m.valor), 1);
                                        const percentual = (item.valor / maxValor) * 100;
                                        return (
                                            <div key={index} className={styles.barItem}>
                                                <div className={styles.barLabel}>
                                                    <span>{item.mes}</span>
                                                    <span>{formatarMoeda(item.valor)}</span>
                                                </div>
                                                <div className={styles.barTrack}>
                                                    <div className={styles.barFill} style={{ width: `${percentual}%` }}>
                                                        {percentual > 20 && `${percentual.toFixed(0)}%`}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p style={{ textAlign: 'center', color: '#a0aec0', padding: '20px' }}>
                                        Nenhum dado disponível
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Distribuição por Detentor e Prazos Vencidos */}
                        <div className={styles.dashboardDoubleGrid}>
                            {/* Distribuição por Detentor */}
                            <div className={styles.dashboardCard}>
                                <h3>🏢 Distribuição por Detentor</h3>
                                <div className={styles.barChart}>
                                    {dadosPorDetentor.length > 0 ? (
                                        dadosPorDetentor.map((item, index) => {
                                            const maxValor = Math.max(...dadosPorDetentor.map(d => d.valor), 1);
                                            const percentual = (item.valor / maxValor) * 100;
                                            return (
                                                <div key={index} className={styles.barItem}>
                                                    <div className={styles.barLabel}>
                                                        <span>{item.nome}</span>
                                                        <span>{formatarMoeda(item.valor)}</span>
                                                    </div>
                                                    <div className={styles.barTrack}>
                                                        <div className={styles.barFill} style={{ width: `${percentual}%`, backgroundColor: '#3182ce' }}>
                                                            {percentual > 20 && `${percentual.toFixed(0)}%`}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p style={{ textAlign: 'center', color: '#a0aec0', padding: '20px' }}>
                                            Nenhum dado disponível
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Prazos Vencidos */}
                            <div className={styles.dashboardCard}>
                                <h3>⚠️ Prazos Vencidos</h3>
                                {prazosVencidos.length > 0 ? (
                                    <table className={styles.vencidosTable}>
                                        <thead>
                                            <tr>
                                                <th>Nota de Crédito</th>
                                                <th>Detentor</th>
                                                <th>Prazo</th>
                                                <th>Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {prazosVencidos.map(nc => (
                                                <tr key={nc.id}>
                                                    <td>
                                                        <button 
                                                            className={styles.linkVencido}
                                                            onClick={() => onVerDetalhesNC && onVerDetalhesNC(nc.id)}
                                                        >
                                                            {nc.nc}
                                                        </button>
                                                    </td>
                                                    <td>{nc.detentor}</td>
                                                    <td>{formatarPrazo(nc.prazoEmpenho)}</td>
                                                    <td>{formatarMoeda(nc.valor)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p style={{ textAlign: 'center', color: '#a0aec0', padding: '20px' }}>
                                        Nenhum prazo vencido
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Relatorio;