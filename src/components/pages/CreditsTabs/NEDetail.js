import { useState, useEffect } from 'react';
import styles from '../../styles/styles_pages/styles_creditsTabs/NEDetail.module.css';
import { BsSave, BsArrowLeftRight } from 'react-icons/bs';

function NEDetail({ idNe, onVoltar, onVerDetalhesNC }) {
    const [dados, setDados] = useState(null);
    const [listaNFs, setListaNFs] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [observacoes, setObservacoes] = useState('');
    const [salvandoObs, setSalvandoObs] = useState(false);
    const [ncOrigem, setNcOrigem] = useState(null);

    const obterTextoEmpenhado = (dataGeracao) => {
        if (!dataGeracao) return "";
        const dataNE = new Date(dataGeracao);
        const dataAtual = new Date();
        dataNE.setHours(0, 0, 0, 0);
        dataAtual.setHours(0, 0, 0, 0);
        const diff = Math.floor((dataAtual - dataNE) / (1000 * 60 * 60 * 24));
        
        if (diff === 0) return "Empenhado hoje";
        return `Empenhado há ${diff} ${diff === 1 ? 'dia' : 'dias'}`;
    };

    // Função para navegar para o detalhamento da NC
    const handleVerNC = () => {
        if (onVerDetalhesNC) {
            // Prioriza a NC de origem direta
            if (ncOrigem && ncOrigem.id) {
                onVerDetalhesNC(ncOrigem.id);
            } 
            // Se for uma transferência, usa o ID da NC original
            else if (ncOrigem && ncOrigem.original && ncOrigem.original.id) {
                onVerDetalhesNC(ncOrigem.original.id);
            }
        }
    };

    useEffect(() => {
        const carregarTudo = async () => {
            try {
                const [resNE, resRPNP, resNF, resNC] = await Promise.all([
                    fetch(`http://localhost:5000/credits_ne/${idNe}`).then(res => res.json()),
                    fetch(`http://localhost:5000/credits_rpnp/${idNe}`).then(res => res.json()),
                    fetch(`http://localhost:5000/credits_nf`).then(res => res.json()),
                    fetch(`http://localhost:5000/credits_nc`).then(res => res.json())
                ]);

                const neData = resNE.id ? resNE : resRPNP;
                const tipo = resNE.id ? 'NE' : 'RPNP';
                
                const ncOrigemData = resNC.find(nc => nc.id === neData.idNcVinculada);
                
                let ncOriginalData = null;
                if (ncOrigemData && ncOrigemData.documentoAnterior) {
                    const resOriginal = await fetch(`http://localhost:5000/credits_nc?codigoUnico=${ncOrigemData.documentoAnterior}`);
                    const originalData = await resOriginal.json();
                    if (originalData.length > 0) {
                        ncOriginalData = originalData[0];
                    }
                }
                
                const nfsVinculadas = Array.isArray(resNF) 
                    ? resNF.filter(nf => nf.idNeVinculada === idNe)
                    : [];

                setDados({ ne: neData, tipo });
                setNcOrigem({
                    ...ncOrigemData,
                    original: ncOriginalData
                });
                setObservacoes(neData.observacoes || '');
                setListaNFs(nfsVinculadas);
                setCarregando(false);
            } catch (err) {
                console.error("Erro ao carregar:", err);
                setCarregando(false);
            }
        };
        if (idNe) carregarTudo();
    }, [idNe]);

    const salvarObservacoes = async () => {
        setSalvandoObs(true);
        
        const agora = new Date();
        const dataAtualizacao = agora.toLocaleDateString('pt-BR') + ' às ' + 
                               agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        try {
            const endpoint = dados?.tipo === 'NE' ? 'credits_ne' : 'credits_rpnp';
            await fetch(`http://localhost:5000/${endpoint}/${idNe}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    observacoes,
                    ultimaAtualizacaoObs: dataAtualizacao 
                })
            });

            setDados(prev => ({
                ...prev,
                ne: { ...prev.ne, ultimaAtualizacaoObs: dataAtualizacao }
            }));

            alert('Observação salva!');
        } catch (err) {
            alert('Erro ao salvar.');
        } finally {
            setSalvandoObs(false);
        }
    };

    if (carregando) return <div className={styles.loader}>Carregando...</div>;
    if (!dados) return <div className={styles.error}>Não encontrado.</div>;

    const valorTotalNe = dados.ne.valorAtual || 0;
    const emLiquidacao = listaNFs.filter(nf => nf.status === 'ENVIADA_LIQUIDACAO').reduce((s, n) => s + (parseFloat(n.valor) || 0), 0);
    const liquidado = listaNFs.filter(nf => nf.status === 'LIQUIDADA').reduce((s, n) => s + (parseFloat(n.valor) || 0), 0);
    const saldoLiquido = valorTotalNe - emLiquidacao - liquidado;

    const formatarMoeda = (valor) => {
        if (typeof valor !== 'number') return 'R$ 0,00';
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <div className={styles.container}>
            <div className={styles.headerActions}>
                <button onClick={onVoltar} className={styles.btnVoltar}>← VOLTAR</button>
                <div className={styles.infoPrincipal}>
                    <h2>{dados.ne.numeroNE}</h2>
                    <p>{obterTextoEmpenhado(dados.ne.dataGeracaoNE)}</p>
                    <span className={styles.tipoBadge}>{dados.tipo}</span>
                </div>
                <div className={styles.buttonGroup}>
                    {ncOrigem && (
                        <button 
                            className={styles.btnDriveNC} 
                            onClick={handleVerNC}
                        >
                            VER NC ORIGEM
                        </button>
                    )}
                    <button className={styles.btnDriveNE} onClick={() => window.open(dados.ne.linkDriveNE, '_blank')}>
                        VER {dados.tipo}
                    </button>
                </div>
            </div>

            <div className={styles.gridDetalhes}>
                <div className={styles.cardInfo}>
                    <h3>Informações Técnicas</h3>
                    <div className={styles.row}><label>NUP:</label><span>{dados.ne.processo || 'N/D'}</span></div>
                    <div className={styles.row}>
                        <label>Fornecedor:</label>
                        <span>{`${dados.ne.cnpjFornecedor || ''} - ${dados.ne.nomeFornecedor || ''}`}</span>
                    </div>
                    <div className={styles.row}><label>OM Aplicada:</label><span>{dados.ne.omAplicacao}</span></div>
                    <div className={styles.row}><label>Material / Item:</label><p>{dados.ne.materialNE}</p></div>
                    <div className={styles.row}><label>Finalidade:</label><p>{dados.ne.finalidade}</p></div>

                    <div className={styles.row}>
                        <div className={styles.labelObsContainer}>
                            <label>Observações:</label>
                            {dados.ne.ultimaAtualizacaoObs && (
                                <span className={styles.dataDestaque}>
                                    {dados.ne.ultimaAtualizacaoObs}
                                </span>
                            )}
                        </div>
                        <div className={styles.obsWrapper}>
                            <textarea 
                                className={styles.textareaObs}
                                value={observacoes} 
                                onChange={(e) => setObservacoes(e.target.value)}
                                placeholder="Clique para adicionar notas..."
                            />
                            <button 
                                onClick={salvarObservacoes} 
                                className={styles.btnIconSave}
                                title="Salvar Observação"
                                disabled={salvandoObs}
                            >
                                <BsSave />
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.cardFinanceiro}>
                    <h3>Fluxo de Saldos</h3>
                    <div className={styles.metric}>
                        <label>Valor Total {dados.tipo}</label>
                        <span className={styles.valPadrao}>{formatarMoeda(valorTotalNe)}</span>
                    </div>
                    <div className={styles.metric}>
                        <label>Total em Liquidação</label>
                        <span className={styles.valAlerta}>{formatarMoeda(emLiquidacao)}</span>
                    </div>
                    <div className={styles.metric}>
                        <label>Total Liquidado</label>
                        <span className={styles.valAlerta}>{formatarMoeda(liquidado)}</span>
                    </div>
                    <div className={styles.metricHighlight}>
                        <label>SALDO ATUAL LÍQUIDO</label>
                        <span className={styles.valSaldo}>{formatarMoeda(saldoLiquido)}</span>
                    </div>
                </div>
            </div>

            <div className={styles.tabelaContainer}>
                <h3>Notas Fiscais Vinculadas</h3>
                <table className={styles.tabelaNF}>
                    <thead>
                        <tr>
                            <th>Nº Nota Fiscal</th>
                            <th>Valor Bruto</th>
                            <th>Status Fluxo</th>
                            <th>Documento</th>
                        </tr>
                    </thead>
                    <tbody>
                        {listaNFs.map(nf => (
                            <tr key={nf.id}>
                                <td>{nf.numeroNF}</td>
                                <td>{formatarMoeda(parseFloat(nf.valor))}</td>
                                <td>
                                    <span className={`${styles.badgeStatus} ${styles[nf.status]}`}>
                                        {nf.status ? nf.status.replace('_', ' ') : 'NAO_ENVIADA'}
                                    </span>
                                </td>
                                <td>
                                    <button 
                                        className={styles.btnTabela} 
                                        onClick={() => nf.linkDriveNF && window.open(nf.linkDriveNF, '_blank')}
                                    >
                                        VISUALIZAR PDF
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {listaNFs.length === 0 && (
                            <tr>
                                <td colSpan="4" className={styles.emptyRow}>
                                    Nenhuma Nota Fiscal vinculada a este {dados.tipo}.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default NEDetail;