import { useState } from 'react';
import styles from '../../../styles/styles_pages/styles_creditsTabs/styles_modais/TransferModal.module.css';
import { BsPencil, BsInfoCircleFill } from 'react-icons/bs';

function EditarNCModal({ nc, onClose, onSuccess }) {
    const [numeroNC, setNumeroNC] = useState(nc.nc || '');
    const [valor, setValor] = useState(nc.valor?.toString() || '');
    const [prazoEmpenho, setPrazoEmpenho] = useState(nc.prazoEmpenho || '');
    const [finalidade, setFinalidade] = useState(nc.finalidade || '');
    const [linkDrive, setLinkDrive] = useState(nc.linkDrive || '');
    const [isImediato, setIsImediato] = useState(nc.prazoEmpenho === 'EMPENHO IMEDIATO');
    const [erro, setErro] = useState('');

    const valorAtualNC = nc.valor || 0;
    const valorFormatado = valorAtualNC.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const handleSalvarEdicao = (e) => {
        e.preventDefault();
        
        const valorNumerico = parseFloat(valor.replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
        
        if (valorNumerico <= 0) {
            setErro('Informe um valor válido maior que zero');
            return;
        }
        
        setErro('');
        
        const prazoFinal = isImediato ? 'EMPENHO IMEDIATO' : prazoEmpenho;
        
        const ncAtualizada = {
            ...nc,
            nc: numeroNC,
            valor: valorNumerico,
            prazoEmpenho: prazoFinal,
            finalidade,
            linkDrive
        };
        
        fetch(`http://localhost:5000/credits_nc/${nc.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ncAtualizada)
        })
        .then(() => {
            alert('Nota de Crédito editada com sucesso!');
            if (onSuccess) onSuccess();
            onClose();
        })
        .catch(err => {
            console.error('Erro ao editar NC:', err);
            alert('Erro ao editar Nota de Crédito. Tente novamente.');
        });
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalForm}>
                <div className={styles.modalHeader} style={{ backgroundColor: '#1e295d' }}>
                    <BsPencil />
                    <h3>EDITAR NOTA DE CRÉDITO</h3>
                </div>

                <div className={styles.formContent}>
                    <div className={styles.infoBox}>
                        <BsInfoCircleFill className={styles.infoIcon} />
                        <div className={styles.infoText}>
                            <strong>Código:</strong> {nc.codigoUnico}
                            <br />
                            <span>Valor atual: {valorFormatado}</span>
                        </div>
                    </div>

                    <div className={styles.formSection}>
                        <label className={styles.mainLabel}>NÚMERO DA NC</label>
                        <input 
                            type="text" 
                            className={styles.valorInput} 
                            style={{ width: '100%', marginBottom: '15px' }}
                            value={numeroNC} 
                            onChange={(e) => setNumeroNC(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className={styles.formSection}>
                        <label className={styles.mainLabel}>VALOR (R$)</label>
                        <div className={styles.valorInputWrapper}>
                            <span className={styles.moedaSimbolo}>R$</span>
                            <input
                                type="text"
                                className={styles.valorInput}
                                placeholder="0,00"
                                value={valor}
                                onChange={(e) => setValor(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.formSection}>
                        <label className={styles.mainLabel}>PRAZO PARA EMPENHO</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                            <input 
                                type={isImediato ? "text" : "date"} 
                                className={styles.valorInput}
                                style={{ flex: 1 }}
                                value={prazoEmpenho} 
                                onChange={(e) => setPrazoEmpenho(e.target.value)} 
                                disabled={isImediato}
                                required 
                            />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={isImediato} onChange={(e) => setIsImediato(e.target.checked)} />
                                Empenho Imediato
                            </label>
                        </div>
                    </div>

                    <div className={styles.formSection}>
                        <label className={styles.mainLabel}>FINALIDADE</label>
                        <textarea 
                            className={styles.valorInput} 
                            style={{ width: '100%', minHeight: '100px', marginBottom: '15px' }}
                            value={finalidade} 
                            onChange={(e) => setFinalidade(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className={styles.formSection}>
                        <label className={styles.mainLabel}>LINK DO DRIVE</label>
                        <input 
                            type="url" 
                            className={styles.valorInput} 
                            style={{ width: '100%', marginBottom: '15px' }}
                            value={linkDrive} 
                            onChange={(e) => setLinkDrive(e.target.value)} 
                            required 
                        />
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
                        onClick={handleSalvarEdicao}
                    >
                        SALVAR ALTERAÇÕES
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditarNCModal;