import styles from '../../styles/styles_pages/styles_creditsTabs/NewCreditAndNE.module.css'

import { useState, useEffect } from 'react'
import { BsPlusSquareFill, BsInfoCircleFill, BsCalendarCheck, BsLink45Deg } from 'react-icons/bs'
import { useAuth } from '../../context/AuthContext'

function NewCredit({ onClose, onSuccess }) {
    const { usuarioAtual } = useAuth();
    
    const [nc, setNc] = useState('')
    const [finalidade, setFinalidade] = useState('')
    const [valor, setValor] = useState('')
    const [fonteRecurso, setFonteRecurso] = useState('160')
    const [prazoEmpenho, setPrazoEmpenho] = useState('')
    const [isImediato, setIsImediato] = useState(false)
    const [linkDrive, setLinkDrive] = useState('')

    // Mapeamento nível da seção
    const getNivelSecao = (secao) => {
        switch (secao) {
            case 'TESOURARIA': return 'DESCENTRALIZADORA';
            case 'COL': return 'INTERMEDIARIA';
            case 'GRCP': return 'REQUISITANTE';
            default: return 'DESCENTRALIZADORA';
        }
    };

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
        const agoraISO = hoje.toISOString();

        const valorApenasNumerosEVirgula = valor.replace(/[^\d,]/g, '');
        const valorComPontoDecimal = valorApenasNumerosEVirgula.replace(',', '.');
        const valorNumericoFinal = parseFloat(valorComPontoDecimal) || 0;

        const codigoUnico = gerarCodigoUnico(usuarioAtual.secao);
        const nivelOrigem = getNivelSecao(usuarioAtual.secao);

        const novoCredito = {
            id: Math.random().toString(36).substr(2, 11),
            nc,
            codigoUnico,
            codigoOrigemPermanente: codigoUnico,
            documentoAnterior: null,
            nivelOrigem,
            
            valorOriginal: valorNumericoFinal,
            detentorOriginal: usuarioAtual.secao,
            fonteRecurso,
            finalidade,
            prazoEmpenho,
            linkDrive,
            dataGeracao: dataGeracaoStr,
            
            saldoDisponivel: valorNumericoFinal,
            totalTransferido: 0,
            totalEmpenhado: 0,
            totalLiquidado: 0,
            
            versao: 1,
            ultimaAtualizacao: agoraISO,
            
            detentor: usuarioAtual.secao,
            statusRecebimento: null,
            transferenciaPendente: false,
            codigoTransferido: null
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
            alert(`Nota de Crédito cadastrada com sucesso!\n\nValor Original: ${valorNumericoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\nCódigo: ${codigoUnico}\nNível: ${nivelOrigem}`);
            if (typeof onSuccess === 'function') onSuccess();
            fecharE_Limpar();
        })
        .catch(() => alert('Erro ao salvar no banco de dados.'));
    };

    const fecharE_Limpar = () => {
        setNc(''); 
        setFinalidade('');
        setValor('');
        setFonteRecurso('160');
        setPrazoEmpenho('');
        setLinkDrive('');
        setIsImediato(false);
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
                        
                        <div className={styles.formSection}>
                            <div className={styles.sectionHeader}>
                                <BsInfoCircleFill /> <h4>1. IDENTIFICAÇÃO E VALOR</h4>
                            </div>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup}>
                                    <label>Número da NC</label>
                                    <input type="text" placeholder="Ex: 2025NC000807" className={styles.inputField} value={nc} onChange={(e) => setNc(e.target.value)} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Valor Original (R$)</label>
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

                        <div className={styles.formSection}>
                            <div className={styles.sectionHeader}>
                                <BsCalendarCheck /> <h4>2. PRAZO E DOCUMENTAÇÃO</h4>
                            </div>
                            <div className={styles.inputGrid}>
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
                                <div className={styles.inputGroup} style={{ gridColumn: 'span 3' }}>
                                    <label>Link do Google Drive (Documento NC)</label>
                                    <input type="url" placeholder="https://drive.google.com/..." className={styles.inputField} value={linkDrive} onChange={(e) => setLinkDrive(e.target.value)} required />
                                </div>
                            </div>
                        </div>

                        <div className={styles.formSection}>
                            <div className={styles.sectionHeader}>
                                <BsLink45Deg /> <h4>3. FINALIDADE DO CRÉDITO</h4>
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