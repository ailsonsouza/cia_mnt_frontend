import { useState, useEffect } from 'react';
import styles from '../../../styles/styles_pages/styles_creditsTabs/styles_modais/TransferModal.module.css';

import { BsArrowLeftRight, BsInfoCircleFill, BsArrowReturnLeft } from 'react-icons/bs';
import { useAuth } from '../../../context/AuthContext';

function TransferModal({ creditoOriginal, onClose, onSuccess, modo = 'transferir' }) {
    const { usuarioAtual } = useAuth();
    const [secaoDestino, setSecaoDestino] = useState('');
    const [valorTransferencia, setValorTransferencia] = useState('');
    const [erro, setErro] = useState('');
    const [transferirValorTotal, setTransferirValorTotal] = useState(false);
    const [secoesDisponiveis, setSecoesDisponiveis] = useState([]);
    const [carregandoSecoes, setCarregandoSecoes] = useState(true);

    // Formata o valor disponível
    const valorDisponivel = creditoOriginal.valor || 0;
    const valorDisponivelFormatado = valorDisponivel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Buscar seções disponíveis dinamicamente
    useEffect(() => {
        setCarregandoSecoes(true);
        fetch('http://localhost:5000/credits_nc')
            .then(res => res.json())
            .then(data => {
                // Extrai todas as seções únicas dos detentores
                const secoes = [...new Set(data.map(nc => nc.detentor))];
                
                // Adiciona também as seções base
                const secoesAdicionais = ['TESOURARIA', 'COL', 'GRCP'];
                const todasSecoes = [...new Set([...secoes, ...secoesAdicionais])];
                
                // Filtra baseado no nível do usuário atual
                let secoesFiltradas = todasSecoes;
                
                switch (usuarioAtual.nivel) {
                    case 'DESCENTRALIZADORA':
                        // Pode transferir para qualquer seção exceto a própria
                        secoesFiltradas = todasSecoes.filter(s => s !== usuarioAtual.secao);
                        break;
                    case 'INTERMEDIARIA':
                        // COL só pode transferir para REQUISITANTE (GRCP)
                        secoesFiltradas = todasSecoes.filter(s => s === 'GRCP');
                        break;
                    case 'REQUISITANTE':
                        // GRCP não pode transferir
                        secoesFiltradas = [];
                        break;
                    default:
                        secoesFiltradas = [];
                }
                
                setSecoesDisponiveis(secoesFiltradas);
                setCarregandoSecoes(false);
            })
            .catch(err => {
                console.error("Erro ao carregar seções:", err);
                // Fallback: seções padrão
                let secoesPadrao = ['TESOURARIA', 'COL', 'GRCP'].filter(s => s !== usuarioAtual.secao);
                if (usuarioAtual.nivel === 'INTERMEDIARIA') {
                    secoesPadrao = ['GRCP'];
                } else if (usuarioAtual.nivel === 'REQUISITANTE') {
                    secoesPadrao = [];
                }
                setSecoesDisponiveis(secoesPadrao);
                setCarregandoSecoes(false);
            });
    }, [usuarioAtual.nivel, usuarioAtual.secao]);

    // useEffect para controlar o valor total
    useEffect(() => {
        if (transferirValorTotal) {
            setValorTransferencia(valorDisponivel.toString());
        }
    }, [transferirValorTotal, valorDisponivel]);

    // Se for modo devolver, busca a seção de origem (documentoAnterior)
    useEffect(() => {
        if (modo === 'devolver' && creditoOriginal.documentoAnterior) {
            fetch(`http://localhost:5000/credits_nc?codigoUnico=${creditoOriginal.documentoAnterior}`)
                .then(res => res.json())
                .then(data => {
                    if (data.length > 0) {
                        const creditoOrigem = data[0];
                        setSecaoDestino(creditoOrigem.detentor);
                    }
                });
        }
    }, [modo, creditoOriginal]);

    // Função para gerar UUID simplificado
    const gerarUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    // Função para gerar código único
    const gerarCodigoUnico = (secao) => {
        const uuid = gerarUUID();
        const uuidCurto = uuid.substring(0, 8);
        const sigla = secao === 'TESOURARIA' ? 'TES' : (secao === 'COL' ? 'COL' : 'GRCP');
        return `${sigla}-${uuidCurto}`;
    };

    const handleConfirmarTransferencia = () => {
        if (!secaoDestino && modo !== 'devolver') {
            setErro('Selecione a seção de destino');
            return;
        }

        const valorNumerico = parseFloat(valorTransferencia.replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
        
        if (valorNumerico <= 0) {
            setErro('Informe um valor válido maior que zero');
            return;
        }

        if (valorNumerico > valorDisponivel) {
            setErro(`Valor excede o limite disponível (${valorDisponivelFormatado})`);
            return;
        }

        setErro('');
        
        const hoje = new Date();
        const dataGeracaoStr = hoje.toISOString().split('T')[0];

        if (modo === 'devolver') {
            // MODO DEVOLVER
            fetch(`http://localhost:5000/credits_nc?codigoUnico=${creditoOriginal.documentoAnterior}`)
                .then(res => res.json())
                .then(data => {
                    if (data.length === 0) {
                        alert('Erro: Crédito original não encontrado!');
                        return;
                    }
                    
                    const creditoOrigem = data[0];
                    
                    const creditoOrigemAtualizado = {
                        ...creditoOrigem,
                        valor: creditoOrigem.valor + valorNumerico,
                        devolucaoRecebida: true
                    };
                    
                    const novoValorAtual = valorDisponivel - valorNumerico;
                    
                    if (novoValorAtual === 0) {
                        fetch(`http://localhost:5000/credits_nc/${creditoOriginal.id}`, {
                            method: 'DELETE'
                        });
                    } else {
                        const creditoAtualAtualizado = {
                            ...creditoOriginal,
                            valor: novoValorAtual
                        };
                        fetch(`http://localhost:5000/credits_nc/${creditoOriginal.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(creditoAtualAtualizado)
                        });
                    }
                    
                    fetch(`http://localhost:5000/credits_nc/${creditoOrigem.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(creditoOrigemAtualizado)
                    })
                    .then(() => {
                        alert(`Devolução realizada com sucesso!\n\nValor devolvido: ${valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\nCrédito original: ${creditoOrigem.codigoUnico}`);
                        if (typeof onSuccess === 'function') onSuccess();
                        onClose();
                    });
                })
                .catch(err => {
                    console.error('Erro na devolução:', err);
                    alert('Erro ao realizar devolução. Tente novamente.');
                });
        } else {
            // MODO TRANSFERIR
            const novoCredito = {
                nc: creditoOriginal.nc,
                codigoUnico: gerarCodigoUnico(secaoDestino),
                codigoOrigemPermanente: creditoOriginal.codigoOrigemPermanente,
                documentoAnterior: creditoOriginal.codigoUnico,
                finalidade: creditoOriginal.finalidade,
                fonteRecurso: creditoOriginal.fonteRecurso,
                prazoEmpenho: creditoOriginal.prazoEmpenho,
                linkDrive: creditoOriginal.linkDrive,
                dataGeracao: dataGeracaoStr,
                valor: valorNumerico,
                detentor: secaoDestino,
                statusRecebimento: 'PENDENTE'
            };

            const novoValorOrigem = valorDisponivel - valorNumerico;
            const creditoAtualizado = {
                ...creditoOriginal,
                valor: novoValorOrigem,
                transferenciaPendente: true,
                codigoTransferido: novoCredito.codigoUnico
            };

            Promise.all([
                fetch(`http://localhost:5000/credits_nc/${creditoOriginal.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(creditoAtualizado)
                }),
                fetch('http://localhost:5000/credits_nc', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(novoCredito)
                })
            ])
            .then(([resOrigem, resDestino]) => {
                if (!resOrigem.ok || !resDestino.ok) {
                    throw new Error('Erro na transferência');
                }
                return Promise.all([resOrigem.json(), resDestino.json()]);
            })
            .then(() => {
                alert(`Transferência realizada com sucesso!\n\nValor transferido: ${valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\nDestino: ${secaoDestino}\nCódigo novo: ${novoCredito.codigoUnico}`);
                if (typeof onSuccess === 'function') onSuccess();
                onClose();
            })
            .catch(err => {
                console.error('Erro na transferência:', err);
                alert('Erro ao realizar transferência. Tente novamente.');
            });
        }
    };

    const podeTransferir = () => {
        if (modo === 'devolver') return true;
        if (carregandoSecoes) return true;
        return secoesDisponiveis.length > 0;
    };

    if (!podeTransferir()) {
        alert('Seu perfil não tem permissão para transferir créditos');
        onClose();
        return null;
    }

    const titulo = modo === 'devolver' ? 'DEVOLVER CRÉDITO' : 'TRANSFERÊNCIA DE CRÉDITO';
    const icone = modo === 'devolver' ? <BsArrowReturnLeft /> : <BsArrowLeftRight />;
    const botaoTexto = modo === 'devolver' ? 'CONFIRMAR DEVOLUÇÃO' : 'CONFIRMAR TRANSFERÊNCIA';

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalForm}>
                <div className={styles.modalHeader}>
                    {icone}
                    <h3>{titulo}</h3>
                </div>

                <div className={styles.formContent}>
                    <div className={styles.infoBox}>
                        <BsInfoCircleFill className={styles.infoIcon} />
                        <div className={styles.infoText}>
                            <strong>Crédito:</strong> {creditoOriginal.codigoUnico}
                            <br />
                            <span>Valor disponível: {valorDisponivelFormatado}</span>
                            <br />
                            <span>Detentor atual: {creditoOriginal.detentor}</span>
                            {modo === 'devolver' && creditoOriginal.documentoAnterior && (
                                <>
                                    <br />
                                    <span style={{ color: '#2b6cb0' }}>
                                        <strong>Devolvendo para:</strong> {secaoDestino}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {modo !== 'devolver' && (
                        <div className={styles.formSection}>
                            <label className={styles.mainLabel}>SEÇÃO DESTINO</label>
                            {carregandoSecoes ? (
                                <div className={styles.carregandoText}>Carregando seções...</div>
                            ) : (
                                <select 
                                    className={styles.selectDestino}
                                    value={secaoDestino}
                                    onChange={(e) => setSecaoDestino(e.target.value)}
                                    required
                                >
                                    <option value="">-- Selecione a seção de destino --</option>
                                    {secoesDisponiveis.map(secao => (
                                        <option key={secao} value={secao}>
                                            {secao}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    <div className={styles.formSection}>
                        <label className={styles.mainLabel}>
                            {modo === 'devolver' ? 'VALOR A DEVOLVER' : 'VALOR A TRANSFERIR'}
                        </label>
                        <div className={styles.valorInputWrapper}>
                            <span className={styles.moedaSimbolo}>R$</span>
                            <input
                                type="text"
                                className={styles.valorInput}
                                placeholder="0,00"
                                value={valorTransferencia}
                                onChange={(e) => {
                                    setValorTransferencia(e.target.value);
                                    if (transferirValorTotal) setTransferirValorTotal(false);
                                }}
                            />
                        </div>
                        <div className={styles.valorDisponivel}>
                            Disponível: {valorDisponivelFormatado}
                        </div>
                    </div>

                    {/* Checkbox para transferir valor total */}
                    {modo !== 'devolver' && (
                        <div className={styles.formSection}>
                            <label className={styles.checkboxLabel}>
                                <input 
                                    type="checkbox" 
                                    checked={transferirValorTotal}
                                    onChange={(e) => setTransferirValorTotal(e.target.checked)}
                                />
                                Transferir valor total disponível
                            </label>
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
                        CANCELAR
                    </button>
                    <button 
                        type="button" 
                        className={styles.btnConfirm} 
                        onClick={handleConfirmarTransferencia}
                        disabled={!secaoDestino && modo !== 'devolver' && !carregandoSecoes}
                    >
                        {botaoTexto}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TransferModal;