import styles from '../../styles/styles_pages/styles_creditsTabs/NewCreditAndNE.module.css'

import { useState, useEffect } from 'react'
import { BsPlusSquareFill, BsInfoCircleFill, BsFileEarmarkTextFill, BsBuilding, BsCalendarDate } from 'react-icons/bs'
import { useAuth } from '../../context/AuthContext'

function NewNE({ onClose, onSuccess, creditoParaEmpenhar = null }) {
    const { usuarioAtual } = useAuth();
    
    const [listaNCs, setListaNCs] = useState([])
    const [listaNEs, setListaNEs] = useState([])
    const [listaPregaos, setListaPregaos] = useState([])
    const [listaItensPregao, setListaItensPregao] = useState([])

    const [idPregaoSelecionado, setIdPregaoSelecionado] = useState('')
    const [idNcSelecionada, setIdNcSelecionada] = useState('')
    const [ncDados, setNcDados] = useState({ saldoDisponivel: 0, saldoFormatado: 'R$ 0,00', finalidade: '', prazoEmpenho: '' })

    const [numeroNE, setNumeroNE] = useState('')
    const [finalidadeNE, setFinalidadeNE] = useState('')
    const [omAplicacao, setOmAplicacao] = useState('')
    const [processo, setProcesso] = useState('')
    const [idMaterialSelecionado, setIdMaterialSelecionado] = useState('')
    const [descricaoItemManual, setDescricaoItemManual] = useState('')
    const [nomeFornecedor, setNomeFornecedor] = useState('')
    const [cnpjFornecedor, setCnpjFornecedor] = useState('')
    const [linkDriveNE, setLinkDriveNE] = useState('')
    const [isModoManual, setIsModoManual] = useState(false)
    const [valorEmpenho, setValorEmpenho] = useState('')
    const [isValorParcial, setIsValorParcial] = useState(false)

    const [dataGeracaoNE, setDataGeracaoNE] = useState('')
    const [isHoje, setIsHoje] = useState(true)

    useEffect(() => {
        if (creditoParaEmpenhar) {
            setIdNcSelecionada(creditoParaEmpenhar.id);
            setValorEmpenho(creditoParaEmpenhar.saldoDisponivel?.toString() || '');
            
            fetch(`http://localhost:5000/credits_nc/${creditoParaEmpenhar.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data) {
                        setNcDados({
                            saldoDisponivel: data.saldoDisponivel || 0,
                            saldoFormatado: (data.saldoDisponivel || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                            finalidade: data.finalidade || '',
                            prazoEmpenho: data.prazoEmpenho || ''
                        });
                        setFinalidadeNE(data.finalidade || '');
                    }
                });
        }
    }, [creditoParaEmpenhar]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resNC, resNE, resPregao, resCredits] = await Promise.all([
                    fetch('http://localhost:5000/credits_nc').then(r => r.json()),
                    fetch('http://localhost:5000/credits_ne').then(r => r.json()),
                    fetch('http://localhost:5000/pregaos').then(r => r.json()),
                    fetch('http://localhost:5000/credits').then(r => r.json())
                ]);

                setListaNCs(Array.isArray(resNC) ? resNC : []);
                setListaNEs(Array.isArray(resNE) ? resNE : []);
                setListaPregaos(Array.isArray(resPregao) ? resPregao : []);
                setListaItensPregao(Array.isArray(resCredits) ? resCredits : []);
            } catch (err) {
                console.error("Erro ao carregar dados:", err);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (isHoje) {
            const hoje = new Date().toISOString().split('T')[0];
            setDataGeracaoNE(hoje);
        } else {
            setDataGeracaoNE('');
        }
    }, [isHoje]);

    useEffect(() => {
        if (!idNcSelecionada) {
            setNcDados({ saldoDisponivel: 0, saldoFormatado: 'R$ 0,00', finalidade: '', prazoEmpenho: '' });
            setFinalidadeNE('');
            return;
        }
        const ncEncontrada = listaNCs.find(item => item.id === idNcSelecionada);
        if (ncEncontrada) {
            setNcDados({
                saldoDisponivel: ncEncontrada.saldoDisponivel || 0,
                saldoFormatado: (ncEncontrada.saldoDisponivel || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                finalidade: ncEncontrada.finalidade || '',
                prazoEmpenho: ncEncontrada.prazoEmpenho || ''
            });
            setFinalidadeNE(ncEncontrada.finalidade || '');
            
            if (!creditoParaEmpenhar && !isValorParcial) {
                setValorEmpenho(ncEncontrada.saldoDisponivel?.toString() || '');
            }
        }
    }, [idNcSelecionada, listaNCs, creditoParaEmpenhar, isValorParcial]);

    const handleMudarMaterial = (valorSelect) => {
        setIdMaterialSelecionado(valorSelect);
        if (valorSelect === 'OUTRO') {
            setIsModoManual(true);
            setDescricaoItemManual(''); 
            setNomeFornecedor(''); 
            setCnpjFornecedor('');
        } else if (valorSelect !== '') {
            setIsModoManual(false);
            const itemPregao = listaItensPregao.find(item => item.id === valorSelect);
            if (itemPregao) {
                setNomeFornecedor(itemPregao.fornecedor || '');
                setCnpjFornecedor(itemPregao.cnpj || '');
            }
        }
    }

    const validarValorEmpenho = () => {
        const valorNumerico = parseFloat(valorEmpenho.replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
        const valorDisponivel = ncDados.saldoDisponivel;
        
        if (valorNumerico <= 0) {
            alert('Informe um valor válido maior que zero');
            return false;
        }
        
        if (valorNumerico > valorDisponivel) {
            alert(`Valor excede o limite disponível (${valorDisponivel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`);
            return false;
        }
        
        return true;
    };

    const handleSalvarNE = async (e) => {
        e.preventDefault();
        
        if (!validarValorEmpenho()) return;
        
        let materialFinal = isModoManual ? descricaoItemManual : "";
        if (!isModoManual && idMaterialSelecionado && idMaterialSelecionado !== 'OUTRO') {
            const item = listaItensPregao.find(i => i.id === idMaterialSelecionado);
            materialFinal = item ? `Item ${item.item} - ${item.descricao}` : '';
        }
        
        const valorNumerico = parseFloat(valorEmpenho.replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
        const ncEncontrada = listaNCs.find(item => item.id === idNcSelecionada);
        
        // CORREÇÃO: Abate do saldoDisponivel da NC
        const novoSaldoNC = ncEncontrada.saldoDisponivel - valorNumerico;
        
        const ncAtualizada = {
            ...ncEncontrada,
            saldoDisponivel: novoSaldoNC,
            totalEmpenhado: (ncEncontrada.totalEmpenhado || 0) + valorNumerico,
            versao: (ncEncontrada.versao || 0) + 1,
            ultimaAtualizacao: new Date().toISOString()
        };
        
        const novaNE = {
            id: Math.random().toString(36).substr(2, 11),
            idPregaoVinculado: idPregaoSelecionado,
            idNcVinculada: idNcSelecionada,
            idItemPregaoVinculado: (isModoManual || idMaterialSelecionado === 'OUTRO') ? null : idMaterialSelecionado,
            numeroNE,
            finalidade: finalidadeNE,
            omAplicacao: omAplicacao,
            processo: processo,
            materialNE: materialFinal,
            nomeFornecedor,
            cnpjFornecedor,
            linkDriveNE,
            valorAtual: valorNumerico,
            totalLiquidado: 0,
            dataGeracaoNE: dataGeracaoNE,
            modalidade: isModoManual ? 'FORA_DO_PREGAO_MANUAL' : 'PREGAO_HOMOLOGADO',
            dataCriacao: new Date().toISOString()
        };
        
        try {
            await Promise.all([
                fetch(`http://localhost:5000/credits_nc/${idNcSelecionada}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(ncAtualizada)
                }),
                fetch('http://localhost:5000/credits_ne', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(novaNE)
                })
            ]);
            
            alert(`Nota de Empenho cadastrada com sucesso!\n\nValor empenhado: ${valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\nSaldo restante da NC: ${novoSaldoNC.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error("Erro ao salvar:", err);
            alert('Erro ao cadastrar Nota de Empenho.');
        }
    }

    const ncsDisponiveis = listaNCs.filter(nc => 
        (nc.saldoDisponivel || 0) > 0 && 
        nc.detentor === usuarioAtual.secao &&
        (nc.statusRecebimento === 'RECEBIDO' || nc.statusRecebimento === undefined || nc.statusRecebimento === null)
    );
    
    const itensFiltrados = listaItensPregao.filter(i => i.idPregaoVinculado === idPregaoSelecionado);

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalForm}>
                <div className={styles.modalHeader}>
                    <BsPlusSquareFill />
                    <h3>GERAR NOVA NOTA DE EMPENHO (N.E.)</h3>
                </div>

                <form className={styles.formStyled} onSubmit={handleSalvarNE}>
                    <div className={styles.formContent}>

                        <div className={styles.formSection}>
                            <div className={styles.sectionHeader}>
                                <BsInfoCircleFill /> <h4>1. ORIGEM DO CRÉDITO</h4>
                            </div>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                                    <label>Selecione a Nota de Crédito (NC)</label>
                                    <select 
                                        className={styles.selectInput} 
                                        value={idNcSelecionada} 
                                        onChange={(e) => setIdNcSelecionada(e.target.value)} 
                                        required
                                        disabled={!!creditoParaEmpenhar}
                                    >
                                        <option value="">-- Escolha a NC --</option>
                                        {ncsDisponiveis.map(item => (
                                            <option key={item.id} value={item.id}>
                                                {item.nc} - {item.codigoUnico} (Saldo: {item.saldoDisponivel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {idNcSelecionada && (
                                <div className={styles.ncInfoBox}>
                                    <div className={styles.ncInfoItem}>
                                        <label>Saldo disponível:</label> 
                                        <span className={styles.greenText}>{ncDados.saldoFormatado}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.formSection}>
                            <div className={styles.sectionHeader}>
                                <BsCalendarDate /> <h4>2. VALOR DO EMPENHO</h4>
                            </div>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                                    <label>Valor a Empenhar (R$)</label>
                                    <input 
                                        type="text" 
                                        className={styles.inputField}
                                        placeholder="Ex: 5.000,00"
                                        value={valorEmpenho}
                                        onChange={(e) => setValorEmpenho(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Empenho Parcial?</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={isValorParcial}
                                            onChange={(e) => {
                                                setIsValorParcial(e.target.checked);
                                                if (!e.target.checked && ncDados.saldoDisponivel) {
                                                    setValorEmpenho(ncDados.saldoDisponivel.toString());
                                                } else if (e.target.checked) {
                                                    setValorEmpenho('');
                                                }
                                            }}
                                            disabled={!!creditoParaEmpenhar}
                                        />
                                        <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b' }}>
                                            Sim, quero empenhar apenas parte do valor
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.formSection}>
                            <div className={styles.sectionHeader}>
                                <BsFileEarmarkTextFill /> <h4>3. DADOS DA NOTA DE EMPENHO</h4>
                            </div>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup}>
                                    <label>Número da N.E.</label>
                                    <input type="text" placeholder="Ex: 2026NE000142" className={styles.inputField} value={numeroNE} onChange={(e) => setNumeroNE(e.target.value)} required />
                                </div>

                                <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                                    <label>Data de Geração</label>
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

                                <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                                    <label>OM de Aplicação</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: B ADM AP/5º RM" 
                                        className={styles.inputField} 
                                        value={omAplicacao} 
                                        onChange={(e) => setOmAplicacao(e.target.value)} 
                                        required 
                                    />
                                </div>

                                <div className={styles.inputGroup}>
                                    <label>Número do Processo</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: 64138.008322/2025-91" 
                                        className={styles.inputField} 
                                        value={processo} 
                                        onChange={(e) => setProcesso(e.target.value)} 
                                        required 
                                    />
                                </div>

                                <div className={styles.inputGroup} style={{ gridColumn: 'span 3' }}>
                                    <label>Finalidade do Empenho</label>
                                    <textarea 
                                        className={styles.textareaField} 
                                        value={finalidadeNE} 
                                        onChange={(e) => setFinalidadeNE(e.target.value)} 
                                        placeholder="Descreva a finalidade específica deste empenho..."
                                        rows="3"
                                        required 
                                    />
                                </div>

                                <div className={styles.inputGroup} style={{ gridColumn: 'span 3' }}>
                                    <label>Pregão / Material</label>
                                    <select 
                                        className={styles.selectInput} 
                                        value={idPregaoSelecionado} 
                                        onChange={(e) => setIdPregaoSelecionado(e.target.value)} 
                                        required
                                    >
                                        <option value="">-- Selecione o Pregão --</option>
                                        {listaPregaos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                    </select>
                                </div>

                                <div className={styles.inputGroup} style={{ gridColumn: 'span 3' }}>
                                    <label>Item do Pregão</label>
                                    <select 
                                        className={styles.selectInput} 
                                        value={idMaterialSelecionado} 
                                        onChange={(e) => handleMudarMaterial(e.target.value)} 
                                        required 
                                        disabled={!idPregaoSelecionado}
                                    >
                                        <option value="">-- Selecione o item homologado --</option>
                                        {itensFiltrados.map(item => (
                                            <option key={item.id} value={item.id}>
                                                Item {item.item} - {item.descricao.substring(0, 50)}...
                                            </option>
                                        ))}
                                        <option value="OUTRO" style={{ color: '#c53030', fontWeight: 'bold' }}>
                                            + OUTRA MODALIDADE (CARONA/DISPENSA)
                                        </option>
                                    </select>
                                </div>
                            </div>
                            {isModoManual && (
                                <div className={styles.inputGroup} style={{ marginTop: '15px' }}>
                                    <label style={{ color: '#c53030' }}>Descrição Detalhada do Material</label>
                                    <textarea className={styles.textareaField} value={descricaoItemManual} onChange={(e) => setDescricaoItemManual(e.target.value)} required />
                                </div>
                            )}
                        </div>

                        <div className={styles.formSection}>
                            <div className={styles.sectionHeader}>
                                <BsBuilding /> <h4>4. FORNECEDOR E DOCUMENTO</h4>
                            </div>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                                    <label>Razão Social</label>
                                    <input 
                                        type="text" 
                                        className={isModoManual ? styles.inputField : styles.inputField} 
                                        style={!isModoManual && idMaterialSelecionado && idMaterialSelecionado !== 'OUTRO' ? {backgroundColor: '#f1f5f9', color: '#64748b', borderStyle: 'dashed'} : {}}
                                        value={nomeFornecedor} 
                                        onChange={(e) => setNomeFornecedor(e.target.value)} 
                                        disabled={!isModoManual && idMaterialSelecionado !== 'OUTRO'} 
                                        required 
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>CNPJ</label>
                                    <input 
                                        type="text" 
                                        className={isModoManual ? styles.inputField : styles.inputField} 
                                        style={!isModoManual && idMaterialSelecionado && idMaterialSelecionado !== 'OUTRO' ? {backgroundColor: '#f1f5f9', color: '#64748b', borderStyle: 'dashed'} : {}}
                                        value={cnpjFornecedor} 
                                        onChange={(e) => setCnpjFornecedor(e.target.value)} 
                                        disabled={!isModoManual && idMaterialSelecionado !== 'OUTRO'} 
                                        required 
                                    />
                                </div>
                                <div className={styles.inputGroup} style={{ gridColumn: 'span 3' }}>
                                    <label>Link do Google Drive (Documento PDF)</label>
                                    <input 
                                        type="url" 
                                        placeholder="https://drive.google.com/..." 
                                        className={styles.inputField} 
                                        value={linkDriveNE} 
                                        onChange={(e) => setLinkDriveNE(e.target.value)} 
                                        required 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.formFooter}>
                        <button type="button" className={styles.btnCancel} onClick={onClose}>CANCELAR</button>
                        <button type="submit" className={styles.btnSubmit}>CADASTRAR EMPENHO</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default NewNE;