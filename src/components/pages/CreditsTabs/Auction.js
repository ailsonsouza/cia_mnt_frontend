import { useState, useEffect } from 'react';
import styles from '../../styles/styles_pages/styles_creditsTabs/Auction.module.css';
import {
    BsEye, BsPlusLg, BsInfoCircleFill, BsCart4, BsCashStack,
    BsBuilding, BsPencilSquare, BsTrash, BsPlusSquareFill, BsGearFill
} from 'react-icons/bs';

function Auction() {
    // Controle de Modais
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isPregaoMgmtOpen, setIsPregaoMgmtOpen] = useState(false);
    const [modoModal, setModoModal] = useState('incluir');

    // Dados do Banco
    const [itensTabela, setItensTabela] = useState([]);
    const [listaPregaos, setListaPregaos] = useState([]);
    const [pregaoAtivo, setPregaoAtivo] = useState('');
    const [itemDetalhado, setItemDetalhado] = useState(null);
    const [todasNEs, setTodasNEs] = useState([]);
    const [todosRPNPs, setTodosRPNPs] = useState([]);
    const [todasNCs, setTodasNCs] = useState([]);

    // Estados do Formulário de Itens
    const [idItemSelecionado, setIdItemSelecionado] = useState('');
    const [grupo, setGrupo] = useState('');
    const [itemNum, setItemNum] = useState('');
    const [descricao, setDescricao] = useState('');
    const [fornecedor, setFornecedor] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [qtd, setQtd] = useState(0);
    const [undMed, setUndMed] = useState('');
    const [valorUnitario, setValorUnitario] = useState('');
    const [capacidadeEmpenho, setCapacidadeEmpenho] = useState('R$ 0,00');

    // Estados do Formulário de Pregão
    const [novoNomePregao, setNovoNomePregao] = useState('');
    const [pregaoParaEditar, setPregaoParaEditar] = useState(null);

    const carregarDados = async () => {
        try {
            const [resP, resC, resNE, resRPNP, resNC] = await Promise.all([
                fetch('http://localhost:5000/pregaos').then(res => res.json()),
                fetch('http://localhost:5000/credits').then(res => res.json()),
                fetch('http://localhost:5000/credits_ne').then(res => res.json()),
                fetch('http://localhost:5000/credits_rpnp').then(res => res.json()),
                fetch('http://localhost:5000/credits_nc').then(res => res.json())
            ]);
            setListaPregaos(resP || []);
            setItensTabela(resC || []);
            setTodasNEs(resNE || []);
            setTodosRPNPs(resRPNP || []);
            setTodasNCs(resNC || []);
        } catch (err) {
            console.error("Erro ao carregar dados:", err);
        }
    };

    useEffect(() => { carregarDados(); }, []);

    useEffect(() => {
        const valorLimpo = parseFloat(String(valorUnitario).replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
        const total = (parseFloat(qtd) || 0) * valorLimpo;
        setCapacidadeEmpenho(total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
    }, [qtd, valorUnitario]);

    // --- GESTÃO DE PREGÃO ---
    const handleSalvarPregao = async (e) => {
        e.preventDefault();
        if (!novoNomePregao) return;

        const body = { nome: novoNomePregao };
        const url = pregaoParaEditar
            ? `http://localhost:5000/pregaos/${pregaoParaEditar.id}`
            : 'http://localhost:5000/pregaos';
        const method = pregaoParaEditar ? 'PUT' : 'POST';

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pregaoParaEditar ? { ...pregaoParaEditar, ...body } : { id: Math.random().toString(36).substr(2, 9), ...body })
        });

        setNovoNomePregao('');
        setPregaoParaEditar(null);
        carregarDados();
    };

    const handleExcluirPregao = async (id) => {
        const temItens = itensTabela.some(i => i.idPregaoVinculado === id);
        if (temItens) return alert("Não é possível excluir um pregão que possui itens vinculados.");

        if (window.confirm("Deseja excluir este pregão permanentemente?")) {
            await fetch(`http://localhost:5000/pregaos/${id}`, { method: 'DELETE' });
            if (pregaoAtivo === id) setPregaoAtivo('');
            carregarDados();
        }
    };

    // --- GESTÃO DE ITENS ---
    const handleSubmeter = (e) => {
        e.preventDefault();
        if (modoModal === 'excluir') {
            fetch(`http://localhost:5000/credits/${idItemSelecionado}`, { method: 'DELETE' }).then(() => { carregarDados(); fecharModal(); });
            return;
        }
        const dados = {
            idPregaoVinculado: pregaoAtivo,
            grupo, item: itemNum, descricao, fornecedor, cnpj,
            qtd: parseFloat(qtd), undMed, valorUnitario, capacidadeEmpenho,
            valorEmpenhado: 'R$ 0,00', rpnp160: 'R$ 0,00', rpnp167: 'R$ 0,00', creditos160: 'R$ 0,00', creditos167: 'R$ 0,00'
        };
        const url = modoModal === 'incluir' ? 'http://localhost:5000/credits' : `http://localhost:5000/credits/${idItemSelecionado}`;
        fetch(url, { method: modoModal === 'incluir' ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) }).then(() => { carregarDados(); fecharModal(); });
    };

    const fecharModal = () => {
        setIsModalOpen(false); setIdItemSelecionado(''); setGrupo(''); setItemNum('');
        setDescricao(''); setFornecedor(''); setCnpj(''); setQtd(0); setUndMed(''); setValorUnitario('');
    };

    const parseCurrency = (value) => {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        return parseFloat(value.replace("R$", "").replace(/\./g, "").replace(",", ".")) || 0;
    };

    const calcularTotaisItem = (item) => {
    // Identificador padrão usado nas NEs (Ex: "Item 1 -")
    const identificador = `Item ${item.item} -`;
    // Descrição limpa do item para bater com o formato dos RPNPs
    const descricaoItem = item.descricao ? item.descricao.trim() : "";

    // Filtro flexível para RPNPs: aceita o prefixo do item ou a descrição direta
    const filtrarRPNP = (r, fonte) => {
        if (r.fonteRecurso !== fonte) return false;
        const textoMaterial = r.materialNE ? r.materialNE.trim() : "";
        return textoMaterial.includes(identificador) || textoMaterial === descricaoItem;
    };

    // Cálculos de RPNP (Fontes 160 e 167)
    const r160 = todosRPNPs
        .filter(r => filtrarRPNP(r, "160"))
        .reduce((acc, curr) => acc + (curr.valorAtual || 0), 0);

    const r167 = todosRPNPs
        .filter(r => filtrarRPNP(r, "167"))
        .reduce((acc, curr) => acc + (curr.valorAtual || 0), 0);

    // Cálculos de NEs / Créditos (Fontes 160 e 167)
    const nesDesteItem = todasNEs.filter(ne => ne.materialNE && ne.materialNE.includes(identificador));
    
    const c160 = nesDesteItem.reduce((acc, ne) => {
        const nc = todasNCs.find(nc => nc.id === ne.idNcVinculada);
        return nc?.fonteRecurso === "160" ? acc + (ne.valorAtual || 0) : acc;
    }, 0);

    const c167 = nesDesteItem.reduce((acc, ne) => {
        const nc = todasNCs.find(nc => nc.id === ne.idNcVinculada);
        return nc?.fonteRecurso === "167" ? acc + (ne.valorAtual || 0) : acc;
    }, 0);

    // Cálculos dos Saldos Globais
    const capTotal = parseCurrency(item.capacidadeEmpenho);
    const capAtual = capTotal - (r160 + r167 + c160 + c167);

    // Retorno com formatação em Moeda (BRL)
    return {
        r160: r160.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        r167: r167.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        c160: c160.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        c167: c167.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        credTotal: (c160 + c167).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        capAtual: capAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    };
};


    const itensFiltrados = itensTabela.filter(i => i.idPregaoVinculado === pregaoAtivo);

    return (
        <div className={styles.mainContainer}>
            <div className={styles.toolbar}>
                <div className={styles.selector}>
                    <label>PREGÃO ATIVO:</label>
                    <select className={styles.selectToolbar} value={pregaoAtivo} onChange={(e) => setPregaoAtivo(e.target.value)}>
                        <option value="">-- Selecione um Pregão --</option>
                        {listaPregaos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </select>
                    <button onClick={() => setIsPregaoMgmtOpen(true)} className={styles.btnAddPregao} title="Gerenciar Pregões">
                        <BsGearFill />
                    </button>
                </div>
                <div className={styles.actionButtons}>
                    <button className={styles.btnActionIncluir} onClick={() => { setModoModal('incluir'); setIsModalOpen(true); }} disabled={!pregaoAtivo}>+ ITEM</button>
                    <button className={styles.btnActionEditar} onClick={() => { setModoModal('editar'); setIsModalOpen(true); }} disabled={!pregaoAtivo}><BsPencilSquare /> EDITAR</button>
                    <button className={styles.btnActionExcluir} onClick={() => { setModoModal('excluir'); setIsModalOpen(true); }} disabled={!pregaoAtivo}><BsTrash /> EXCLUIR</button>
                </div>
            </div>

            <div className={styles.tableWrapper}>
                {pregaoAtivo ? (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.colMini}>G</th>
                                <th className={styles.colMini}>Item</th>
                                <th className={styles.colDescricao}>Descrição</th>
                                <th className={styles.colFornecedor}>Fornecedor</th>
                                <th className={styles.colValor}>Capacidade Atual</th>
                                <th className={styles.colValor}>RPNP 160</th>
                                <th className={styles.colValor}>RPNP 167</th>
                                <th className={styles.colValor}>CRED 160</th>
                                <th className={styles.colValor}>CRED 167</th>
                                <th className={styles.colAcoes}>Ver</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itensFiltrados.map(item => {
                                const totais = calcularTotaisItem(item);
                                return (
                                    <tr key={item.id}>
                                        <td className={styles.textCenter}>{item.grupo}</td>
                                        <td className={styles.textCenter}>{item.item}</td>
                                        <td className={styles.wrapText}>{item.descricao}</td>
                                        <td className={styles.wrapText}>{item.fornecedor}</td>
                                        <td className={styles.valorCol}>{totais.capAtual}</td>
                                        <td className={styles.valorCol}>{totais.r160}</td>
                                        <td className={styles.valorCol}>{totais.r167}</td>
                                        <td className={styles.valorCol}>{totais.c160}</td>
                                        <td className={styles.valorCol}>{totais.c167}</td>
                                        <td className={styles.textCenter}>
                                            <button className={styles.btnIconEye} onClick={() => { setItemDetalhado({ ...item, ...totais }); setIsViewModalOpen(true); }}>
                                                <BsEye />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className={styles.placeholder}>Selecione um pregão para gerenciar os itens.</div>
                )}
            </div>

            {/* MODAL 1: GESTÃO DE PREGÕES */}
            {isPregaoMgmtOpen && (
                <div className={styles.overlay}>
                    <div className={styles.modalPregao}>
                        <div className={styles.modalViewHeader} style={{ backgroundColor: '#4a5568' }}>
                            <BsGearFill />
                            <h3>GERENCIAR PREGÕES</h3>
                        </div>
                        <div className={styles.viewContent}>
                            <form onSubmit={handleSalvarPregao} className={styles.formPregaoRapido}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.mainLabel}>{pregaoParaEditar ? 'EDITAR NOME DO PREGÃO' : 'CADASTRAR NOVO PREGÃO'}</label>
                                    <div className={styles.inputRow}>
                                        <input
                                            className={styles.inputFieldPregao}
                                            value={novoNomePregao}
                                            onChange={(e) => setNovoNomePregao(e.target.value)}
                                            placeholder="Digite a identificação do pregão..."
                                            required
                                        />
                                        <button type="submit" className={styles.btnSubmitPregao}>
                                            {pregaoParaEditar ? 'ATUALIZAR' : 'ADICIONAR'}
                                        </button>
                                        {pregaoParaEditar && (
                                            <button type="button" onClick={() => { setPregaoParaEditar(null); setNovoNomePregao(''); }} className={styles.btnCancelMini}>X</button>
                                        )}
                                    </div>
                                </div>
                            </form>

                            <div className={styles.listaPregaosExistentes}>
                                <h4>PREGÕES CADASTRADOS</h4>
                                {listaPregaos.map(p => (
                                    <div key={p.id} className={styles.itemPregaoLista}>
                                        <span>{p.nome}</span>
                                        <div className={styles.btnsPregaoLista}>
                                            <button onClick={() => { setPregaoParaEditar(p); setNovoNomePregao(p.nome); }}><BsPencilSquare /></button>
                                            <button onClick={() => handleExcluirPregao(p.id)} className={styles.btnDelPregao}><BsTrash /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className={styles.modalViewFooter}>
                            <button className={styles.btnFecharPregao} onClick={() => { setIsPregaoMgmtOpen(false); setPregaoParaEditar(null); setNovoNomePregao(''); }}>FECHAR</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: FORMULÁRIO DE ITENS */}
            {isModalOpen && (
                <div className={styles.overlay}>
                    <div className={`${styles.modalForm} ${styles[modoModal]}`}>
                        <div className={styles.modalFormHeader}>
                            {modoModal === 'incluir' && <BsPlusSquareFill />}
                            {modoModal === 'editar' && <BsPencilSquare />}
                            {modoModal === 'excluir' && <BsTrash />}
                            <h3>{modoModal.toUpperCase()} ITEM DE PREGÃO</h3>
                        </div>
                        <form onSubmit={handleSubmeter} className={styles.formStyled}>
                            <div className={styles.formContent}>
                                {modoModal !== 'incluir' && (
                                    <div className={styles.formSection}>
                                        <label className={styles.mainLabel}>SELECIONE O ITEM NO BANCO</label>
                                        <select className={styles.selectInput} value={idItemSelecionado} onChange={(e) => {
                                            const id = e.target.value;
                                            setIdItemSelecionado(id);
                                            const i = itensTabela.find(x => x.id === id);
                                            if (i) { setGrupo(i.grupo); setItemNum(i.item); setDescricao(i.descricao); setFornecedor(i.fornecedor); setCnpj(i.cnpj); setQtd(i.qtd); setUndMed(i.undMed); setValorUnitario(i.valorUnitario); }
                                        }} required>
                                            <option value="">-- Escolha o item para alteração --</option>
                                            {itensFiltrados.map(i => <option key={i.id} value={i.id}>G: {i.grupo} | Item {i.item} - {i.descricao.substring(0, 50)}...</option>)}
                                        </select>
                                    </div>
                                )}
                                <div className={styles.formSection}>
                                    <div className={styles.inputGrid}>
                                        <div className={styles.inputGroup}><label>Grupo</label><input className={styles.inputField} type="text" value={grupo} onChange={e => setGrupo(e.target.value)} disabled={modoModal === 'excluir'} required /></div>
                                        <div className={styles.inputGroup}><label>Nº do Item</label><input className={styles.inputField} type="text" value={itemNum} onChange={e => setItemNum(e.target.value)} disabled={modoModal === 'excluir'} required /></div>
                                        <div className={styles.inputGroup}><label>Unidade</label><input className={styles.inputField} type="text" value={undMed} onChange={e => setUndMed(e.target.value)} disabled={modoModal === 'excluir'} placeholder="Ex: UND..." required /></div>
                                    </div>
                                </div>
                                <div className={styles.formSection}>
                                    <div className={styles.inputGroup}><label>Descrição Completa</label><textarea className={styles.textareaField} value={descricao} onChange={e => setDescricao(e.target.value)} disabled={modoModal === 'excluir'} required /></div>
                                </div>
                                <div className={styles.formSection}>
                                    <div className={styles.inputGrid}>
                                        <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}><label>Fornecedor (Razão Social)</label><input className={styles.inputField} type="text" value={fornecedor} onChange={e => setFornecedor(e.target.value)} disabled={modoModal === 'excluir'} required /></div>
                                        <div className={styles.inputGroup}><label>CNPJ</label><input className={styles.inputField} type="text" value={cnpj} onChange={e => setCnpj(e.target.value)} disabled={modoModal === 'excluir'} required /></div>
                                    </div>
                                </div>
                                <div className={styles.formSection}>
                                    <div className={styles.inputGrid}>
                                        <div className={styles.inputGroup}><label>Quantidade</label><input className={styles.inputField} type="number" value={qtd} onChange={e => setQtd(e.target.value)} disabled={modoModal === 'excluir'} required /></div>
                                        <div className={styles.inputGroup}><label>Valor Unitário (R$)</label><input className={styles.inputField} type="text" value={valorUnitario} onChange={e => setValorUnitario(e.target.value)} disabled={modoModal === 'excluir'} placeholder="45.50" required /></div>
                                        <div className={styles.inputGroup}><label>Capacidade Calculada</label><div className={styles.calcDisplay}>{capacidadeEmpenho}</div></div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.formFooter}>
                                <button type="button" onClick={fecharModal} className={styles.btnCancel}>CANCELAR</button>
                                <button type="submit" className={`${styles.btnSubmit} ${styles[modoModal]}`}>
                                    {modoModal === 'incluir' && 'CADASTRAR ITEM'}
                                    {modoModal === 'editar' && 'SALVAR ALTERAÇÕES'}
                                    {modoModal === 'excluir' && 'CONFIRMAR EXCLUSÃO'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: DETALHAMENTO */}
            {isViewModalOpen && itemDetalhado && (
                <div className={styles.overlay}>
                    <div className={styles.modalView}>
                        <div className={styles.modalViewHeader} style={{ backgroundColor: '#1a365d' }}>
                            <BsInfoCircleFill />
                            <h3>DETALHAMENTO DO ITEM - {itemDetalhado.item}</h3>
                        </div>
                        <div className={styles.viewContent}>
                            <div className={styles.viewSection}>
                                <div className={styles.sectionHeader}><BsCart4 /> <h4>DADOS DO ITEM E QUANTITATIVOS</h4></div>
                                <div className={styles.viewGrid}>
                                    <div className={styles.viewItem}><label>Grupo</label><span>{itemDetalhado.grupo}</span></div>
                                    <div className={styles.viewItem}><label>Item Nº</label><span>{itemDetalhado.item}</span></div>
                                    <div className={styles.viewItem}><label>Quantidade</label><span>{itemDetalhado.qtd}</span></div>
                                    <div className={styles.viewItem}><label>Und. Medida</label><span>{itemDetalhado.undMed}</span></div>
                                    <div className={styles.viewItem}><label>Valor Unitário</label><span className={styles.valDestaque}>R$ {itemDetalhado.valorUnitario}</span></div>
                                </div>
                                <div className={styles.viewItem} style={{ marginTop: '15px' }}><label>Descrição do Item</label><p className={styles.descBox}>{itemDetalhado.descricao}</p></div>
                            </div>
                            <div className={styles.viewSection}>
                                <div className={styles.sectionHeader}><BsBuilding /> <h4>INFORMAÇÕES DO FORNECEDOR</h4></div>
                                <div className={styles.viewGrid}>
                                    <div className={styles.viewItem} style={{ gridColumn: 'span 2' }}><label>Razão Social</label><span>{itemDetalhado.fornecedor}</span></div>
                                    <div className={styles.viewItem}><label>CNPJ</label><span>{itemDetalhado.cnpj}</span></div>
                                </div>
                            </div>
                            <div className={styles.viewSection}>
                                <div className={styles.sectionHeader}><BsCashStack /> <h4>CONTROLE DE SALDOS E EMPENHOS</h4></div>
                                <div className={styles.viewGrid}>
                                    <div className={styles.viewItem}><label>Capacidade Total</label><span>{itemDetalhado.capacidadeEmpenho}</span></div>
                                    <div className={styles.viewItem}><label>Capacidade Atual</label><span className={styles.financeValBold}>{itemDetalhado.capAtual}</span></div>
                                </div>
                                <div className={styles.viewGrid} style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #edf2f7' }}>
                                    <div className={styles.viewItem}><label>RPNP 160</label><span>{itemDetalhado.r160}</span></div>
                                    <div className={styles.viewItem}><label>RPNP 167</label><span>{itemDetalhado.r167}</span></div>
                                    <div className={styles.viewItem}><label>CRED 160</label><span>{itemDetalhado.c160}</span></div>
                                    <div className={styles.viewItem}><label>CRED 167</label><span>{itemDetalhado.c167}</span></div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalViewFooter}><button onClick={() => setIsViewModalOpen(false)}>FECHAR RELATÓRIO</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Auction;