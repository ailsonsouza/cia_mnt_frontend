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

    const valorDisponivel = creditoOriginal.saldoDisponivel || 0;
    const valorDisponivelFormatado = valorDisponivel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Mapeamento de níveis para validação de hierarquia
    const getNivelValor = (nivel) => {
        switch (nivel) {
            case 'DESCENTRALIZADORA': return 1;
            case 'INTERMEDIARIA': return 2;
            case 'REQUISITANTE': return 3;
            default: return 99;
        }
    };

    const getNivelSecao = (secao) => {
        switch (secao) {
            case 'TESOURARIA': return 'DESCENTRALIZADORA';
            case 'COL': return 'INTERMEDIARIA';
            case 'GRCP': return 'REQUISITANTE';
            default: return 'DESCENTRALIZADORA';
        }
    };

    useEffect(() => {
        setCarregandoSecoes(true);
        fetch('http://localhost:5000/credits_nc')
            .then(res => res.json())
            .then(data => {
                const secoes = [...new Set(data.map(nc => nc.detentor))];
                const secoesAdicionais = ['TESOURARIA', 'COL', 'GRCP'];
                const todasSecoes = [...new Set([...secoes, ...secoesAdicionais])];
                
                let secoesFiltradas = todasSecoes;
                const nivelOrigem = getNivelSecao(usuarioAtual.secao);
                const valorNivelOrigem = getNivelValor(nivelOrigem);
                
                if (modo === 'transferir') {
                    // Só pode transferir para nível MENOR (valor maior)
                    secoesFiltradas = todasSecoes.filter(secao => {
                        if (secao === usuarioAtual.secao) return false;
                        const nivelDestino = getNivelSecao(secao);
                        const valorNivelDestino = getNivelValor(nivelDestino);
                        return valorNivelDestino > valorNivelOrigem;
                    });
                } else if (modo === 'devolver') {
                    // Devolução: só pode devolver para quem transferiu (documentoAnterior)
                    if (creditoOriginal.documentoAnterior) {
                        fetch(`http://localhost:5000/credits_nc?codigoUnico=${creditoOriginal.documentoAnterior}`)
                            .then(res => res.json())
                            .then(data => {
                                if (data.length > 0) {
                                    setSecaoDestino(data[0].detentor);
                                }
                            });
                    }
                    secoesFiltradas = [];
                }
                
                setSecoesDisponiveis(secoesFiltradas);
                setCarregandoSecoes(false);
            })
            .catch(err => {
                console.error("Erro ao carregar seções:", err);
                setCarregandoSecoes(false);
            });
    }, [usuarioAtual.secao, usuarioAtual.nivel, modo, creditoOriginal.documentoAnterior]);

    useEffect(() => {
        if (transferirValorTotal) {
            setValorTransferencia(valorDisponivel.toString());
        }
    }, [transferirValorTotal, valorDisponivel]);

    const gerarUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const gerarCodigoUnico = (secao) => {
        const uuid = gerarUUID();
        const uuidCurto = uuid.substring(0, 8);
        const sigla = secao === 'TESOURARIA' ? 'TES' : (secao === 'COL' ? 'COL' : 'GRCP');
        return `${sigla}-${uuidCurto}`;
    };

    const handleConfirmarTransferencia = async () => {
        if (modo === 'transferir' && !secaoDestino) {
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
        const agoraISO = hoje.toISOString();

        if (modo === 'devolver') {
            // MODO DEVOLVER
            try {
                const response = await fetch(`http://localhost:5000/credits_nc?codigoUnico=${creditoOriginal.documentoAnterior}`);
                const data = await response.json();
                
                if (data.length === 0) {
                    alert('Erro: Crédito original não encontrado!');
                    return;
                }
                
                const creditoOrigem = data[0];
                
                // CORREÇÃO: Validar se o valor a devolver não excede o saldo disponível
                if (valorNumerico > valorDisponivel) {
                    setErro(`Valor a devolver (${valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                    excede o saldo disponível (${valorDisponivelFormatado})`);
                    return;
                }
                
                // Atualiza a NC de origem (devolve o valor)
                const creditoOrigemAtualizado = {
                    ...creditoOrigem,
                    saldoDisponivel: creditoOrigem.saldoDisponivel + valorNumerico,
                    totalTransferido: (creditoOrigem.totalTransferido || 0) - valorNumerico,
                    versao: (creditoOrigem.versao || 0) + 1,
                    ultimaAtualizacao: agoraISO,
                    transferenciaPendente: false,
                    codigoTransferido: null
                };
                
                await fetch(`http://localhost:5000/credits_nc/${creditoOrigem.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(creditoOrigemAtualizado)
                });
                
                // CORREÇÃO: Atualiza a NC atual (que está devolvendo) - NUNCA DELETAR
                const novoSaldoAtual = valorDisponivel - valorNumerico;
                
                // Verificar se existem NEs vinculadas à NC atual
                const nesResponse = await fetch(`http://localhost:5000/credits_ne?idNcVinculada=${creditoOriginal.id}`);
                const nesVinculadas = await nesResponse.json();
                const temNEsVinculadas = nesVinculadas.length > 0;
                
                // CORREÇÃO: Se tem NEs vinculadas, NUNCA deletar a NC, apenas atualizar o saldo
                const creditoAtualAtualizado = {
                    ...creditoOriginal,
                    saldoDisponivel: novoSaldoAtual,
                    versao: (creditoOriginal.versao || 0) + 1,
                    ultimaAtualizacao: agoraISO,
                    // Se o saldo ficou zero mas tem NEs, mantém a NC ativa
                    status: novoSaldoAtual === 0 && temNEsVinculadas ? 'SALDO_ZERADO' : creditoOriginal.status
                };
                
                await fetch(`http://localhost:5000/credits_nc/${creditoOriginal.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(creditoAtualAtualizado)
                });
                
                let mensagem = `Devolução realizada com sucesso!\n\nValor devolvido: ${valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
                mensagem += `Saldo restante na NC ${creditoOriginal.codigoUnico}: ${novoSaldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                
                if (temNEsVinculadas && novoSaldoAtual === 0) {
                    mensagem += `\n\n⚠️ A NC possui ${nesVinculadas.length} NE(s) vinculada(s) e não pode ser excluída. Seu saldo foi zerado, mas o registro permanece para fins históricos.`;
                }
                
                alert(mensagem);
                
                if (typeof onSuccess === 'function') onSuccess();
                onClose();
                
            } catch (err) {
                console.error('Erro na devolução:', err);
                alert('Erro ao realizar devolução. Tente novamente.');
            }
        } else {
            // MODO TRANSFERIR
            const codigoUnicoDestino = gerarCodigoUnico(secaoDestino);
            const nivelDestino = getNivelSecao(secaoDestino);
            
            const novoCredito = {
                id: Math.random().toString(36).substr(2, 11),
                nc: creditoOriginal.nc,
                codigoUnico: codigoUnicoDestino,
                codigoOrigemPermanente: creditoOriginal.codigoOrigemPermanente,
                documentoAnterior: creditoOriginal.codigoUnico,
                nivelOrigem: nivelDestino,
                
                valorOriginal: valorNumerico,
                detentorOriginal: secaoDestino,
                fonteRecurso: creditoOriginal.fonteRecurso,
                finalidade: creditoOriginal.finalidade,
                prazoEmpenho: creditoOriginal.prazoEmpenho,
                linkDrive: creditoOriginal.linkDrive,
                dataGeracao: dataGeracaoStr,
                
                saldoDisponivel: valorNumerico,
                totalTransferido: 0,
                totalEmpenhado: 0,
                totalLiquidado: 0,
                
                versao: 1,
                ultimaAtualizacao: agoraISO,
                
                detentor: secaoDestino,
                statusRecebimento: 'PENDENTE',
                transferenciaPendente: true,
                codigoTransferido: null
            };

            // Atualiza a NC origem
            const novoSaldoOrigem = valorDisponivel - valorNumerico;
            const creditoAtualizado = {
                ...creditoOriginal,
                saldoDisponivel: novoSaldoOrigem,
                totalTransferido: (creditoOriginal.totalTransferido || 0) + valorNumerico,
                transferenciaPendente: true,
                codigoTransferido: codigoUnicoDestino,
                versao: (creditoOriginal.versao || 0) + 1,
                ultimaAtualizacao: agoraISO
            };

            try {
                await Promise.all([
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
                ]);
                
                alert(`Transferência realizada com sucesso!\n\nValor transferido: ${valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\nDestino: ${secaoDestino}\nCódigo novo: ${codigoUnicoDestino}`);
                if (typeof onSuccess === 'function') onSuccess();
                onClose();
                
            } catch (err) {
                console.error('Erro na transferência:', err);
                alert('Erro ao realizar transferência. Tente novamente.');
            }
        }
    };

    const podeTransferir = () => {
        if (modo === 'devolver') return true;
        if (carregandoSecoes) return true;
        return secoesDisponiveis.length > 0;
    };

    if (!podeTransferir()) {
        if (modo === 'transferir') {
            alert('Seu perfil não tem permissão para transferir créditos para níveis superiores ou iguais');
        }
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
                            <br />
                            <span>Valor Original: {(creditoOriginal.valorOriginal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
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