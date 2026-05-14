import { useState, useEffect } from 'react'
import styles from '../../styles/styles_pages/styles_creditsTabs/NewCredit.module.css'

function NewCredit({ onClose, onSuccess }) {
    const [nc, setNc] = useState('')
    const [finalidade, setFinalidade] = useState('')
    const [omAplicacao, setOmAplicacao] = useState('')
    const [processo, setProcesso] = useState('')
    const [valor, setValor] = useState('')
    const [fonteRecurso, setFonteRecurso] = useState('160')
    const [prazoEmpenho, setPrazoEmpenho] = useState('')
    const [isImediato, setIsImediato] = useState(false)
    const [linkDrive, setLinkDrive] = useState('')

    useEffect(() => {
        if (isImediato) {
            setPrazoEmpenho('EMPENHO IMEDIATO')
        } else {
            setPrazoEmpenho('')
        }
    }, [isImediato])

    const handleSalvarCredito = (e) => {
        e.preventDefault()

        // Captura a data exata do momento do cadastro no formato ISO (AAAA-MM-DD)
        const hoje = new Date();
        const dataGeracaoStr = hoje.toISOString().split('T')[0];

        const novoCredito = {
            nc,
            finalidade,
            omAplicacao,
            processo,
            fonteRecurso,
            prazoEmpenho,
            linkDrive,
            dataGeracao: dataGeracaoStr, // Persiste a data de geração para cálculo de dias decorridos
            material: "Informado no momento da N.E.",
            fornecedor: "Informado no momento da N.E.",
            valor: parseFloat(valor.replace(/[^\d,.]/g, '').replace(',', '.')) || 0
        }

        fetch('http://localhost:5000/credits_nc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoCredito)
        })
        .then(res => {
            if (!res.ok) throw new Error()
            return res.json()
        })
        .then(() => {
            alert('Nota de Crédito salva com sucesso!')
            
            // Dispara o callback de atualização imediata da tela de fundo se ele existir
            if (typeof onSuccess === 'function') {
                onSuccess();
            }
            
            fecharE_Limpar()
        })
        .catch(() => {
            alert('Não foi possível salvar no db.json. O json-server está rodando?')
        })
    }

    const fecharE_Limpar = () => {
        setNc('')
        setFinalidade('')
        setOmAplicacao('')
        setProcesso('')
        setValor('')
        setFonteRecurso('160')
        setPrazoEmpenho('')
        setLinkDrive('')
        setIsImediato(false)
        onClose()
    }

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h2>Inserir Nota de Crédito (NC)</h2>
                
                <form className={styles.modalForm} onSubmit={handleSalvarCredito}>
                    <div className={styles.formGroup}>
                        <label>Número da NC</label>
                        <input 
                            type="text" 
                            placeholder="Ex: 2025NC000807" 
                            value={nc} 
                            onChange={(e) => setNc(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Valor do Crédito (R$)</label>
                        <input 
                            type="text" 
                            placeholder="Ex: 15450.00" 
                            value={valor} 
                            onChange={(e) => setValor(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>UG</label>
                        <select 
                            value={fonteRecurso} 
                            onChange={(e) => setFonteRecurso(e.target.value)}
                            className={styles.selectModal}
                            required
                        >
                            <option value="160">160212</option>
                            <option value="167">167212</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>OM de Aplicação</label>
                        <input 
                            type="text" 
                            placeholder="Ex: B ADM AP/5º RM" 
                            value={omAplicacao} 
                            onChange={(e) => setOmAplicacao(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className={styles.formGroupFull}>
                        <label>Número do Processo</label>
                        <input 
                            type="text" 
                            placeholder="Ex: 64138.008322/2025-91" 
                            value={processo} 
                            onChange={(e) => setProcesso(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className={styles.formGroupFull}>
                        <label>Link do Arquivo no Google Drive</label>
                        <input 
                            type="url" 
                            placeholder="https://google.com..." 
                            value={linkDrive} 
                            onChange={(e) => setLinkDrive(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className={styles.formGroupFull}>
                        <label>Prazo para Empenho</label>
                        <div className={styles.prazoContainer}>
                            <input 
                                type={isImediato ? "text" : "date"} 
                                value={prazoEmpenho} 
                                onChange={(e) => setPrazoEmpenho(e.target.value)} 
                                disabled={isImediato}
                                required 
                                className={isImediato ? styles.inputImediatoAtivo : ''}
                            />
                            <label className={styles.checkboxLabel}>
                                <input 
                                    type="checkbox" 
                                    checked={isImediato}
                                    onChange={(e) => setIsImediato(e.target.checked)}
                                />
                                Empenho Imediato
                            </label>
                        </div>
                    </div>

                    <div className={styles.formGroupFull}>
                        <label>Finalidade</label>
                        <textarea 
                            placeholder="Descreva a finalidade detalhada desta Nota de Crédito..." 
                            value={finalidade} 
                            onChange={(e) => setFinalidade(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className={styles.modalActions}>
                        <button type="submit" className={styles.btnSalvar}>
                            Salvar Crédito
                        </button>
                        <button type="button" className={styles.btnCancelar} onClick={fecharE_Limpar}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default NewCredit;
