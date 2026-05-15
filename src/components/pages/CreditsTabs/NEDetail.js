import { useState, useEffect } from 'react';
import styles from '../../styles/styles_pages/styles_creditsTabs/NEDetail.module.css';
import { BsSave } from 'react-icons/bs';

function NEDetail({ idNe, onVoltar }) {
    const [dados, setDados] = useState(null);
    const [listaNFs, setListaNFs] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [observacoes, setObservacoes] = useState('');
    const [salvandoObs, setSalvandoObs] = useState(false);

    const obterTextoEmpenhado = (dataGeracao) => {
        if (!dataGeracao) return "DETALHAMENTO TÉCNICO E FLUXO DE LIQUIDAÇÃO";
        const dataNE = new Date(dataGeracao);
        const dataAtual = new Date();
        dataNE.setHours(0, 0, 0, 0);
        dataAtual.setHours(0, 0, 0, 0);
        const diff = Math.floor((dataAtual - dataNE) / (1000 * 60 * 60 * 24));
        
        if (diff === 0) return "Empenhado hoje";
        return `Empenhado há ${diff} ${diff === 1 ? 'dia' : 'dias'}`;
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
                const ncOrigem = resNC.find(nc => nc.id === neData.idNcVinculada) || neData;
                const nfsVinculadas = resNF.filter(nf => nf.idNeVinculada === idNe);

                setDados({ ne: neData, nc: ncOrigem, tipo: resNE.id ? 'credits_ne' : 'credits_rpnp' });
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
        
        // Gerando o carimbo de data e hora
        const agora = new Date();
        const dataAtualizacao = agora.toLocaleDateString('pt-BR') + ' às ' + 
                               agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        try {
            await fetch(`http://localhost:5000/${dados.tipo}/${idNe}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    observacoes,
                    ultimaAtualizacaoObs: dataAtualizacao 
                })
            });

            // Atualiza o estado local para exibir a data imediatamente
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

    const valorTotalNe = dados.ne.valorAtual || dados.nc?.valor || 0;
    const emLiquidacao = listaNFs.filter(nf => nf.status === 'ENVIADA_LIQUIDACAO').reduce((s, n) => s + (parseFloat(n.valor) || 0), 0);
    const liquidado = listaNFs.filter(nf => nf.status === 'LIQUIDADA').reduce((s, n) => s + (parseFloat(n.valor) || 0), 0);
    const saldoLiquido = valorTotalNe - emLiquidacao - liquidado;

    return (
        <div className={styles.container}>
            <div className={styles.headerActions}>
                <button onClick={onVoltar} className={styles.btnVoltar}>← VOLTAR</button>
                <div className={styles.infoPrincipal}>
                    <h2>{dados.ne.numeroNE}</h2>
                    <p>{obterTextoEmpenhado(dados.ne.dataGeracaoNE)}</p>
                </div>
                <div className={styles.buttonGroup}>
                    <button className={styles.btnDriveNC} onClick={() => window.open(dados.nc?.linkDrive || dados.ne.linkDrive, '_blank')}>VER NC</button>
                    <button className={styles.btnDriveNE} onClick={() => window.open(dados.ne.linkDriveNE, '_blank')}>VER NE</button>
                </div>
            </div>

            <div className={styles.gridDetalhes}>
                <div className={styles.cardInfo}>
                    <h3>Informações Técnicas</h3>
                    <div className={styles.row}><label>NUP:</label><span>{dados.nc?.processo || 'N/D'}</span></div>
                    <div className={styles.row}>
                        <label>Fornecedor:</label>
                        <span>{`${dados.ne.cnpjFornecedor} - ${dados.ne.nomeFornecedor}`}</span>
                    </div>
                    <div className={styles.row}><label>OM Aplicada:</label><span>{dados.nc?.omAplicacao}</span></div>
                    <div className={styles.row}><label>Material / Item:</label><p>{dados.ne.materialNE}</p></div>
                    <div className={styles.row}><label>Finalidade:</label><p>{dados.nc?.finalidade}</p></div>

                    {/* Observações com carimbo de data atualizado */}
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
                    <div className={styles.metric}><label>Valor Total Empenhado</label><span className={styles.valPadrao}>{valorTotalNe.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</span></div>
                    <div className={styles.metric}><label>Total em Liquidação</label><span className={styles.valAlerta}>{emLiquidacao.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</span></div>
                    <div className={styles.metric}><label>Total Liquidado</label><span className={styles.valAlerta}>{liquidado.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</span></div>
                    <div className={styles.metricHighlight}><label>SALDO ATUAL LÍQUIDO</label><span className={styles.valSaldo}>{saldoLiquido.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</span></div>
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
                                <td>{parseFloat(nf.valor).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</td>
                                <td><span className={`${styles.badgeStatus} ${styles[nf.status]}`}>{nf.status.replace('_', ' ')}</span></td>
                                <td><button className={styles.btnTabela} onClick={() => window.open(nf.linkDriveNF, '_blank')}>VISUALIZAR PDF</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default NEDetail;