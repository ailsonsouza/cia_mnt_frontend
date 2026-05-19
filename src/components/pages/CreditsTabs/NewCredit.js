import { useState, useEffect } from 'react'
import styles from '../../styles/styles_pages/styles_creditsTabs/NewCreditAndNE.module.css'
import { BsPlusSquareFill, BsInfoCircleFill, BsCalendarCheck, BsLink45Deg } from 'react-icons/bs'
import { useAuth } from '../../context/AuthContext'

function NewCredit({ onClose, onSuccess }) {
    const { usuarioAtual } = useAuth();
    
    const [nc, setNc] = useState('')
    const [finalidade, setFinalidade] = useState('')
    const [omAplicacao, setOmAplicacao] = useState('')
    const [processo, setProcesso] = useState('')
    const [valor, setValor] = useState('')
    const [fonteRecurso, setFonteRecurso] = useState('160')
    const [prazoEmpenho, setPrazoEmpenho] = useState('')
    const [isImediato, setIsImediato] = useState(false)
    const [linkDrive, setLinkDrive] = useState('')

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

    useEffect(() => {
        if (isImediato) {
            setPrazoEmpenho('EMPENHO IMEDIATO')
        } else {
            setPrazoEmpenho('')
        }
    }, [isImediato])

    const handleSalvarCredito = (e) => {
        e.preventDefault();
        const hoje = new Date();
        const dataGeracaoStr = hoje.toISOString().split('T')[0];

        const valorApenasNumerosEVirgula = valor.replace(/[^\d,]/g, '');
        const valorComPontoDecimal = valorApenasNumerosEVirgula.replace(',', '.');
        const valorNumericoFinal = parseFloat(valorComPontoDecimal) || 0;

        // Gera o código único para esta NC
        const codigoUnico = gerarCodigoUnico(usuarioAtual.secao);

        const novoCredito = {
            nc,
            codigoUnico,
            codigoOrigemPermanente: codigoUnico,
            documentoAnterior: null,
            finalidade,
            omAplicacao,
            processo,
            fonteRecurso,
            prazoEmpenho,
            linkDrive,
            dataGeracao: dataGeracaoStr,
            material: "Informado no momento da N.E.",
            fornecedor: "Informado no momento da N.E.",
            valor: valorNumericoFinal,
            detentor: usuarioAtual.secao  // ← DETENTOR = quem criou/está com o crédito
        };

        fetch('http://localhost:5000/credits_nc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoCredito)
        })
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(() => {
            alert(`Nota de Crédito cadastrada com sucesso!\nCódigo: ${codigoUnico}`);
            if (typeof onSuccess === 'function') onSuccess();
            fecharE_Limpar();
        })
        .catch(() => alert('Erro ao salvar no banco de dados.'));
    };

    const fecharE_Limpar = () => {
        setNc(''); setFinalidade(''); setOmAplicacao(''); setProcesso('');
        setValor(''); setFonteRecurso('160'); setPrazoEmpenho('');
        setLinkDrive(''); setIsImediato(false);
        onClose();
    }

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalForm}>
                <div className={styles.modalHeader}>
                    <BsPlusSquareFill />
                    <h3>INSERIR NOTA DE CRÉDITO (NC)</h3>
                </div>
                
                <form className={styles.formStyled} onSubmit={handleSalvarCredito}>
                    <div className={styles.formContent}>
                        
                        {/* SEÇÃO 1: DADOS BÁSICOS */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionHeader}>
                                <BsInfoCircleFill /> <h4>1. IDENTIFICAÇÃO E ORIGEM</h4>
                            </div>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup}>
                                    <label>Número da NC</label>
                                    <input type="text" placeholder="Ex: 2025NC000807" className={styles.inputField} value={nc} onChange={(e) => setNc(e.target.value)} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Valor (R$)</label>
                                    <input type="text" placeholder="Ex: 15.450,00" className={styles.inputField} value={valor} onChange={(e) => setValor(e.target.value)} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>UG (Fonte)</label>
                                    <select className={styles.selectInput} value={fonteRecurso} onChange={(e) => setFonteRecurso(e.target.value)} required>
                                        <option value="160">160212</option>
                                        <option value="167">167212</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* SEÇÃO 2: DETALHES TÉCNICOS */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionHeader}>
                                <BsCalendarCheck /> <h4>2. DETALHES TÉCNICOS E PRAZOS</h4>
                            </div>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                                    <label>OM de Aplicação</label>
                                    <input type="text" placeholder="Ex: B ADM AP/5º RM" className={styles.inputField} value={omAplicacao} onChange={(e) => setOmAplicacao(e.target.value)} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Número do Processo</label>
                                    <input type="text" placeholder="Ex: 64138.008322/2025-91" className={styles.inputField} value={processo} onChange={(e) => setProcesso(e.target.value)} required />
                                </div>
                                
                                <div className={styles.inputGroup} style={{ gridColumn: 'span 3' }}>
                                    <label>Prazo para Empenho</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        <input 
                                            type={isImediato ? "text" : "date"} 
                                            className={styles.inputField}
                                            style={{ flex: 1, textAlign: isImediato ? 'center' : 'left' }}
                                            value={prazoEmpenho} 
                                            onChange={(e) => setPrazoEmpenho(e.target.value)} 
                                            disabled={isImediato}
                                            required 
                                        />
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: '800', color: '#2b6cb0', textTransform: 'uppercase' }}>
                                            <input type="checkbox" checked={isImediato} onChange={(e) => setIsImediato(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                                            Empenho Imediato
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SEÇÃO 3: DOCUMENTAÇÃO E FINALIDADE */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionHeader}>
                                <BsLink45Deg /> <h4>3. DOCUMENTAÇÃO E FINALIDADE</h4>
                            </div>
                            <div className={styles.inputGroup} style={{ marginBottom: '15px' }}>
                                <label>Link do Google Drive (Documento NC)</label>
                                <input type="url" placeholder="https://drive.google.com/..." className={styles.inputField} value={linkDrive} onChange={(e) => setLinkDrive(e.target.value)} required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Finalidade Detalhada</label>
                                <textarea className={styles.textareaField} placeholder="Descreva a finalidade desta Nota de Crédito..." value={finalidade} onChange={(e) => setFinalidade(e.target.value)} required />
                            </div>
                        </div>

                    </div>

                    <div className={styles.formFooter}>
                        <button type="button" className={styles.btnCancel} onClick={fecharE_Limpar}>CANCELAR</button>
                        <button type="submit" className={styles.btnSubmit}>CADASTRAR CRÉDITO</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default NewCredit;