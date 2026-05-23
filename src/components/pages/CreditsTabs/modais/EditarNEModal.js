import { useState, useEffect } from 'react';
import styles from '../../../styles/styles_pages/styles_creditsTabs/NewCreditAndNE.module.css';
import { BsPencil, BsInfoCircleFill, BsFileEarmarkTextFill, BsBuilding, BsCalendarDate } from 'react-icons/bs';

function EditarNEModal({ ne, ncOrigem, onClose, onSuccess }) {
    const [listaPregaos, setListaPregaos] = useState([]);
    const [listaItensPregao, setListaItensPregao] = useState([]);
    
    // Estados do formulário
    const [numeroNE, setNumeroNE] = useState(ne.numeroNE || '');
    const [finalidade, setFinalidade] = useState(ne.finalidade || '');
    const [omAplicacao, setOmAplicacao] = useState(ne.omAplicacao || '');
    const [processo, setProcesso] = useState(ne.processo || '');
    const [linkDriveNE, setLinkDriveNE] = useState(ne.linkDriveNE || '');
    const [valorAtual, setValorAtual] = useState(ne.valorAtual?.toString() || '');
    const [erro, setErro] = useState('');
    
    // Estados para seleção de material
    const [idPregaoSelecionado, setIdPregaoSelecionado] = useState('');
    const [idMaterialSelecionado, setIdMaterialSelecionado] = useState('');
    const [descricaoItemManual, setDescricaoItemManual] = useState('');
    const [nomeFornecedor, setNomeFornecedor] = useState(ne.nomeFornecedor || '');
    const [cnpjFornecedor, setCnpjFornecedor] = useState(ne.cnpjFornecedor || '');
    const [isModoManual, setIsModoManual] = useState(false);
    
    // Data de geração
    const [dataGeracaoNE, setDataGeracaoNE] = useState(ne.dataGeracaoNE || '');
    const [isHoje, setIsHoje] = useState(false);
    
    const valorAtualNE = ne.valorAtual || 0;
    const valorDisponivelNC = ncOrigem?.valor || 0;
    const valorDisponivelNCFormatado = valorDisponivelNC.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    // Carregar pregões e itens
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resPregao, resCredits] = await Promise.all([
                    fetch('http://localhost:5000/pregaos').then(r => r.json()),
                    fetch('http://localhost:5000/credits').then(r => r.json())
                ]);
                setListaPregaos(Array.isArray(resPregao) ? resPregao : []);
                setListaItensPregao(Array.isArray(resCredits) ? resCredits : []);
            } catch (err) {
                console.error("Erro ao carregar dados:", err);
            }
        };
        fetchData();
    }, []);
    
    // Configurar o modo manual ou pregão baseado no materialNE existente
    useEffect(() => {
        if (ne.materialNE && listaItensPregao.length > 0) {
            // Verifica se o material existe nos itens do pregão
            const itemExistente = listaItensPregao.find(item => 
                `Item ${item.item} - ${item.descricao}` === ne.materialNE
            );
            
            if (itemExistente) {
                setIsModoManual(false);
                setIdMaterialSelecionado(itemExistente.id);
                // Busca o pregão deste item
                const pregaoDoItem = listaPregaos.find(p => p.id === itemExistente.idPregaoVinculado);
                if (pregaoDoItem) {
                    setIdPregaoSelecionado(pregaoDoItem.id);
                }
                setNomeFornecedor(itemExistente.fornecedor || '');
                setCnpjFornecedor(itemExistente.cnpj || '');
            } else {
                setIsModoManual(true);
                setDescricaoItemManual(ne.materialNE || '');
                setNomeFornecedor(ne.nomeFornecedor || '');
                setCnpjFornecedor(ne.cnpjFornecedor || '');
            }
        }
    }, [ne, listaItensPregao, listaPregaos]);
    
    // Quando mudar o pregão, limpar o item selecionado
    useEffect(() => {
        setIdMaterialSelecionado('');
    }, [idPregaoSelecionado]);
    
    // Calcular a data atual
    useEffect(() => {
        if (isHoje) {
            const hoje = new Date().toISOString().split('T')[0];
            setDataGeracaoNE(hoje);
        }
    }, [isHoje]);
    
    const handleMudarMaterial = (valorSelect) => {
        setIdMaterialSelecionado(valorSelect);
        if (valorSelect === 'OUTRO') {
            setIsModoManual(true);
            setDescricaoItemManual('');
            setNomeFornecedor('');
            setCnpjFornecedor('');
        } else if (valorSelect !== '') {
            setIsModoManual(false);
            setDescricaoItemManual('');
            const itemPregao = listaItensPregao.find(item => item.id === valorSelect);
            if (itemPregao) {
                setNomeFornecedor(itemPregao.fornecedor || '');
                setCnpjFornecedor(itemPregao.cnpj || '');
            }
        } else {
            setIsModoManual(false);
            setDescricaoItemManual('');
            setNomeFornecedor('');
            setCnpjFornecedor('');
        }
    };
    
    const validarValor = (valorNumerico) => {
        if (valorNumerico <= 0) {
            setErro('Informe um valor válido maior que zero');
            return false;
        }
        
        // O novo valor não pode ser maior que o valor disponível na NC + o valor atual da NE
        const limiteMaximo = valorAtualNE + valorDisponivelNC;
        if (valorNumerico > limiteMaximo) {
            setErro(`Valor excede o limite disponível. Máximo: ${limiteMaximo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
            return false;
        }
        
        return true;
    };
    
    const handleSalvarEdicao = (e) => {
        e.preventDefault();
        
        const valorNumerico = parseFloat(valorAtual.replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
        
        if (!validarValor(valorNumerico)) return;
        
        setErro('');
        
        // Prepara o material final
        let materialFinal = '';
        if (isModoManual) {
            materialFinal = descricaoItemManual;
        } else if (idMaterialSelecionado && idMaterialSelecionado !== 'OUTRO') {
            const item = listaItensPregao.find(i => i.id === idMaterialSelecionado);
            materialFinal = item ? `Item ${item.item} - ${item.descricao}` : '';
        }
        
        // Calcula a diferença de valor para ajustar a NC
        const diferencaValor = valorNumerico - valorAtualNE;
        
        // Atualiza a NE
        const neAtualizada = {
            ...ne,
            numeroNE,
            finalidade,
            omAplicacao,
            processo,
            linkDriveNE,
            valorAtual: valorNumerico,
            materialNE: materialFinal,
            nomeFornecedor,
            cnpjFornecedor,
            dataGeracaoNE,
            modalidade: isModoManual ? 'FORA_DO_PREGAO_MANUAL' : 'PREGAO_HOMOLOGADO',
            idPregaoVinculado: isModoManual ? null : idPregaoSelecionado,
            idItemPregaoVinculado: isModoManual ? null : (idMaterialSelecionado !== 'OUTRO' ? idMaterialSelecionado : null)
        };
        
        // Se houver diferença, atualiza a NC também
        if (diferencaValor !== 0 && ncOrigem) {
            const novoSaldoNC = ncOrigem.valor - diferencaValor;
            
            if (novoSaldoNC < 0) {
                setErro('Não há saldo suficiente na NC para este aumento');
                return;
            }
            
            const ncAtualizada = {
                ...ncOrigem,
                valor: novoSaldoNC
            };
            
            Promise.all([
                fetch(`http://localhost:5000/credits_ne/${ne.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(neAtualizada)
                }),
                fetch(`http://localhost:5000/credits_nc/${ncOrigem.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(ncAtualizada)
                })
            ])
            .then(() => {
                alert(`N.E. editada com sucesso!\n\nValor ajustado: ${diferencaValor > 0 ? '+' : ''}${diferencaValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
                if (onSuccess) onSuccess();
                onClose();
            })
            .catch(err => {
                console.error('Erro ao editar:', err);
                alert('Erro ao editar N.E. Tente novamente.');
            });
        } else {
            // Apenas atualiza a NE
            fetch(`http://localhost:5000/credits_ne/${ne.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(neAtualizada)
            })
            .then(() => {
                alert('N.E. editada com sucesso!');
                if (onSuccess) onSuccess();
                onClose();
            })
            .catch(err => {
                console.error('Erro ao editar:', err);
                alert('Erro ao editar N.E. Tente novamente.');
            });
        }
    };
    
    const itensFiltrados = listaItensPregao.filter(i => i.idPregaoVinculado === idPregaoSelecionado);
    
    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalForm}>
                <div className={styles.modalHeader} style={{ backgroundColor: '#2b6cb0' }}>
                    <BsPencil />
                    <h3>EDITAR N.E.</h3>
                </div>
                
                <form className={styles.formStyled} onSubmit={handleSalvarEdicao}>
                    <div className={styles.formContent}>
                        {/* SEÇÃO: INFORMAÇÕES DO CRÉDITO */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionHeader}>
                                <BsInfoCircleFill /> <h4>1. INFORMAÇÕES DO CRÉDITO</h4>
                            </div>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup}>
                                    <label>NÚMERO DA N.E.</label>
                                    <input type="text" className={styles.inputField} value={numeroNE} onChange={(e) => setNumeroNE(e.target.value)} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>VALOR DA N.E. (R$)</label>
                                    <input type="text" className={styles.inputField} placeholder="0,00" value={valorAtual} onChange={(e) => setValorAtual(e.target.value)} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>DATA DE GERAÇÃO</label>
                                    <div className={styles.prazoContainer}>
                                        <input 
                                            type="date" 
                                            className={isHoje ? styles.inputImediatoAtivo : styles.inputField}
                                            value={dataGeracaoNE} 
                                            onChange={(e) => setDataGeracaoNE(e.target.value)} 
                                            disabled={isHoje}
                                            required 
                                        />
                                        <label className={styles.checkboxLabel_Small}>
                                            <input type="checkbox" checked={isHoje} onChange={(e) => setIsHoje(e.target.checked)} />
                                            Hoje
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup}>
                                    <label>OM DE APLICAÇÃO</label>
                                    <input type="text" className={styles.inputField} value={omAplicacao} onChange={(e) => setOmAplicacao(e.target.value)} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>NÚMERO DO PROCESSO</label>
                                    <input type="text" className={styles.inputField} value={processo} onChange={(e) => setProcesso(e.target.value)} required />
                                </div>
                            </div>
                            <div className={styles.infoBox} style={{ marginTop: '15px', backgroundColor: '#f0fff4', borderLeftColor: '#38a169' }}>
                                <div className={styles.infoText}>
                                    <strong>Saldo disponível na NC:</strong> {valorDisponivelNCFormatado}
                                    <br />
                                    <strong>Valor atual da N.E.:</strong> {valorAtualNE.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>
                            </div>
                        </div>
                        
                        {/* SEÇÃO: MATERIAL / ITEM */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionHeader}>
                                <BsFileEarmarkTextFill /> <h4>2. MATERIAL / ITEM</h4>
                            </div>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                                    <label>PREGÃO</label>
                                    <select 
                                        className={styles.selectInput} 
                                        value={idPregaoSelecionado} 
                                        onChange={(e) => setIdPregaoSelecionado(e.target.value)} 
                                        disabled={isModoManual}
                                    >
                                        <option value="">-- Selecione o Pregão --</option>
                                        {listaPregaos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                    </select>
                                </div>
                                <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                                    <label>ITEM DO PREGÃO</label>
                                    <select 
                                        className={styles.selectInput} 
                                        value={idMaterialSelecionado} 
                                        onChange={(e) => handleMudarMaterial(e.target.value)} 
                                        disabled={!idPregaoSelecionado || isModoManual}
                                    >
                                        <option value="">-- Selecione o item homologado --</option>
                                        {itensFiltrados.map(item => (
                                            <option key={item.id} value={item.id}>
                                                Item {item.item} - {item.descricao.substring(0, 55)}...
                                            </option>
                                        ))}
                                        <option value="OUTRO" style={{ color: '#c53030', fontWeight: 'bold' }}>
                                            + OUTRA MODALIDADE (CARONA/DISPENSA)
                                        </option>
                                    </select>
                                </div>
                            </div>
                            
                            {/* Botão para alternar para modo manual */}
                            {!isModoManual && idPregaoSelecionado && (
                                <button 
                                    type="button" 
                                    className={styles.btnModoManual}
                                    onClick={() => setIsModoManual(true)}
                                    style={{ marginTop: '10px', fontSize: '0.7rem', padding: '5px 10px' }}
                                >
                                    Não encontrou o item? Clique aqui para informar manualmente
                                </button>
                            )}
                            
                            {isModoManual && (
                                <>
                                    <div className={styles.inputGroup} style={{ marginTop: '15px' }}>
                                        <label style={{ color: '#c53030' }}>DESCRIÇÃO MANUAL DO MATERIAL</label>
                                        <textarea 
                                            className={styles.textareaField} 
                                            value={descricaoItemManual} 
                                            onChange={(e) => setDescricaoItemManual(e.target.value)} 
                                            required 
                                            placeholder="Descreva o material/serviço..."
                                        />
                                    </div>
                                    <button 
                                        type="button" 
                                        className={styles.btnModoManual}
                                        onClick={() => {
                                            setIsModoManual(false);
                                            setDescricaoItemManual('');
                                        }}
                                        style={{ marginTop: '10px', fontSize: '0.7rem', padding: '5px 10px', backgroundColor: '#64748b' }}
                                    >
                                        Voltar para seleção do pregão
                                    </button>
                                </>
                            )}
                        </div>
                        
                        {/* SEÇÃO: FORNECEDOR */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionHeader}>
                                <BsBuilding /> <h4>3. FORNECEDOR</h4>
                            </div>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                                    <label>RAZÃO SOCIAL</label>
                                    <input 
                                        type="text" 
                                        className={styles.inputField} 
                                        value={nomeFornecedor} 
                                        onChange={(e) => setNomeFornecedor(e.target.value)} 
                                        required 
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>CNPJ</label>
                                    <input 
                                        type="text" 
                                        className={styles.inputField} 
                                        value={cnpjFornecedor} 
                                        onChange={(e) => setCnpjFornecedor(e.target.value)} 
                                        required 
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* SEÇÃO: DOCUMENTO */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionHeader}>
                                <BsCalendarDate /> <h4>4. DOCUMENTO</h4>
                            </div>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup} style={{ gridColumn: 'span 3' }}>
                                    <label>LINK DO GOOGLE DRIVE (PDF)</label>
                                    <input 
                                        type="url" 
                                        className={styles.inputField} 
                                        placeholder="https://drive.google.com/..." 
                                        value={linkDriveNE} 
                                        onChange={(e) => setLinkDriveNE(e.target.value)} 
                                        required 
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* SEÇÃO: FINALIDADE */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionHeader}>
                                <BsFileEarmarkTextFill /> <h4>5. FINALIDADE</h4>
                            </div>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup} style={{ gridColumn: 'span 3' }}>
                                    <label>FINALIDADE DO EMPENHO</label>
                                    <textarea 
                                        className={styles.textareaField} 
                                        value={finalidade} 
                                        onChange={(e) => setFinalidade(e.target.value)} 
                                        rows="4"
                                        required 
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {erro && (
                            <div className={styles.erroBox}>
                                {erro}
                            </div>
                        )}
                    </div>
                    
                    <div className={styles.formFooter}>
                        <button type="button" className={styles.btnCancel} onClick={onClose}>CANCELAR</button>
                        <button type="submit" className={styles.btnSubmit}>SALVAR ALTERAÇÕES</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditarNEModal;