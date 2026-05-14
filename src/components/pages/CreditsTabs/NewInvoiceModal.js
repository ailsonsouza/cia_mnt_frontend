import { useState, useEffect } from 'react'
import styles from '../../styles/styles_pages/styles_creditsTabs/NewNE.module.css' // Reutiliza o padrão visual de inputs grids

function NewInvoiceModal({ onClose, onSuccess }) {
    const [listaNEs, setListaNEs] = useState([])
    const [idNeSelecionada, setIdNeSelecionada] = useState('')
    
    // Campos do formulário
    const [numeroNF, setNumeroNF] = useState('')
    const [valorNF, setValorNF] = useState('')
    const [statusLiquidation, setStatusLiquidation] = useState('Não enviada para liquidação')
    const [processoNE, setProcessoNE] = useState('')
    const [linkDriveNF, setLinkDriveNF] = useState('')
    const [nomeFornecedor, setNomeFornecedor] = useState('')
    const [cnpjFornecedor, setCnpjFornecedor] = useState('')
    
    // Controle para processo customizado
    const [isProcessoCustom, setIsProcessoCustom] = useState(false)

    useEffect(() => {
        // Busca todas as Notas de Empenho para vinculação
        fetch('http://localhost:5000/credits_ne')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setListaNEs(data) })
            .catch(err => console.error("Erro ao buscar NEs:", err))
    }, [])

    // Autofill ao selecionar a NE
    const handleMudarNE = (idNE) => {
        setIdNeSelecionada(idNE)
        if (!idNE) {
            setNomeFornecedor('')
            setCnpjFornecedor('')
            setProcessoNE('')
            return
        }
        const neEncontrada = listaNEs.find(item => item.id === idNE)
        if (neEncontrada) {
            setNomeFornecedor(neEncontrada.nomeFornecedor || '')
            setCnpjFornecedor(neEncontrada.cnpjFornecedor || '')
            if (!isProcessoCustom) {
                // Tenta buscar o processo da NC origem ou o da própria NE
                setProcessoNE(neEncontrada.processo || '')
            }
        }
    }

    const handleSalvarNF = (e) => {
        e.preventDefault()

        const novaNF = {
            idNeVinculada: idNeSelecionada,
            numeroNF,
            nomeFornecedor,
            cnpjFornecedor,
            processoNF: processoNE,
            statusLiquidation,
            linkDriveNF,
            valorNF: parseFloat(valorNF.replace(/[^\d,.]/g, '').replace(',', '.')) || 0
        }

        fetch('http://localhost:5000/credits_invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaNF)
        })
        .then(res => {
            if (!res.ok) throw new Error()
            return res.json()
        })
        .then(() => {
            alert('Nota Fiscal cadastrada e vinculada com sucesso!')
            if (typeof onSuccess === 'function') onSuccess()
            onClose()
        })
        .catch(() => alert('Erro ao salvar no db.json.'))
    }

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h2>Inserir Nova Nota Fiscal (NF)</h2>
                <form className={styles.modalForm} onSubmit={handleSalvarNF}>
                    
                    <div className={styles.formGroupFull}>
                        <label>Vincular Nota de Empenho (N.E.)</label>
                        <select 
                            value={idNeSelecionada} 
                            onChange={(e) => handleMudarNE(e.target.value)} 
                            required 
                            className={styles.selectModalPrimary}
                        >
                            <option value="">-- Selecione a NE de Origem pelo Número --</option>
                            {listaNEs.map(item => (
                                <option key={item.id} value={item.id}>NE Nº {item.numeroNE} ({item.nomeFornecedor})</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Número da Nota Fiscal (NF)</label>
                        <input type="text" placeholder="Ex: NF 1452" value={numeroNF} onChange={(e) => setNumeroNF(e.target.value)} required />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Valor da Nota Fiscal (R$)</label>
                        <input type="text" placeholder="Ex: 4500,00" value={valorNF} onChange={(e) => setValorNF(e.target.value)} required />
                    </div>

                    <div className={styles.formGroupFull}>
                        <label>Status de Liquidação</label>
                        <select value={statusLiquidation} onChange={(e) => setStatusLiquidation(e.target.value)} className={styles.selectModalPrimary} required>
                            <option value="Não enviada para liquidação">Não enviada para liquidação</option>
                            <option value="Enviada para liquidação">Enviada para liquidação</option>
                            <option value="Liquidada">Liquidada</option>
                        </select>
                    </div>

                    <div className={styles.formGroupFull}>
                        <label>Número do Processo da NF</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <input 
                                type="text" 
                                value={processoNE} 
                                onChange={(e) => setProcessoNE(e.target.value)} 
                                disabled={!isProcessoCustom} 
                                required 
                                className={!isProcessoCustom ? styles.inputCalculado : ''} 
                            />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', whiteSpace: 'nowrap', fontWeight: 'bold', cursor: 'pointer' }}>
                                <input type="checkbox" checked={isProcessoCustom} onChange={(e) => { setIsProcessoCustom(e.target.checked); if(!e.target.checked) handleMudarNE(idNeSelecionada); }} />
                                Novo Processo
                            </label>
                        </div>
                    </div>

                    <div className={styles.formGroupFull}>
                        <label>Link do Arquivo no Google Drive</label>
                        <input type="url" placeholder="https://google.com..." value={linkDriveNF} onChange={(e) => setLinkDriveNF(e.target.value)} required />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Fornecedor (Importado)</label>
                        <input type="text" value={nomeFornecedor} disabled className={styles.inputCalculatedText} />
                    </div>

                    <div className={styles.formGroup}>
                        <label>CNPJ (Importado)</label>
                        <input type="text" value={cnpjFornecedor} disabled className={styles.inputCalculatedText} />
                    </div>

                    <div className={styles.modalActions}>
                        <button type="submit" className={styles.btnSalvar}>Vincular Nota Fiscal</button>
                        <button type="button" className={styles.btnCancelar} onClick={onClose}>Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default NewInvoiceModal
