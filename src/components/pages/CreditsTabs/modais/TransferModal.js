import { useState } from 'react';
import styles from '../../../styles/styles_pages/styles_creditsTabs/styles_modais/TransferModal.module.css';
import { BsArrowLeftRight, BsInfoCircleFill } from 'react-icons/bs';
import { useAuth, USUARIOS } from '../../../context/AuthContext';

function TransferModal({ creditoOriginal, onClose, onSuccess }) {
    const { usuarioAtual } = useAuth();
    const [secaoDestino, setSecaoDestino] = useState('');
    const [valorTransferencia, setValorTransferencia] = useState('');
    const [erro, setErro] = useState('');

    // Formata o valor disponível
    const valorDisponivel = creditoOriginal.valor || 0;
    const valorDisponivelFormatado = valorDisponivel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Define as opções de destino baseado no nível do usuário atual
    const obterOpcoesDestino = () => {
        switch (usuarioAtual.nivel) {
            case 'DESCENTRALIZADORA':
                // TESOURARIA pode transferir para qualquer seção
                return [
                    { valor: 'TESOURARIA', label: 'TESOURARIA', nivel: 'DESCENTRALIZADORA' },
                    { valor: 'COL', label: 'COL', nivel: 'INTERMEDIARIA' },
                    { valor: 'GRCP', label: 'GRCP', nivel: 'REQUISITANTE' }
                ];
            case 'INTERMEDIARIA':
                // COL só pode transferir para REQUISITANTE (GRCP)
                return [
                    { valor: 'GRCP', label: 'GRCP', nivel: 'REQUISITANTE' }
                ];
            case 'REQUISITANTE':
                // GRCP não pode transferir
                return [];
            default:
                return [];
        }
    };

    const opcoesDestino = obterOpcoesDestino();

    // Função para gerar UUID simplificado
    const gerarUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    // Função para gerar código único no formato: SECAO-UUID (8 primeiros caracteres)
    const gerarCodigoUnico = (secao) => {
        const uuid = gerarUUID();
        const uuidCurto = uuid.substring(0, 8);
        return `${secao}-${uuidCurto}`;
    };

    const handleConfirmarTransferencia = () => {
        // Validações
        if (!secaoDestino) {
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
        
        // Prepara os dados para transferência
        const hoje = new Date();
        const dataGeracaoStr = hoje.toISOString().split('T')[0];

        // NOVO CRÉDITO (destino) - DETENTOR = seção que está recebendo
        const novoCredito = {
            nc: creditoOriginal.nc,
            codigoUnico: gerarCodigoUnico(secaoDestino),
             codigoOrigemPermanente: creditoOriginal.codigoOrigemPermanente,
            documentoAnterior: creditoOriginal.codigoUnico,
            finalidade: creditoOriginal.finalidade,
            omAplicacao: creditoOriginal.omAplicacao,
            processo: creditoOriginal.processo,
            fonteRecurso: creditoOriginal.fonteRecurso,
            prazoEmpenho: creditoOriginal.prazoEmpenho,
            linkDrive: creditoOriginal.linkDrive,
            dataGeracao: dataGeracaoStr,
            material: creditoOriginal.material || "Informado no momento da N.E.",
            fornecedor: creditoOriginal.fornecedor || "Informado no momento da N.E.",
            valor: valorNumerico,
            detentor: secaoDestino,
            statusRecebimento: 'PENDENTE'  // ← PENDENTE (aguardando confirmação)
        };

        // CRÉDITO ORIGEM (atualizado com valor abatido - DETENTOR não muda)
        const novoValorOrigem = valorDisponivel - valorNumerico;
        const creditoAtualizado = {
            ...creditoOriginal,
            valor: novoValorOrigem,
            transferenciaPendente: true,  // ← indica que tem transferência pendente
            codigoTransferido: novoCredito.codigoUnico  // ← referência para qual crédito foi transferido
        };

        // Executa as duas operações: atualiza origem e cria destino
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
    };

    // Se não houver opções de destino (REQUISITANTE), fecha o modal
    if (opcoesDestino.length === 0) {
        alert('Seu perfil não tem permissão para transferir créditos');
        onClose();
        return null;
    }

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalForm}>
                <div className={styles.modalHeader}>
                    <BsArrowLeftRight />
                    <h3>TRANSFERÊNCIA DE CRÉDITO</h3>
                </div>

                <div className={styles.formContent}>
                    {/* Informações do crédito original */}
                    <div className={styles.infoBox}>
                        <BsInfoCircleFill className={styles.infoIcon} />
                        <div className={styles.infoText}>
                            <strong>Crédito Original:</strong> {creditoOriginal.codigoUnico}
                            <br />
                            <span>Valor disponível: {valorDisponivelFormatado}</span>
                            <br />
                            <span>Detentor atual: {creditoOriginal.detentor || creditoOriginal.codigoUnico?.split('-')[0]}</span>
                        </div>
                    </div>

                    {/* Seção de destino */}
                    <div className={styles.formSection}>
                        <label className={styles.mainLabel}>SEÇÃO DESTINO</label>
                        <div className={styles.opcoesGrid}>
                            {opcoesDestino.map(opcao => (
                                <button
                                    key={opcao.valor}
                                    type="button"
                                    className={`${styles.opcaoBtn} ${secaoDestino === opcao.valor ? styles.opcaoSelecionada : ''}`}
                                    onClick={() => setSecaoDestino(opcao.valor)}
                                >
                                    <span className={styles.opcaoLabel}>{opcao.label}</span>
                                    <span className={styles.opcaoNivel}>{opcao.nivel}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Valor a transferir */}
                    <div className={styles.formSection}>
                        <label className={styles.mainLabel}>VALOR A TRANSFERIR</label>
                        <div className={styles.valorInputWrapper}>
                            <span className={styles.moedaSimbolo}>R$</span>
                            <input
                                type="text"
                                className={styles.valorInput}
                                placeholder="0,00"
                                value={valorTransferencia}
                                onChange={(e) => setValorTransferencia(e.target.value)}
                            />
                        </div>
                        <div className={styles.valorDisponivel}>
                            Disponível: {valorDisponivelFormatado}
                        </div>
                    </div>

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
                    >
                        CONFIRMAR TRANSFERÊNCIA
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TransferModal;