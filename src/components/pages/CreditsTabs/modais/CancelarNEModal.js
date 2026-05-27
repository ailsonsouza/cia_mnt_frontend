import { useState, useEffect } from 'react';
import styles from '../../../styles/styles_pages/styles_creditsTabs/styles_modais/TransferModal.module.css';
import { BsXCircle, BsInfoCircleFill } from 'react-icons/bs';

function CancelarNEModal({ ne, onClose, onSuccess }) {
    const [valorCancelamento, setValorCancelamento] = useState('');
    const [isCancelamentoParcial, setIsCancelamentoParcial] = useState(false);
    const [erro, setErro] = useState('');
    const [nfsVinculadas, setNfsVinculadas] = useState([]);
    const [carregandoNFs, setCarregandoNFs] = useState(true);
    const [ncOrigem, setNcOrigem] = useState(null);
    
    // NOVOS ESTADOS PARA CÁLCULO DO SALDO DISPONÍVEL PARA CANCELAMENTO
    const [totalLiquidado, setTotalLiquidado] = useState(0);
    const [totalEmLiquidacao, setTotalEmLiquidacao] = useState(0);
    const [saldoDisponivelCancelamento, setSaldoDisponivelCancelamento] = useState(0);

    const valorAtualNE = ne.valorAtual || 0;
    const valorAtualFormatado = valorAtualNE.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    useEffect(() => {
        const buscarDados = async () => {
            setCarregandoNFs(true);
            try {
                const [resNF, resNC] = await Promise.all([
                    fetch('http://localhost:5000/credits_nf').then(r => r.json()),
                    fetch(`http://localhost:5000/credits_nc/${ne.idNcVinculada}`).then(r => r.json())
                ]);
                
                const nfsDaNe = resNF.filter(nf => nf.idNeVinculada === ne.id);
                setNfsVinculadas(nfsDaNe);
                setNcOrigem(resNC);
                
                // CORREÇÃO: Calcula os totais líquidados e em liquidação
                const liquidado = nfsDaNe
                    .filter(nf => nf.status === 'LIQUIDADA')
                    .reduce((sum, nf) => sum + (parseFloat(nf.valor) || 0), 0);
                
                const emLiquidacao = nfsDaNe
                    .filter(nf => nf.status === 'ENVIADA_LIQUIDACAO')
                    .reduce((sum, nf) => sum + (parseFloat(nf.valor) || 0), 0);
                
                setTotalLiquidado(liquidado);
                setTotalEmLiquidacao(emLiquidacao);
                
                // CORREÇÃO: Saldo disponível para cancelamento = valorAtualNE - (liquidado + emLiquidacao)
                const saldoDisponivel = valorAtualNE - (liquidado + emLiquidacao);
                setSaldoDisponivelCancelamento(saldoDisponivel > 0 ? saldoDisponivel : 0);
                
            } catch (err) {
                console.error('Erro ao buscar dados:', err);
            } finally {
                setCarregandoNFs(false);
            }
        };
        buscarDados();
    }, [ne.id, ne.idNcVinculada, valorAtualNE]);

    const handleConfirmarCancelamento = async () => {
        // CORREÇÃO: Usa o saldo disponível para cancelamento (exclui NFs já liquidadas/em liquidação)
        const saldoDisponivel = saldoDisponivelCancelamento;
        
        if (saldoDisponivel === 0) {
            setErro('Não há saldo disponível para cancelamento. Todas as NFs já foram liquidadas ou estão em liquidação.');
            return;
        }

        let valorNumerico = 0;
        
        if (isCancelamentoParcial) {
            valorNumerico = parseFloat(valorCancelamento.replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
            
            if (valorNumerico <= 0) {
                setErro('Informe um valor válido maior que zero');
                return;
            }
            
            // CORREÇÃO: Valida contra o saldo disponível (não contra o valor total da NE)
            if (valorNumerico > saldoDisponivel) {
                setErro(`Valor excede o limite disponível para cancelamento (${saldoDisponivel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`);
                return;
            }

            // CORREÇÃO: Não precisa mais bloquear por ter NF em liquidação
            // Apenas impede se o valor exceder o disponível (excluindo as NFs já comprometidas)
        } else {
            // Cancelamento total: só permite se não houver NFs liquidadas/em liquidação
            if (totalLiquidado > 0 || totalEmLiquidacao > 0) {
                setErro('Cancelamento total não permitido quando existem Notas Fiscais liquidadas ou em liquidação. Realize um cancelamento parcial ou cancele as NFs primeiro.');
                return;
            }
            valorNumerico = saldoDisponivel;
        }
        
        if (valorNumerico <= 0) {
            setErro('Valor inválido para cancelamento');
            return;
        }
        
        setErro('');
        
        try {
            if (isCancelamentoParcial && valorNumerico < saldoDisponivel) {
                // Cancelamento parcial: atualiza a NE com o novo valor
                const novoValorNE = valorAtualNE - valorNumerico;
                const neAtualizada = {
                    ...ne,
                    valorAtual: novoValorNE
                };
                
                // Atualiza a NC origem (devolve o valor)
                const ncAtualizada = {
                    ...ncOrigem,
                    saldoDisponivel: ncOrigem.saldoDisponivel + valorNumerico,
                    totalEmpenhado: (ncOrigem.totalEmpenhado || 0) - valorNumerico,
                    versao: (ncOrigem.versao || 0) + 1,
                    ultimaAtualizacao: new Date().toISOString()
                };
                
                await Promise.all([
                    fetch(`http://localhost:5000/credits_nc/${ne.idNcVinculada}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(ncAtualizada)
                    }),
                    fetch(`http://localhost:5000/credits_ne/${ne.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(neAtualizada)
                    })
                ]);
                
                alert(`Cancelamento parcial realizado!\n\nValor cancelado: ${valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\nSaldo restante da NE: ${novoValorNE.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
            } else {
                // Cancelamento total: remove a NE
                const ncAtualizada = {
                    ...ncOrigem,
                    saldoDisponivel: ncOrigem.saldoDisponivel + valorNumerico,
                    totalEmpenhado: (ncOrigem.totalEmpenhado || 0) - valorNumerico,
                    versao: (ncOrigem.versao || 0) + 1,
                    ultimaAtualizacao: new Date().toISOString()
                };
                
                await Promise.all([
                    fetch(`http://localhost:5000/credits_nc/${ne.idNcVinculada}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(ncAtualizada)
                    }),
                    fetch(`http://localhost:5000/credits_ne/${ne.id}`, {
                        method: 'DELETE'
                    })
                ]);
                
                alert(`Cancelamento total realizado!\n\nValor devolvido à NC: ${valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
            }
            
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error('Erro no cancelamento:', err);
            alert('Erro ao cancelar. Tente novamente.');
        }
    };

    // CORREÇÃO: Formata o saldo disponível para exibição
    const saldoDisponivelFormatado = saldoDisponivelCancelamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (carregandoNFs) {
        return (
            <div className={styles.modalOverlay}>
                <div className={styles.modalForm}>
                    <div className={styles.modalHeader} style={{ backgroundColor: '#c53030' }}>
                        <BsXCircle />
                        <h3>CANCELAR N.E.</h3>
                    </div>
                    <div className={styles.formContent}>
                        <div className={styles.infoBox}>
                            <BsInfoCircleFill className={styles.infoIcon} />
                            <div className={styles.infoText}>
                                Verificando Notas Fiscais vinculadas...
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalForm}>
                <div className={styles.modalHeader} style={{ backgroundColor: '#c53030' }}>
                    <BsXCircle />
                    <h3>CANCELAR N.E.</h3>
                </div>

                <div className={styles.formContent}>
                    <div className={styles.infoBox}>
                        <BsInfoCircleFill className={styles.infoIcon} />
                        <div className={styles.infoText}>
                            <strong>Nota de Empenho:</strong> {ne.numeroNE}
                            <br />
                            <span>Valor atual: {valorAtualFormatado}</span>
                            <br />
                            <span>NC de origem: {ncOrigem?.codigoUnico || ne.idNcVinculada}</span>
                            {nfsVinculadas.length > 0 && (
                                <>
                                    <br />
                                    <span style={{ color: '#e53e3e' }}>
                                        <strong>⚠️ Notas Fiscais vinculadas: {nfsVinculadas.length}</strong>
                                    </span>
                                    <br />
                                    <span style={{ color: '#ed8936' }}>
                                        Total já liquidado/em liquidação: {(totalLiquidado + totalEmLiquidacao).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                    <br />
                                    <span style={{ color: '#2f855a' }}>
                                        <strong>Saldo disponível para cancelamento: {saldoDisponivelFormatado}</strong>
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className={styles.formSection}>
                        <label className={styles.mainLabel}>TIPO DE CANCELAMENTO</label>
                        <div className={styles.opcoesGrid}>
                            <button
                                type="button"
                                className={`${styles.opcaoBtn} ${!isCancelamentoParcial ? styles.opcaoSelecionada : ''}`}
                                onClick={() => {
                                    setIsCancelamentoParcial(false);
                                    setValorCancelamento('');
                                    setErro('');
                                }}
                            >
                                <span className={styles.opcaoLabel}>CANCELAMENTO TOTAL</span>
                                <span className={styles.opcaoNivel}>Cancela toda a N.E.</span>
                            </button>
                            <button
                                type="button"
                                className={`${styles.opcaoBtn} ${isCancelamentoParcial ? styles.opcaoSelecionada : ''}`}
                                onClick={() => {
                                    setIsCancelamentoParcial(true);
                                    setErro('');
                                }}
                            >
                                <span className={styles.opcaoLabel}>CANCELAMENTO PARCIAL</span>
                                <span className={styles.opcaoNivel}>Cancela apenas parte do valor</span>
                            </button>
                        </div>
                    </div>

                    {isCancelamentoParcial && (
                        <div className={styles.formSection}>
                            <label className={styles.mainLabel}>VALOR A CANCELAR</label>
                            <div className={styles.valorInputWrapper}>
                                <span className={styles.moedaSimbolo}>R$</span>
                                <input
                                    type="text"
                                    className={styles.valorInput}
                                    placeholder="0,00"
                                    value={valorCancelamento}
                                    onChange={(e) => setValorCancelamento(e.target.value)}
                                />
                            </div>
                            <div className={styles.valorDisponivel}>
                                Disponível para cancelar: {saldoDisponivelFormatado}
                            </div>
                            <div className={styles.valorDisponivel} style={{ fontSize: '0.7rem', color: '#718096' }}>
                                Obs: Valores já liquidados ou em liquidação ({nfsVinculadas.length} NF(s)) não podem ser cancelados.
                            </div>
                        </div>
                    )}

                    {erro && (
                        <div className={styles.erroBox}>
                            {erro}
                        </div>
                    )}
                </div>

                <div className={styles.formFooter}>
                    <button type="button" className={styles.btnCancel} onClick={onClose}>
                        VOLTAR
                    </button>
                    <button 
                        type="button" 
                        className={styles.btnConfirm} 
                        onClick={handleConfirmarCancelamento}
                        style={{ backgroundColor: '#c53030' }}
                        disabled={saldoDisponivelCancelamento === 0 && !isCancelamentoParcial}
                    >
                        CONFIRMAR CANCELAMENTO
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CancelarNEModal;