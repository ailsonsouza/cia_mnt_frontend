import { useState } from 'react';
import styles from '../../../styles/styles_pages/styles_creditsTabs/styles_modais/TransferModal.module.css';
import { BsXCircle, BsInfoCircleFill } from 'react-icons/bs';

function CancelarNEModal({ ne, onClose, onSuccess }) {
    const [valorCancelamento, setValorCancelamento] = useState('');
    const [isCancelamentoParcial, setIsCancelamentoParcial] = useState(false);
    const [erro, setErro] = useState('');

    const valorAtualNE = ne.valorAtual || 0;
    const valorAtualFormatado = valorAtualNE.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const handleConfirmarCancelamento = () => {
        let valorNumerico = 0;
        
        if (isCancelamentoParcial) {
            valorNumerico = parseFloat(valorCancelamento.replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
            
            if (valorNumerico <= 0) {
                setErro('Informe um valor válido maior que zero');
                return;
            }
            
            if (valorNumerico > valorAtualNE) {
                setErro(`Valor excede o limite da NE (${valorAtualFormatado})`);
                return;
            }
        } else {
            valorNumerico = valorAtualNE;
        }
        
        setErro('');
        
        // Busca a NC original para devolver o valor
        fetch(`http://localhost:5000/credits_nc/${ne.idNcVinculada}`)
            .then(res => res.json())
            .then(nc => {
                if (!nc) {
                    alert('Erro: NC de origem não encontrada!');
                    return;
                }
                
                // Atualiza a NC (devolve o valor)
                const ncAtualizada = {
                    ...nc,
                    valor: nc.valor + valorNumerico
                };
                
                if (isCancelamentoParcial && valorNumerico < valorAtualNE) {
                    // Cancelamento parcial: atualiza a NE com o novo valor
                    const neAtualizada = {
                        ...ne,
                        valorAtual: valorAtualNE - valorNumerico
                    };
                    
                    Promise.all([
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
                    ])
                    .then(() => {
                        alert(`Cancelamento parcial realizado!\n\nValor cancelado: ${valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\nSaldo restante da NE: ${(valorAtualNE - valorNumerico).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
                        if (onSuccess) onSuccess();
                        onClose();
                    })
                    .catch(err => {
                        console.error('Erro no cancelamento parcial:', err);
                        alert('Erro ao cancelar parcialmente. Tente novamente.');
                    });
                } else {
                    // Cancelamento total: remove a NE
                    Promise.all([
                        fetch(`http://localhost:5000/credits_nc/${ne.idNcVinculada}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(ncAtualizada)
                        }),
                        fetch(`http://localhost:5000/credits_ne/${ne.id}`, {
                            method: 'DELETE'
                        })
                    ])
                    .then(() => {
                        alert(`Cancelamento total realizado!\n\nValor devolvido à NC: ${valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
                        if (onSuccess) onSuccess();
                        onClose();
                    })
                    .catch(err => {
                        console.error('Erro no cancelamento total:', err);
                        alert('Erro ao cancelar. Tente novamente.');
                    });
                }
            })
            .catch(err => {
                console.error('Erro ao buscar NC:', err);
                alert('Erro ao buscar NC de origem.');
            });
    };

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
                            <span>NC de origem: {ne.idNcVinculada}</span>
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
                                Disponível para cancelar: {valorAtualFormatado}
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
                    >
                        CONFIRMAR CANCELAMENTO
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CancelarNEModal;