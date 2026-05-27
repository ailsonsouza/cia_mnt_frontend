// src/components/pages/CreditsTabs/modais/RPNPModal.js
import { useState, useEffect } from 'react';
import styles from '../../../styles/styles_pages/styles_creditsTabs/styles_modais/RPNPModal.module.css';
import { BsPlusSquareFill, BsInfoCircleFill, BsFileEarmarkTextFill, BsBuilding, BsCalendarDate, BsLink45Deg } from 'react-icons/bs';
import { useAuth } from '../../../context/AuthContext';

function RPNPModal({ 
    isOpen, 
    onClose, 
    onSuccess, 
    modo,           // 'incluir' ou 'editar'
    dadosIniciais,  // dados da RPNP para edição (opcional)
    fonteRecurso    // '160' ou '167'
}) {
    const { usuarioAtual } = useAuth();
    
    // Estados do formulário
    const [idEmEdicao, setIdEmEdicao] = useState(null);
    const [numeroNC, setNumeroNC] = useState('');
    const [processoNC, setProcessoNC] = useState('');
    const [omAplicacao, setOmAplicacao] = useState('');
    const [valorNC, setValorNC] = useState('');
    const [finalidadeNC, setFinalidadeNC] = useState('');
    const [linkDriveNC, setLinkDriveNC] = useState('');
    const [numeroNE, setNumeroNE] = useState('');
    const [idPregaoSelecionado, setIdPregaoSelecionado] = useState('');
    const [idItemPregaoSelecionado, setIdItemPregaoSelecionado] = useState('');
    const [descricaoItemManual, setDescricaoItemManual] = useState('');
    const [isOutraModalidade, setIsOutraModalidade] = useState(false);
    const [nomeFornecedor, setNomeFornecedor] = useState('');
    const [cnpjFornecedor, setCnpjFornecedor] = useState('');
    const [valorNE, setValorNE] = useState('');
    const [linkDriveNE, setLinkDriveNE] = useState('');
    
    // NOVO: Estado para o detentor
    const [detentor, setDetentor] = useState(usuarioAtual.secao);
    const [secoesDisponiveis, setSecoesDisponiveis] = useState([]);
    
    const [listaPregaos, setListaPregaos] = useState([]);
    const [listaItensPregao, setListaItensPregao] = useState([]);
    const [carregando, setCarregando] = useState(false);
    
    // NOVO: Ano de referência (preparação para futuro)
    const anoReferencia = new Date().getFullYear();

    // Mapeamento de níveis para validação de hierarquia (transferência)
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

    // Carregar seções disponíveis
    useEffect(() => {
        const fetchSecoes = async () => {
            try {
                const resNC = await fetch('http://localhost:5000/credits_nc');
                const data = await resNC.json();
                const secoes = [...new Set(data.map(nc => nc.detentor))];
                const secoesAdicionais = ['TESOURARIA', 'COL', 'GRCP'];
                const todasSecoes = [...new Set([...secoes, ...secoesAdicionais])];
                
                // Filtra apenas seções de nível menor ou igual (não pode ser maior hierarquia)
                const nivelOrigem = getNivelSecao(usuarioAtual.secao);
                const valorNivelOrigem = getNivelValor(nivelOrigem);
                
                const secoesFiltradas = todasSecoes.filter(secao => {
                    const nivelDestino = getNivelSecao(secao);
                    const valorNivelDestino = getNivelValor(nivelDestino);
                    return valorNivelDestino >= valorNivelOrigem;
                });
                
                setSecoesDisponiveis(secoesFiltradas);
            } catch (err) {
                console.error("Erro ao carregar seções:", err);
                setSecoesDisponiveis(['TESOURARIA', 'COL', 'GRCP']);
            }
        };
        fetchSecoes();
    }, [usuarioAtual.secao]);

    // Carregar dados de pregões e itens
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

    // Popular formulário em modo edição
    useEffect(() => {
        if (modo === 'editar' && dadosIniciais) {
            setIdEmEdicao(dadosIniciais.id);
            setNumeroNC(dadosIniciais.nc || '');
            setProcessoNC(dadosIniciais.processo || '');
            setOmAplicacao(dadosIniciais.omAplicacao || '');
            setValorNC(dadosIniciais.valorNC?.toString() || '');
            setFinalidadeNC(dadosIniciais.finalidade || '');
            setLinkDriveNC(dadosIniciais.linkDrive || '');
            setNumeroNE(dadosIniciais.numeroNE || '');
            setNomeFornecedor(dadosIniciais.nomeFornecedor || '');
            setCnpjFornecedor(dadosIniciais.cnpjFornecedor || '');
            setValorNE(dadosIniciais.valorAtual?.toString() || '');
            setLinkDriveNE(dadosIniciais.linkDriveNE || '');
            setDetentor(dadosIniciais.detentor || usuarioAtual.secao);
            
            if (!dadosIniciais.idPregaoVinculado) {
                setIsOutraModalidade(true);
                setDescricaoItemManual(dadosIniciais.materialNE || '');
            } else {
                setIsOutraModalidade(false);
                setIdPregaoSelecionado(dadosIniciais.idPregaoVinculado);
                
                if (dadosIniciais.idItemPregaoVinculado) {
                    setIdItemPregaoSelecionado(dadosIniciais.idItemPregaoVinculado);
                    const itemPregao = listaItensPregao.find(i => i.id === dadosIniciais.idItemPregaoVinculado);
                    if (itemPregao) {
                        setNomeFornecedor(itemPregao.fornecedor || '');
                        setCnpjFornecedor(itemPregao.cnpj || '');
                    }
                }
            }
        }
    }, [modo, dadosIniciais, listaItensPregao, usuarioAtual.secao]);

    // Função para converter valor brasileiro para número
    const converterParaNumero = (valorStr) => {
        if (!valorStr) return 0;
        if (typeof valorStr === 'number') return valorStr;
        let limpo = valorStr.toString().replace(/\./g, '');
        limpo = limpo.replace(',', '.');
        limpo = limpo.replace(/[^\d.-]/g, '');
        const numero = parseFloat(limpo);
        return isNaN(numero) ? 0 : numero;
    };

    const handlePregaoChange = (valorSelect) => {
        if (valorSelect === 'OUTRA_MODALIDADE') {
            setIsOutraModalidade(true);
            setIdPregaoSelecionado('');
            setIdItemPregaoSelecionado('');
            setNomeFornecedor('');
            setCnpjFornecedor('');
        } else {
            setIsOutraModalidade(false);
            setIdPregaoSelecionado(valorSelect);
            setIdItemPregaoSelecionado('');
        }
    };

    const handleItemChange = (valorSelect) => {
        setIdItemPregaoSelecionado(valorSelect);
        if (valorSelect && valorSelect !== '') {
            const itemPregao = listaItensPregao.find(item => item.id === valorSelect);
            if (itemPregao) {
                setNomeFornecedor(itemPregao.fornecedor || '');
                setCnpjFornecedor(itemPregao.cnpj || '');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCarregando(true);

        const vNC = converterParaNumero(valorNC);
        const vNE = converterParaNumero(valorNE);

        let materialFinal = '';
        let idItemVinculado = null;
        let idPregaoVinculado = null;

        if (isOutraModalidade) {
            materialFinal = descricaoItemManual;
            idItemVinculado = null;
            idPregaoVinculado = null;
        } else {
            idPregaoVinculado = idPregaoSelecionado;
            if (idItemPregaoSelecionado && idItemPregaoSelecionado !== '') {
                const item = listaItensPregao.find(i => i.id === idItemPregaoSelecionado);
                materialFinal = item ? `Item ${item.item} - ${item.descricao}` : '';
                idItemVinculado = idItemPregaoSelecionado;
            }
        }

        // NOVOS CAMPOS: Preparação para futuro
        const dadosRPNP = {
            fonteRecurso,
            nc: numeroNC,
            processo: processoNC,
            omAplicacao: omAplicacao,
            valorNC: vNC,
            finalidade: finalidadeNC,
            linkDrive: linkDriveNC,
            numeroNE: numeroNE,
            materialNE: materialFinal,
            idItemPregaoVinculado: idItemVinculado,
            idPregaoVinculado: idPregaoVinculado,
            nomeFornecedor: nomeFornecedor,
            cnpjFornecedor: cnpjFornecedor,
            valorAtual: vNE,
            linkDriveNE: linkDriveNE,
            detentor: detentor,
            observacoes: '',
            modalidade: isOutraModalidade ? 'FORA_DO_PREGAO_MANUAL' : 'PREGAO_HOMOLOGADO',
            dataCriacao: new Date().toISOString(),
            
            // NOVOS CAMPOS - Preparação para futura conversão NE → RPNP
            idNcVinculada: null,                    // Será preenchido quando houver NC real
            tipoOrigem: 'NC_DIGITADA',              // "NC_DIGITADA" ou "NC_VINCULADA"
            status: 'ATIVO',                        // "ATIVO" | "CONVERTIDO_DE_NE" | "RENOVADO"
            origemNEId: null,                       // ID da NE original que deu origem
            origemNENumero: null,                   // Número da NE original
            valorConvertidoDeNE: null,              // Valor que foi convertido da NE
            dataConversao: null,                    // Data da conversão
            renovadoDeId: null,                     // ID do RPNP anterior
            renovadoDeNumero: null,                 // Número do RPNP anterior
            anoReferencia: anoReferencia            // Ano de referência do RPNP
        };

        const metodo = idEmEdicao ? 'PUT' : 'POST';
        const url = idEmEdicao 
            ? `http://localhost:5000/credits_rpnp/${idEmEdicao}` 
            : 'http://localhost:5000/credits_rpnp';

        try {
            await fetch(url, {
                method: metodo,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(idEmEdicao ? { ...dadosRPNP, id: idEmEdicao } : { ...dadosRPNP, id: Math.random().toString(36).substr(2, 11) })
            });
            
            alert(idEmEdicao ? 'RPNP atualizado com sucesso!' : 'RPNP cadastrado com sucesso!');
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error('Erro ao salvar RPNP:', err);
            alert('Erro ao salvar. Tente novamente.');
        } finally {
            setCarregando(false);
        }
    };

    const fecharModal = () => {
        setIdEmEdicao(null);
        setNumeroNC('');
        setProcessoNC('');
        setOmAplicacao('');
        setValorNC('');
        setFinalidadeNC('');
        setLinkDriveNC('');
        setNumeroNE('');
        setNomeFornecedor('');
        setCnpjFornecedor('');
        setValorNE('');
        setLinkDriveNE('');
        setIdPregaoSelecionado('');
        setIdItemPregaoSelecionado('');
        setIsOutraModalidade(false);
        setDescricaoItemManual('');
        setDetentor(usuarioAtual.secao);
        onClose();
    };

    const itensFiltrados = listaItensPregao.filter(i => i.idPregaoVinculado === idPregaoSelecionado);

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalForm}>
                <div className={styles.modalHeader}>
                    <BsPlusSquareFill />
                    <h3>{idEmEdicao ? 'EDITAR RPNP' : 'INSERIR NOVO RPNP'}</h3>
                </div>

                <form className={styles.formStyled} onSubmit={handleSubmit}>
                    <div className={styles.formContent}>
                        
                        {/* SEÇÃO 1: DADOS DA NC */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionHeader}>
                                <BsInfoCircleFill /> <h4>1. DADOS DA NOTA DE CRÉDITO (NC)</h4>
                            </div>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup}>
                                    <label>Número da NC</label>
                                    <input type="text" className={styles.inputField} value={numeroNC} onChange={(e) => setNumeroNC(e.target.value)} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Valor Total da NC (R$)</label>
                                    <input type="text" className={styles.inputField} value={valorNC} onChange={(e) => setValorNC(e.target.value)} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>OM de Aplicação</label>
                                    <input type="text" className={styles.inputField} value={omAplicacao} onChange={(e) => setOmAplicacao(e.target.value)} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Número do Processo</label>
                                    <input type="text" className={styles.inputField} value={processoNC} onChange={(e) => setProcessoNC(e.target.value)} required />
                                </div>
                                <div className={styles.inputGroup} style={{ gridColumn: 'span 3' }}>
                                    <label>Link do Google Drive (Documento NC)</label>
                                    <input type="url" className={styles.inputField} value={linkDriveNC} onChange={(e) => setLinkDriveNC(e.target.value)} required />
                                </div>
                            </div>
                        </div>

                        {/* SEÇÃO 2: DADOS DA RPNP */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionHeader}>
                                <BsFileEarmarkTextFill /> <h4>2. DADOS DA RPNP</h4>
                            </div>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup}>
                                    <label>Número da RPNP</label>
                                    <input type="text" className={styles.inputField} value={numeroNE} onChange={(e) => setNumeroNE(e.target.value)} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Valor (R$)</label>
                                    <input type="text" className={styles.inputField} value={valorNE} onChange={(e) => setValorNE(e.target.value)} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Detentor</label>
                                    <select 
                                        className={styles.selectInput} 
                                        value={detentor} 
                                        onChange={(e) => setDetentor(e.target.value)}
                                        required
                                    >
                                        {secoesDisponiveis.map(secao => (
                                            <option key={secao} value={secao}>
                                                {secao}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* SEÇÃO 3: MATERIAL / ITEM */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionHeader}>
                                <BsLink45Deg /> <h4>3. MATERIAL / ITEM</h4>
                            </div>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                                    <label>Pregão</label>
                                    <select 
                                        className={styles.selectInput} 
                                        value={isOutraModalidade ? 'OUTRA_MODALIDADE' : (idPregaoSelecionado || '')} 
                                        onChange={(e) => handlePregaoChange(e.target.value)}
                                    >
                                        <option value="">-- Selecione o Pregão --</option>
                                        <option value="OUTRA_MODALIDADE" style={{ color: '#c53030', fontWeight: 'bold' }}>
                                            + OUTRA MODALIDADE (CARONA/DISPENSA)
                                        </option>
                                        {listaPregaos.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                {!isOutraModalidade && idPregaoSelecionado && (
                                    <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                                        <label>Item do Pregão</label>
                                        <select 
                                            className={styles.selectInput} 
                                            value={idItemPregaoSelecionado || ''} 
                                            onChange={(e) => handleItemChange(e.target.value)}
                                            required={!isOutraModalidade}
                                        >
                                            <option value="">-- Selecione o item homologado --</option>
                                            {itensFiltrados.map(item => (
                                                <option key={item.id} value={item.id}>
                                                    Item {item.item} - {item.descricao.substring(0, 55)}...
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {isOutraModalidade && (
                                <div className={styles.inputGroup} style={{ marginTop: '15px' }}>
                                    <label style={{ color: '#c53030' }}>Descrição do Material/Serviço</label>
                                    <textarea 
                                        className={styles.textareaField} 
                                        value={descricaoItemManual} 
                                        onChange={(e) => setDescricaoItemManual(e.target.value)} 
                                        placeholder="Descreva o material ou serviço..."
                                        rows="3"
                                        required={isOutraModalidade}
                                    />
                                </div>
                            )}
                        </div>

                        {/* SEÇÃO 4: FORNECEDOR */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionHeader}>
                                <BsBuilding /> <h4>4. FORNECEDOR</h4>
                            </div>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                                    <label>Razão Social</label>
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

                        {/* SEÇÃO 5: FINALIDADE E DOCUMENTO */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionHeader}>
                                <BsCalendarDate /> <h4>5. FINALIDADE E DOCUMENTO</h4>
                            </div>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup} style={{ gridColumn: 'span 3' }}>
                                    <label>Finalidade</label>
                                    <textarea 
                                        className={styles.textareaField} 
                                        value={finalidadeNC} 
                                        onChange={(e) => setFinalidadeNC(e.target.value)} 
                                        rows="3" 
                                        required 
                                    />
                                </div>
                                <div className={styles.inputGroup} style={{ gridColumn: 'span 3' }}>
                                    <label>Link do Google Drive (Documento RPNP)</label>
                                    <input 
                                        type="url" 
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
                        <button type="button" className={styles.btnCancel} onClick={fecharModal} disabled={carregando}>
                            CANCELAR
                        </button>
                        <button type="submit" className={styles.btnSubmit} disabled={carregando}>
                            {carregando ? 'SALVANDO...' : (idEmEdicao ? 'ATUALIZAR' : 'CADASTRAR')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RPNPModal;