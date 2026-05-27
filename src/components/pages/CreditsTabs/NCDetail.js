import React, { useState, useEffect } from 'react';
import styles from '../../styles/styles_pages/styles_creditsTabs/NCDetail.module.css';
import { BsArrowLeft, BsArrowLeftRight } from 'react-icons/bs';

function NCDetail({ idNc, onVoltar, onVerDetalhesNE }) {
    const [dados, setDados] = useState(null);
    const [carregando, setCarregando] = useState(true);

    const buscarArvoreTransferencias = async (codigoUnico, listaTransferencias = []) => {
        const response = await fetch(`http://localhost:5000/credits_nc?documentoAnterior=${codigoUnico}`);
        const transferencias = await response.json();
        
        for (const transferencia of transferencias) {
            listaTransferencias.push(transferencia);
            await buscarArvoreTransferencias(transferencia.codigoUnico, listaTransferencias);
        }
        
        return listaTransferencias;
    };

    const buscarEmpenhosDasNCs = async (idsNCs) => {
        if (idsNCs.length === 0) return [];
        
        const response = await fetch('http://localhost:5000/credits_ne');
        const nes = await response.json();
        
        const responseRPNP = await fetch('http://localhost:5000/credits_rpnp');
        const rpnps = await responseRPNP.json();
        
        const todosEmpenhos = [...nes, ...rpnps];
        
        return todosEmpenhos.filter(empenho => idsNCs.includes(empenho.idNcVinculada));
    };

    const buscarNFsDosEmpenhos = async (idsEmpenhos) => {
        if (idsEmpenhos.length === 0) return [];
        
        const response = await fetch('http://localhost:5000/credits_nf');
        const nfs = await response.json();
        
        return nfs.filter(nf => idsEmpenhos.includes(nf.idNeVinculada));
    };

    useEffect(() => {
        const carregarDadosCompletos = async () => {
            try {
                setCarregando(true);
                
                const resNC = await fetch(`http://localhost:5000/credits_nc/${idNc}`);
                const ncAtual = await resNC.json();
                
                if (!ncAtual || !ncAtual.id) {
                    setCarregando(false);
                    return;
                }
                
                let ncPrincipal = ncAtual;
                let currentNC = ncAtual;
                
                while (currentNC.documentoAnterior) {
                    const resOriginal = await fetch(`http://localhost:5000/credits_nc?codigoUnico=${currentNC.documentoAnterior}`);
                    const originalData = await resOriginal.json();
                    if (originalData.length > 0) {
                        ncPrincipal = originalData[0];
                        currentNC = originalData[0];
                    } else {
                        break;
                    }
                }
                
                const todasTransferencias = await buscarArvoreTransferencias(ncPrincipal.codigoUnico);
                const idsTodasNCs = [ncPrincipal.id, ...todasTransferencias.map(t => t.id)];
                const todosEmpenhos = await buscarEmpenhosDasNCs(idsTodasNCs);
                const idsEmpenhos = todosEmpenhos.map(e => e.id);
                const todasNFs = await buscarNFsDosEmpenhos(idsEmpenhos);
                
                const empenhosProcessados = todosEmpenhos.map((empenho) => {
                    const nfsDoEmpenho = todasNFs.filter(nf => nf.idNeVinculada === empenho.id);
                    const totalLiquidado = nfsDoEmpenho
                        .filter(nf => nf.status === 'LIQUIDADA')
                        .reduce((sum, nf) => sum + (parseFloat(nf.valor) || 0), 0);
                    const totalEmLiquidacao = nfsDoEmpenho
                        .filter(nf => nf.status === 'ENVIADA_LIQUIDACAO')
                        .reduce((sum, nf) => sum + (parseFloat(nf.valor) || 0), 0);
                    const saldoAtual = (empenho.valorAtual || 0) - totalLiquidado - totalEmLiquidacao;
                    
                    const ncOrigem = [...[ncPrincipal], ...todasTransferencias].find(nc => nc.id === empenho.idNcVinculada);
                    
                    return {
                        id: empenho.id,
                        tipo: 'NE',
                        numero: empenho.numeroNE,
                        ncOrigemNumero: ncOrigem?.nc || 'N/A',
                        ncOrigemId: ncOrigem?.id,
                        detentor: ncOrigem?.detentor || '-',
                        valorEmpenhado: empenho.valorAtual || 0,
                        saldoAtual: saldoAtual,
                        dataGeracao: empenho.dataGeracaoNE,
                        finalidade: empenho.finalidade,
                        material: empenho.materialNE,
                        fornecedor: empenho.nomeFornecedor,
                        nfs: nfsDoEmpenho.map(nf => ({
                            id: nf.id,
                            numero: nf.numeroNF,
                            valor: parseFloat(nf.valor) || 0,
                            situacao: nf.status === 'LIQUIDADA' ? 'Liquidada' : (nf.status === 'ENVIADA_LIQUIDACAO' ? 'Em Liquidação' : 'Não Enviada'),
                            link: nf.linkDriveNF
                        }))
                    };
                });
                
                setDados({
                    ncAtual,
                    ncPrincipal,
                    transferencias: todasTransferencias,
                    empenhos: empenhosProcessados,
                    valorTotalOriginal: ncPrincipal.valorOriginal,
                    totalTransferido: ncPrincipal.totalTransferido,
                    totalEmpenhado: ncPrincipal.totalEmpenhado,
                    totalLiquidado: ncPrincipal.totalLiquidado,
                    saldoDisponivel: ncPrincipal.saldoDisponivel,
                    ehTransferencia: !!ncAtual.documentoAnterior
                });
                
                setCarregando(false);
            } catch (err) {
                console.error("Erro ao carregar dados:", err);
                setCarregando(false);
            }
        };
        
        if (idNc) {
            carregarDadosCompletos();
        }
    }, [idNc]);

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

    const formatarPrazo = (prazo) => {
        if (!prazo) return 'Não informado';
        if (prazo === 'EMPENHO IMEDIATO') return 'Imediato';
        const partes = prazo.split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return prazo;
    };

    const getSituacaoCor = (situacao) => {
        switch (situacao) {
            case 'Liquidada': return styles.situacaoLiquidada;
            case 'Em Liquidação': return styles.situacaoEmLiquidacao;
            default: return styles.situacaoNaoEnviada;
        }
    };

    if (carregando) {
        return <div className={styles.loader}>Carregando dados completos da NC...</div>;
    }

    if (!dados || !dados.ncPrincipal) {
        return <div className={styles.error}>Nota de Crédito não encontrada.</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.headerActions}>
                <button onClick={onVoltar} className={styles.btnVoltar}>
                    <BsArrowLeft /> VOLTAR
                </button>
                <div className={styles.infoPrincipal}>
                    <h2>{dados.ncAtual?.nc || dados.ncPrincipal.nc}</h2>
                    <p>Código: {dados.ncAtual?.codigoUnico || dados.ncPrincipal.codigoUnico}</p>
                    {dados.ehTransferencia && (
                        <span className={styles.badgeTransferencia}>
                            <BsArrowLeftRight /> Crédito Transferido
                        </span>
                    )}
                </div>
                <div className={styles.buttonGroup}>
                    <button className={styles.btnDrive} onClick={() => window.open(dados.ncPrincipal.linkDrive, '_blank')}>
                        VER DOCUMENTO NC PRINCIPAL
                    </button>
                </div>
            </div>

            {(dados.transferencias.length > 0 || dados.ncAtual.documentoAnterior) && (
                <div className={styles.rastroContainer}>
                    <h3>📋 ÁRVORE COMPLETA DO CRÉDITO</h3>
                    <div className={styles.arvoreWrapper}>
                        <div className={styles.arvoreLinha}>
                            <div className={styles.arvoreNode}>
                                <div className={styles.arvoreNodeOrigem}>
                                    <span className={styles.arvoreLabel}>ORIGEM (RAIZ)</span>
                                    <strong>{dados.ncPrincipal.nc}</strong>
                                    <span className={styles.arvoreDetalhe}>
                                        {dados.ncPrincipal.detentor} | {formatarMoeda(dados.ncPrincipal.valorOriginal)}
                                    </span>
                                    <span className={styles.arvoreCodigo}>{dados.ncPrincipal.codigoUnico}</span>
                                </div>
                            </div>

                            {dados.transferencias.map((transferencia, index) => (
                                <div key={transferencia.id} className={styles.arvoreNode}>
                                    <div className={styles.arvoreSeta}>→</div>
                                    <div className={`${styles.arvoreNodeDestino} ${transferencia.id === dados.ncAtual?.id ? styles.arvoreNodeAtual : ''}`}>
                                        <span className={styles.arvoreLabel}>
                                            {transferencia.id === dados.ncAtual?.id ? 'ATUAL' : `TRANSFERÊNCIA ${index + 1}`}
                                        </span>
                                        <strong>{transferencia.nc}</strong>
                                        <span className={styles.arvoreDetalhe}>
                                            {transferencia.detentor} | {formatarMoeda(transferencia.valorOriginal)}
                                        </span>
                                        <span className={styles.arvoreCodigo}>{transferencia.codigoUnico}</span>
                                        {transferencia.statusRecebimento === 'PENDENTE' && (
                                            <span className={styles.badgePendente}>Aguardando Recebimento</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.gridDetalhes}>
                <div className={styles.cardInfo}>
                    <h3>Informações Técnicas</h3>
                    <div className={styles.row}>
                        <label>Detentor Original:</label>
                        <span>{dados.ncPrincipal.detentorOriginal}</span>
                    </div>
                    <div className={styles.row}>
                        <label>Fonte de Recurso:</label>
                        <span>{dados.ncPrincipal.fonteRecurso === '160' ? '160212' : '167212'}</span>
                    </div>
                    <div className={styles.row}>
                        <label>Prazo para Empenho:</label>
                        <span className={dados.ncPrincipal.prazoEmpenho === 'EMPENHO IMEDIATO' ? styles.prazoImediato : ''}>
                            {formatarPrazo(dados.ncPrincipal.prazoEmpenho)}
                        </span>
                    </div>
                    <div className={styles.row}>
                        <label>Finalidade:</label>
                        <p className={styles.finalidadeTexto}>{dados.ncPrincipal.finalidade}</p>
                    </div>
                </div>

                <div className={styles.cardFinanceiro}>
                    <h3>Fluxo Financeiro Consolidado</h3>
                    <div className={styles.metric}>
                        <label>Valor Total Original da NC</label>
                        <span className={styles.valPadrao}>{formatarMoeda(dados.valorTotalOriginal)}</span>
                    </div>
                    {dados.totalTransferido > 0 && (
                        <div className={styles.metric}>
                            <label className={styles.distribuicaoLabel}>Total Transferido</label>
                            <span className={styles.valAlerta}>{formatarMoeda(dados.totalTransferido)}</span>
                        </div>
                    )}
                    {dados.totalEmpenhado > 0 && (
                        <div className={styles.metric}>
                            <label>Total Empenhado</label>
                            <span className={styles.valAlerta}>{formatarMoeda(dados.totalEmpenhado)}</span>
                        </div>
                    )}
                    {dados.totalLiquidado > 0 && (
                        <div className={styles.metric}>
                            <label>Total Liquidado</label>
                            <span className={styles.valAlerta}>{formatarMoeda(dados.totalLiquidado)}</span>
                        </div>
                    )}
                    <div className={styles.metricHighlight}>
                        <label>SALDO DISPONÍVEL GERAL</label>
                        <span className={styles.valSaldo}>{formatarMoeda(dados.saldoDisponivel)}</span>
                    </div>
                </div>
            </div>

            <div className={styles.empenhosContainer}>
                <h3>Relatório de Empenhos Gerados ({dados.empenhos.length})</h3>
                <div className={styles.empenhosTableWrapper}>
                    <table className={styles.empenhosTable}>
                        <thead>
                            <tr>
                                <th>Tipo</th>
                                <th>Nº Documento</th>
                                <th>NC Origem</th>
                                <th>Detentor</th>
                                <th>Valor</th>
                                <th>Saldo Atual</th>
                                <th>Data</th>
                                <th>Fornecedor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dados.empenhos.map(empenho => (
                                <React.Fragment key={empenho.id}>
                                    <tr className={styles.empenhoRow}>
                                        <td>
                                            <span className={`${styles.tipoBadge} ${empenho.tipo === 'RPNP' ? styles.tipoRPNP : styles.tipoNE}`}>
                                                {empenho.tipo}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                className={styles.linkNE}
                                                onClick={() => onVerDetalhesNE && onVerDetalhesNE(empenho.id)}
                                            >
                                                {empenho.numero}
                                            </button>
                                        </td>
                                        <td>
                                            <button 
                                                className={styles.linkNC}
                                                onClick={() => window.location.reload()}
                                            >
                                                {empenho.ncOrigemNumero}
                                            </button>
                                        </td>
                                        <td>{empenho.detentor}</td>
                                        <td className={styles.valorCell}>{formatarMoeda(empenho.valorEmpenhado)}</td>
                                        <td className={`${styles.valorCell} ${empenho.saldoAtual === 0 ? styles.zerado : ''}`}>
                                            {formatarMoeda(empenho.saldoAtual)}
                                        </td>
                                        <td>{formatarData(empenho.dataGeracao)}</td>
                                        <td className={styles.fornecedorCell}>{empenho.fornecedor}</td>
                                    </tr>
                                    {empenho.nfs.length > 0 && (
                                        <tr className={styles.nfsSubRow}>
                                            <td colSpan="8">
                                                <div className={styles.nfsContainer}>
                                                    <div className={styles.nfsHeader}>
                                                        <span>📄 Notas Fiscais Vinculadas ({empenho.nfs.length})</span>
                                                    </div>
                                                    <table className={styles.nfsTable}>
                                                        <thead>
                                                            <tr>
                                                                <th>Nº NF</th>
                                                                <th>Valor</th>
                                                                <th>Situação</th>
                                                                <th>Documento</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {empenho.nfs.map(nf => (
                                                                <tr key={nf.id}>
                                                                    <td>{nf.numero}</td>
                                                                    <td className={styles.valorCell}>{formatarMoeda(nf.valor)}</td>
                                                                    <td>
                                                                        <span className={`${styles.situacaoBadge} ${getSituacaoCor(nf.situacao)}`}>
                                                                            {nf.situacao}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        {nf.link && (
                                                                            <button 
                                                                                className={styles.btnTabela}
                                                                                onClick={() => window.open(nf.link, '_blank')}
                                                                            >
                                                                                Ver NF
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                            {dados.empenhos.length === 0 && (
                                <tr>
                                    <td colSpan="8" className={styles.emptyRow}>
                                        Nenhum empenho gerado para esta árvore de créditos.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default NCDetail;