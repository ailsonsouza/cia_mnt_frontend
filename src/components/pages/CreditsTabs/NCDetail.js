import { useState, useEffect } from 'react';
import styles from '../../styles/styles_pages/styles_creditsTabs/NCDetail.module.css';
import { BsArrowLeft, BsPencil, BsSave, BsInfoCircle, BsEye, BsArrowReturnLeft, BsArrowLeftRight } from 'react-icons/bs';
import { useAuth } from '../../context/AuthContext';

function NCDetail({ idNc, onVoltar, onVerDetalhesNE }) {
    const { usuarioAtual } = useAuth();
    const [dados, setDados] = useState(null);
    const [empenhos, setEmpenhos] = useState([]);
    const [nfsPorEmpenho, setNfsPorEmpenho] = useState({});
    const [transferencias, setTransferencias] = useState([]); // NOVO: transferências realizadas
    const [ncOriginal, setNcOriginal] = useState(null); // NOVO: NC original (se for transferida)
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        const carregarDados = async () => {
            try {
                setCarregando(true);
                
                const resNC = await fetch(`http://localhost:5000/credits_nc/${idNc}`);
                const ncData = await resNC.json();
                
                if (!ncData || !ncData.id) {
                    setCarregando(false);
                    return;
                }
                
                // 1. Buscar NC ORIGINAL (se esta for transferida)
                let ncOriginalData = null;
                if (ncData.documentoAnterior) {
                    const resOriginal = await fetch(`http://localhost:5000/credits_nc?codigoUnico=${ncData.documentoAnterior}`);
                    const originalData = await resOriginal.json();
                    if (originalData.length > 0) {
                        ncOriginalData = originalData[0];
                    }
                }
                
                // 2. Buscar TRANSFERÊNCIAS realizadas a partir desta NC
                const resTransferencias = await fetch(`http://localhost:5000/credits_nc?documentoAnterior=${ncData.codigoUnico}`);
                const transferenciasData = await resTransferencias.json();
                
                // 3. Buscar EMPENHOS vinculados a esta NC
                const resNEs = await fetch(`http://localhost:5000/credits_ne?idNcVinculada=${idNc}`);
                const nesData = await resNEs.json();
                
                // 4. Buscar NFs
                const resNFs = await fetch('http://localhost:5000/credits_nf');
                const nfsData = await resNFs.json();
                
                // 5. Buscar RPNPs (para caso haja)
                const resRPNPs = await fetch('http://localhost:5000/credits_rpnp');
                const rpnpsData = await resRPNPs.json();
                
                // Organizar NFs por empenho
                const nfsPorEmpenhoMap = {};
                [...nesData, ...rpnpsData].forEach(doc => {
                    nfsPorEmpenhoMap[doc.id] = nfsData.filter(nf => nf.idNeVinculada === doc.id);
                });
                
                // Calcular totais
                const valorTransferido = transferenciasData.reduce((sum, t) => sum + (t.valor || 0), 0);
                const valorEmpenhado = nesData.reduce((sum, ne) => sum + (ne.valorAtual || 0), 0) +
                                       rpnpsData.reduce((sum, rp) => sum + (rp.valorAtual || 0), 0);
                const valorDisponivel = (ncData.valor || 0) - valorTransferido - valorEmpenhado;
                
                // Processar empenhos com informações completas
                const empenhosProcessados = await Promise.all(nesData.map(async (ne) => {
                    const nfsDoEmpenho = nfsData.filter(nf => nf.idNeVinculada === ne.id);
                    const totalLiquidado = nfsDoEmpenho.reduce((sum, nf) => sum + (parseFloat(nf.valor) || 0), 0);
                    const saldoAtual = (ne.valorAtual || 0) - totalLiquidado;
                    
                    return {
                        id: ne.id,
                        tipo: 'NE',
                        numero: ne.numeroNE,
                        detentor: ncData.detentor,
                        valorEmpenhado: ne.valorAtual || 0,
                        saldoAtual: saldoAtual,
                        dataGeracao: ne.dataGeracaoNE,
                        finalidade: ne.finalidade,
                        nfs: nfsDoEmpenho.map(nf => ({
                            id: nf.id,
                            numero: nf.numeroNF,
                            valor: parseFloat(nf.valor) || 0,
                            situacao: nf.status === 'LIQUIDADA' ? 'Liquidada' : (nf.status === 'ENVIADA_LIQUIDACAO' ? 'Em Liquidação' : 'Não Enviada')
                        }))
                    };
                }));
                
                // Processar RPNPs
                const rpnpsProcessados = rpnpsData.map(rp => {
                    const nfsDoRpnp = nfsData.filter(nf => nf.idNeVinculada === rp.id);
                    const totalLiquidado = nfsDoRpnp.reduce((sum, nf) => sum + (parseFloat(nf.valor) || 0), 0);
                    const saldoAtual = (rp.valorAtual || 0) - totalLiquidado;
                    
                    return {
                        id: rp.id,
                        tipo: 'RPNP',
                        numero: rp.numeroNE,
                        detentor: ncData.detentor,
                        valorEmpenhado: rp.valorAtual || 0,
                        saldoAtual: saldoAtual,
                        dataGeracao: rp.dataGeracaoNE,
                        finalidade: rp.finalidade,
                        nfs: nfsDoRpnp.map(nf => ({
                            id: nf.id,
                            numero: nf.numeroNF,
                            valor: parseFloat(nf.valor) || 0,
                            situacao: nf.status === 'LIQUIDADA' ? 'Liquidada' : (nf.status === 'ENVIADA_LIQUIDACAO' ? 'Em Liquidação' : 'Não Enviada')
                        }))
                    };
                });
                
                setDados({
                    ...ncData,
                    valorTransferido,
                    valorEmpenhado,
                    valorDisponivel,
                    ehTransferencia: !!ncData.documentoAnterior
                });
                
                setNcOriginal(ncOriginalData);
                setTransferencias(transferenciasData);
                setEmpenhos([...empenhosProcessados, ...rpnpsProcessados]);
                setCarregando(false);
            } catch (err) {
                console.error("Erro ao carregar dados:", err);
                setCarregando(false);
            }
        };
        
        if (idNc) {
            carregarDados();
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
        return <div className={styles.loader}>Carregando...</div>;
    }

    if (!dados) {
        return <div className={styles.error}>Nota de Crédito não encontrada.</div>;
    }

    return (
        <div className={styles.container}>
            {/* Cabeçalho com botão voltar */}
            <div className={styles.headerActions}>
                <button onClick={onVoltar} className={styles.btnVoltar}>
                    <BsArrowLeft /> VOLTAR
                </button>
                <div className={styles.infoPrincipal}>
                    <h2>{dados.nc}</h2>
                    <p>Código: {dados.codigoUnico}</p>
                    {dados.ehTransferencia && (
                        <span className={styles.badgeTransferencia}>
                            <BsArrowLeftRight /> Crédito Transferido
                        </span>
                    )}
                </div>
                <div className={styles.buttonGroup}>
                    <button className={styles.btnDrive} onClick={() => window.open(dados.linkDrive, '_blank')}>
                        VER DOCUMENTO NC
                    </button>
                </div>
            </div>

            {/* RASTRO DE TRANSFERÊNCIAS - NOVO */}
            {(ncOriginal || transferencias.length > 0) && (
                <div className={styles.rastroContainer}>
                    <h3>📋 RASTRO DO CRÉDITO</h3>
                    <div className={styles.rastroLinha}>
                        {ncOriginal && (
                            <div className={styles.rastroItem}>
                                <div className={styles.rastroOrigem}>
                                    <span className={styles.rastroLabel}>ORIGEM</span>
                                    <button 
                                        className={styles.linkRastro}
                                        onClick={() => window.location.reload()} // Idealmente navegar para a NC original
                                    >
                                        {ncOriginal.nc}
                                    </button>
                                    <span className={styles.rastroDetalhe}>
                                        {ncOriginal.detentor} | {formatarMoeda(ncOriginal.valor)}
                                    </span>
                                </div>
                                <div className={styles.rastroSeta}>→</div>
                            </div>
                        )}
                        
                        <div className={styles.rastroItem}>
                            <div className={styles.rastroAtual}>
                                <span className={styles.rastroLabel}>ATUAL</span>
                                <strong>{dados.nc}</strong>
                                <span className={styles.rastroDetalhe}>
                                    {dados.detentor} | {formatarMoeda(dados.valor)}
                                </span>
                            </div>
                        </div>

                        {transferencias.length > 0 && (
                            <>
                                <div className={styles.rastroSeta}>→</div>
                                <div className={styles.rastroItem}>
                                    <div className={styles.rastroDestino}>
                                        <span className={styles.rastroLabel}>TRANSFERÊNCIAS</span>
                                        {transferencias.map(t => (
                                            <div key={t.id} className={styles.rastroTransferencia}>
                                                <button className={styles.linkRastro}>
                                                    {t.nc}
                                                </button>
                                                <span>{t.detentor} | {formatarMoeda(t.valor)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Grid de informações técnicas e fluxo de distribuição */}
            <div className={styles.gridDetalhes}>
                <div className={styles.cardInfo}>
                    <h3>Informações Técnicas</h3>
                    <div className={styles.row}>
                        <label>Detentor Original:</label>
                        <span>{ncOriginal ? ncOriginal.detentor : dados.detentor}</span>
                    </div>
                    <div className={styles.row}>
                        <label>Fonte de Recurso:</label>
                        <span>{dados.fonteRecurso === '160' ? '160212' : '167212'}</span>
                    </div>
                    <div className={styles.row}>
                        <label>Prazo para Empenho:</label>
                        <span className={dados.prazoEmpenho === 'EMPENHO IMEDIATO' ? styles.prazoImediato : ''}>
                            {formatarPrazo(dados.prazoEmpenho)}
                        </span>
                    </div>
                    <div className={styles.row}>
                        <label>Finalidade:</label>
                        <p className={styles.finalidadeTexto}>{dados.finalidade}</p>
                    </div>
                </div>

                <div className={styles.cardFinanceiro}>
                    <h3>Fluxo Financeiro</h3>
                    <div className={styles.metric}>
                        <label>Valor Total da NC</label>
                        <span className={styles.valPadrao}>{formatarMoeda(dados.valor + dados.valorTransferido + dados.valorEmpenhado)}</span>
                    </div>
                    {ncOriginal && (
                        <div className={styles.metric}>
                            <label>Valor Original</label>
                            <span>{formatarMoeda(ncOriginal.valor)}</span>
                        </div>
                    )}
                    {dados.valorTransferido > 0 && (
                        <div className={styles.metric}>
                            <label className={styles.distribuicaoLabel}>Transferido</label>
                            <span className={styles.valAlerta}>{formatarMoeda(dados.valorTransferido)}</span>
                        </div>
                    )}
                    {dados.valorEmpenhado > 0 && (
                        <div className={styles.metric}>
                            <label>Empenhado</label>
                            <span className={styles.valAlerta}>{formatarMoeda(dados.valorEmpenhado)}</span>
                        </div>
                    )}
                    <div className={styles.metricHighlight}>
                        <label>SALDO DISPONÍVEL</label>
                        <span className={styles.valSaldo}>{formatarMoeda(dados.valorDisponivel)}</span>
                    </div>
                </div>
            </div>

            {/* Relatório de Empenhos Gerados */}
            <div className={styles.empenhosContainer}>
                <h3>Relatório de Empenhos Gerados</h3>
                <div className={styles.empenhosTableWrapper}>
                    <table className={styles.empenhosTable}>
                        <thead>
                            <tr>
                                <th>Tipo</th>
                                <th>Nº Documento</th>
                                <th>Detentor</th>
                                <th>Valor</th>
                                <th>Saldo Atual</th>
                                <th>Data</th>
                                <th>Finalidade</th>
                            </tr>
                        </thead>
                        <tbody>
                            {empenhos.map(empenho => (
                                <>
                                    <tr key={empenho.id} className={styles.empenhoRow}>
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
                                        <td>{empenho.detentor}</td>
                                        <td className={styles.valorCell}>{formatarMoeda(empenho.valorEmpenhado)}</td>
                                        <td className={`${styles.valorCell} ${empenho.saldoAtual === 0 ? styles.zerado : ''}`}>
                                            {formatarMoeda(empenho.saldoAtual)}
                                        </td>
                                        <td>{formatarData(empenho.dataGeracao)}</td>
                                        <td className={styles.finalidadeCell}>{empenho.finalidade}</td>
                                    </tr>
                                    {/* NFs relacionadas */}
                                    {empenho.nfs.length > 0 && (
                                        <tr className={styles.nfsSubRow}>
                                            <td colSpan="7">
                                                <div className={styles.nfsContainer}>
                                                    <div className={styles.nfsHeader}>
                                                        <span>📄 Notas Fiscais Vinculadas</span>
                                                    </div>
                                                    <table className={styles.nfsTable}>
                                                        <thead>
                                                            <tr>
                                                                <th>Nº NF</th>
                                                                <th>Valor</th>
                                                                <th>Situação</th>
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
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                            {empenhos.length === 0 && (
                                <tr>
                                    <td colSpan="7" className={styles.emptyRow}>
                                        Nenhum empenho gerado para esta Nota de Crédito.
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