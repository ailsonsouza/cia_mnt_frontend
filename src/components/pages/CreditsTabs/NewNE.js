import { useState, useEffect } from 'react'
import styles from '../../styles/styles_pages/styles_creditsTabs/NewNE.module.css'
import { BsPlusSquareFill, BsInfoCircleFill, BsFileEarmarkTextFill, BsBuilding } from 'react-icons/bs'

function NewNE({ onClose, onSuccess }) {
    // Listas do banco de dados
    const [listaNCs, setListaNCs] = useState([])
    const [listaNEs, setListaNEs] = useState([])
    const [listaPregaos, setListaPregaos] = useState([])
    const [listaItensPregao, setListaItensPregao] = useState([])

    // Estados de seleção
    const [idPregaoSelecionado, setIdPregaoSelecionado] = useState('')
    const [idNcSelecionada, setIdNcSelecionada] = useState('')
    const [ncDados, setNcDados] = useState({ processo: '', finalidade: '', omAplicacao: '', valor: 0, valorFormatado: 'R$ 0,00' })

    // Estados dos campos da Nova N.E.
    const [numeroNE, setNumeroNE] = useState('')
    const [idMaterialSelecionado, setIdMaterialSelecionado] = useState('')
    const [descricaoItemManual, setDescricaoItemManual] = useState('')
    const [nomeFornecedor, setNomeFornecedor] = useState('')
    const [cnpjFornecedor, setCnpjFornecedor] = useState('')
    const [linkDriveNE, setLinkDriveNE] = useState('')

    const [isModoManual, setIsModoManual] = useState(false)

    // 1. CARREGAMENTO INICIAL
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

    // 2. MONITORAMENTO DA NC SELECIONADA
    useEffect(() => {
        if (!idNcSelecionada) {
            setNcDados({ processo: '', finalidade: '', omAplicacao: '', valor: 0, valorFormatado: 'R$ 0,00' });
            return;
        }
        const ncEncontrada = listaNCs.find(item => item.id === idNcSelecionada);
        if (ncEncontrada) {
            setNcDados({
                processo: ncEncontrada.processo || '',
                finalidade: ncEncontrada.finalidade || '',
                omAplicacao: ncEncontrada.omAplicacao || '',
                valor: ncEncontrada.valor || 0,
                valorFormatado: ncEncontrada.valor ? ncEncontrada.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'
            });
        }
    }, [idNcSelecionada, listaNCs]);

    // 3. SELEÇÃO DE MATERIAL
    const handleMudarMaterial = (valorSelect) => {
        setIdMaterialSelecionado(valorSelect);
        if (valorSelect === 'OUTRO') {
            setIsModoManual(true);
            setDescricaoItemManual(''); setNomeFornecedor(''); setCnpjFornecedor('');
        } else if (valorSelect !== '') {
            setIsModoManual(false);
            const itemPregao = listaItensPregao.find(item => item.id === valorSelect);
            if (itemPregao) {
                setNomeFornecedor(itemPregao.fornecedor || '');
                setCnpjFornecedor(itemPregao.cnpj || '');
            }
        }
    }

    // 4. SALVAR
    const handleSalvarNE = (e) => {
        e.preventDefault();
        let materialFinal = isModoManual ? descricaoItemManual : "";
        if (!isModoManual) {
            const item = listaItensPregao.find(i => i.id === idMaterialSelecionado);
            materialFinal = item ? `Item ${item.item} - ${item.descricao}` : '';
        }

        const novaNE = {
            id: Math.random().toString(36).substr(2, 9),
            idPregaoVinculado: idPregaoSelecionado,
            idNcVinculada: idNcSelecionada,
            idItemPregaoVinculado: isModoManual ? null : idMaterialSelecionado,
            numeroNE,
            materialNE: materialFinal,
            nomeFornecedor,
            cnpjFornecedor,
            linkDriveNE,
            valorAtual: ncDados.valor,
            dataGeracaoNE: new Date().toISOString().split('T')[0],
            modalidade: isModoManual ? 'FORA_DO_PREGAO_MANUAL' : 'PREGAO_HOMOLOGADO'
        };

        fetch('http://localhost:5000/credits_ne', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaNE)
        }).then(() => {
            if (onSuccess) onSuccess();
            onClose();
        });
    }

    const idsNcEmpenhadas = new Set(listaNEs.map(ne => ne.idNcVinculada));
    const ncsDisponiveis = listaNCs.filter(nc => !idsNcEmpenhadas.has(nc.id));
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

                        {/* SEÇÃO 1: ORIGEM */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionHeader}>
                                <BsInfoCircleFill /> <h4>1. ORIGEM E VÍNCULO DE CRÉDITO</h4>
                            </div>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                                    <label>Selecione o Pregão</label>
                                    <select className={styles.selectInput} value={idPregaoSelecionado} onChange={(e) => { setIdPregaoSelecionado(e.target.value); setIdMaterialSelecionado(''); }} required>
                                        <option value="">-- Escolha o Pregão --</option>
                                        {listaPregaos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                    </select>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Vincular Nota de Crédito (NC)</label>
                                    <select className={styles.selectInput} value={idNcSelecionada} onChange={(e) => setIdNcSelecionada(e.target.value)} required>
                                        <option value="">-- Selecione a NC --</option>
                                        {ncsDisponiveis.map(item => <option key={item.id} value={item.id}>{item.nc} (UG: {item.fonteRecurso})</option>)}
                                    </select>
                                </div>
                            </div>
                            {idNcSelecionada && (
                                <div className={styles.ncInfoBox}>
                                    <div className={styles.ncInfoItem}><label>Valor da NC:</label> <span className={styles.greenText}>{ncDados.valorFormatado}</span></div>
                                    <div className={styles.ncInfoItem}><label>Processo:</label> <span>{ncDados.processo}</span></div>
                                </div>
                            )}
                        </div>

                        {/* SEÇÃO 2: DADOS DO EMPENHO */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionHeader}>
                                <BsFileEarmarkTextFill /> <h4>2. DADOS DA NOTA DE EMPENHO</h4>
                            </div>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup}>
                                    <label>Número da N.E.</label>
                                    <input type="text" placeholder="Ex: 2026NE000142" className={styles.inputField} value={numeroNE} onChange={(e) => setNumeroNE(e.target.value)} required />
                                </div>
                                <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                                    <label>Material / Item do Pregão</label>
                                    <select className={styles.selectInput} value={idMaterialSelecionado} onChange={(e) => handleMudarMaterial(e.target.value)} required disabled={!idPregaoSelecionado}>
                                        <option value="">-- Selecione o item homologado --</option>
                                        {itensFiltrados.map(item => <option key={item.id} value={item.id}>Item {item.item} - {item.descricao.substring(0, 50)}...</option>)}
                                        <option value="OUTRO" style={{ color: '#c53030', fontWeight: 'bold' }}>+ OUTRA MODALIDADE (CARONA/DISPENSA)</option>
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

                        {/* SEÇÃO 3: FORNECEDOR */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionHeader}>
                                <BsBuilding /> <h4>3. FORNECEDOR E DOCUMENTO</h4>
                            </div>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                                    <label>Razão Social</label>
                                    <input type="text" className={styles.inputField} value={nomeFornecedor} onChange={(e) => setNomeFornecedor(e.target.value)} disabled={!isModoManual} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>CNPJ</label>
                                    <input type="text" className={styles.inputField} value={cnpjFornecedor} onChange={(e) => setCnpjFornecedor(e.target.value)} disabled={!isModoManual} required />
                                </div>
                            </div>
                            <div className={styles.inputGroup} style={{ marginTop: '15px' }}>
                                <label>Link do Google Drive (Documento PDF)</label>
                                <input type="url" placeholder="https://drive.google.com/..." className={styles.inputField} value={linkDriveNE} onChange={(e) => setLinkDriveNE(e.target.value)} required />
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

export default NewNE