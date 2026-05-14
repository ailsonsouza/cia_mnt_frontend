import { useState, useEffect } from 'react'
import styles from '../../styles/styles_pages/styles_creditsTabs/Auction.module.css'

function Auction (){
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modoModal, setModoModal] = useState('incluir') // 'incluir', 'editar' ou 'excluir'
    const [itensTabela, setItensTabela] = useState([])
    const [idItemSelecionado, setIdItemSelecionado] = useState('')

    // Estados do formulário
    const [grupo, setGrupo] = useState('')
    const [itemNum, setItemNum] = useState('')
    const [descricao, setDescricao] = useState('')
    const [fornecedor, setFornecedor] = useState('')
    const [cnpj, setCnpj] = useState('')
    const [qtd, setQtd] = useState(0)
    const [undMed, setUndMed] = useState('')
    const [valorUnitario, setValorUnitario] = useState('')
    const [capacidadeEmpenho, setCapacidadeEmpenho] = useState('R$ 0,00')

    // 1. CARREGAMENTO INICIAL DO BANCO DE DADOS
    useEffect(() => {
        fetch('http://localhost:5000/credits')
            .then(res => {
                if(!res.ok) throw new Error("Erro de rede");
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) setItensTabela(data);
            })
            .catch(err => console.error("Erro ao carregar dados do db.json:", err))
    }, [])

    // 2. CÁLCULO AUTOMÁTICO DA CAPACIDADE DE EMPENHO
    useEffect(() => {
        if (!valorUnitario) {
            setCapacidadeEmpenho('R$ 0,00');
            return;
        }
        const stringValor = String(valorUnitario);
        const valorLimpo = parseFloat(stringValor.replace(/[^\d,.]/g, '').replace(',', '.'));
        const quantidadeLimpa = parseFloat(qtd);

        if (!isNaN(valorLimpo) && !isNaN(quantidadeLimpa)) {
            const total = quantidadeLimpa * valorLimpo;
            setCapacidadeEmpenho(total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
        } else {
            setCapacidadeEmpenho('R$ 0,00');
        }
    }, [qtd, valorUnitario])

    // 3. CARREGA DADOS DO ITEM SELECIONADO (EDIÇÃO OU EXCLUSÃO)
    const handleMudarItemSelecionado = (id) => {
        setIdItemSelecionado(id);
        const itemEncontrado = itensTabela.find(i => i.id === id);
        
        if (itemEncontrado) {
            setGrupo(itemEncontrado.grupo);
            setItemNum(itemEncontrado.item);
            setDescricao(itemEncontrado.descricao);
            setFornecedor(itemEncontrado.fornecedor);
            setCnpj(itemEncontrado.cnpj);
            setQtd(itemEncontrado.qtd);
            setUndMed(itemEncontrado.undMed);
            setValorUnitario(itemEncontrado.valorUnitario);
        } else {
            limparFormulario();
        }
    }

    // 4. FUNÇÃO AUXILIAR PARA LIMPAR CAMPOS
    const limparFormulario = () => {
        setGrupo('');
        setItemNum('');
        setDescricao('');
        setFornecedor('');
        setCnpj('');
        setQtd(0);
        setUndMed('');
        setValorUnitario('');
        setIdItemSelecionado('');
    }

    // 5. PROCESSAMENTO DO FORMULÁRIO (POST, PUT OU DELETE)
    const handleSubmeterFormulario = (e) => {
        e.preventDefault();

        if (modoModal === 'excluir') {
            if (!idItemSelecionado) {
                alert("Por favor, selecione um item para excluir.");
                return;
            }

            const confirmacao = window.confirm(`Deseja realmente excluir permanentemente o Item Nº ${itemNum}?`);
            if (!confirmacao) return;

            fetch(`http://localhost:5000/credits/${idItemSelecionado}`, {
                method: 'DELETE'
            })
            .then(res => {
                if(!res.ok) throw new Error("Erro ao deletar");
                setItensTabela(prev => prev.filter(item => item.id !== idItemSelecionado));
                fecharModal();
            })
            .catch(err => alert("Erro ao excluir item do banco: " + err));
            
            return;
        }

        if (parseFloat(qtd) <= 0 || !valorUnitario) {
            alert("Por favor, preencha a Quantidade e o Valor Unitário corretamente.");
            return;
        }

        const dadosItem = {
            grupo,
            item: itemNum,
            descricao,
            fornecedor,
            cnpj,
            qtd: parseFloat(qtd),
            undMed,
            valorUnitario,
            capacidadeEmpenho,
            valorEmpenhado: 'R$ 0,00',         
            capacidadeEmpenhoAtual: capacidadeEmpenho, 
            rpnp160: 'R$ 0,00',
            rpnp167: 'R$ 0,00',
            creditos160: 'R$ 0,00',
            creditos167: 'R$ 0,00'
        }

        if (modoModal === 'incluir') {
            fetch('http://localhost:5000/credits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosItem)
            })
            .then(res => res.json())
            .then(dadosSalvos => {
                setItensTabela(prev => [...prev, dadosSalvos]);
                fecharModal();
            })
            .catch(err => alert("Erro ao incluir item: " + err));
        } else if (modoModal === 'editar') {
            if (!idItemSelecionado) {
                alert("Por favor, selecione um item para editar.");
                return;
            }

            fetch(`http://localhost:5000/credits/${idItemSelecionado}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosItem)
            })
            .then(res => res.json())
            .then(dadosAtualizados => {
                setItensTabela(prev => prev.map(item => item.id === idItemSelecionado ? dadosAtualizados : item));
                fecharModal();
            })
            .catch(err => alert("Erro ao atualizar item: " + err));
        }
    }

    const fecharModal = () => {
        limparFormulario();
        setIsModalOpen(false);
    }

    const camposDesabilitados = modoModal === 'excluir';

    return(
        <div className={styles.mainContainer}>
            <div className={styles.actionPanel}>
                <button 
                    className={`${styles.actionBtn} ${styles.btnIncluir}`}
                    onClick={() => { setModoModal('incluir'); setIsModalOpen(true); }}
                >
                    INCLUIR ITEM
                </button>
                <button 
                    className={`${styles.actionBtn} ${styles.btnEditar}`}
                    onClick={() => { setModoModal('editar'); setIsModalOpen(true); }}
                >
                    EDITAR ITEM
                </button>
                <button 
                    className={`${styles.actionBtn} ${styles.btnExcluir}`}
                    onClick={() => { setModoModal('excluir'); setIsModalOpen(true); }}
                >
                    EXCLUIR ITEM
                </button>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.customTable}>
                    <thead>
                        <tr className={styles.mainHeader}>
                            <th className={styles.colPequena}>Grupo</th>
                            <th className={styles.colPequena}>Item</th>
                            <th className={styles.colDescricao}>Descrição</th>
                            <th className={styles.colGrande}>Fornecedor</th>
                            <th className={styles.colGrande}>CNPJ</th>
                            <th className={styles.colPequena}>Qtd</th>
                            <th className={styles.colPequena}>Und. Med.</th>
                            <th className={styles.colPequena}>Valor Unt</th>
                            <th className={styles.colMedia}>Capacidade de Empenho</th>
                            <th className={styles.colMedia}>Valor Empenhado</th>
                            <th className={styles.colMedia}>Capacidade de Empenho Atual</th>
                            <th className={styles.colMedia}>RPNP - 160</th>
                            <th className={styles.colMedia}>RPNP - 167</th>
                            <th className={styles.colMedia}>CRÉDITOS - 160</th>
                            <th className={styles.colMedia}>CRÉDITOS - 167</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Realiza a ordenação crescente por Grupo e desempata por Item antes de renderizar */}
                        {[...itensTabela]
                            .sort((a, b) => {
                                const grupoA = Number(a.grupo) || 0;
                                const grupoB = Number(b.grupo) || 0;
                                
                                if (grupoA !== grupoB) {
                                    return grupoA - grupoB; // Ordena por Grupo crescente
                                }
                                
                                const itemA = Number(a.item) || 0;
                                const itemB = Number(b.item) || 0;
                                return itemA - itemB; // Desempata por Item crescente
                            })
                            .map((item) => (
                                <tr key={item.id}>
                                    <td>{item.grupo}</td>
                                    <td>{item.item}</td>
                                    <td>{item.descricao}</td>
                                    <td>{item.fornecedor}</td>
                                    <td>{item.cnpj}</td>
                                    <td>{item.qtd}</td>
                                    <td>{item.undMed}</td>
                                    <td>{item.valorUnitario}</td>
                                    <td>{item.capacidadeEmpenho}</td>
                                    <td>{item.valorEmpenhado}</td>
                                    <td>{item.capacidadeEmpenhoAtual}</td>
                                    <td>{item.rpnp160}</td>
                                    <td>{item.rpnp167}</td>
                                    <td>{item.creditos160}</td>
                                    <td>{item.creditos167}</td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>
                            {modoModal === 'incluir' && 'Incluir Novo Item'}
                            {modoModal === 'editar' && 'Editar Item Existente'}
                            {modoModal === 'excluir' && 'Excluir Item'}
                        </h2>
                        
                        <form className={styles.modalForm} onSubmit={handleSubmeterFormulario}>
                            
                            {modoModal !== 'incluir' && (
                                <div className={styles.formGroupFull}>
                                    <label style={{ color: modoModal === 'excluir' ? '#dc3545' : '#007bff' }}>
                                        Selecione o Item para {modoModal === 'excluir' ? 'Exclusão' : 'Edição'} (Pelo Número)
                                    </label>
                                    <select 
                                        value={idItemSelecionado} 
                                        onChange={(e) => handleMudarItemSelecionado(e.target.value)}
                                        required
                                        className={modoModal === 'excluir' ? styles.selectExcluir : styles.selectEditar}
                                    >
                                        <option value="">-- Escolha o número do item --</option>
                                        {/* Exibe também o select ordenado para facilitar a localização do usuário */}
                                        {[...itensTabela]
                                            .sort((a, b) => (Number(a.grupo) || 0) - (Number(b.grupo) || 0) || (Number(a.item) || 0) - (Number(b.item) || 0))
                                            .map(i => (
                                                <option key={i.id} value={i.id}>G: {i.grupo} | Item Nº {i.item} - {i.descricao.substring(0, 25)}...</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            )}

                            <div className={styles.formGroup}>
                                <label>Grupo</label>
                                <input type="text" value={grupo} onChange={(e) => setGrupo(e.target.value)} required disabled={camposDesabilitados} />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Item</label>
                                <input type="text" value={itemNum} onChange={(e) => setItemNum(e.target.value)} required disabled={camposDesabilitados} />
                            </div>

                            <div className={styles.formGroupFull}>
                                <label>Descrição</label>
                                <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} required disabled={camposDesabilitados}></textarea>
                            </div>

                            <div className={styles.formGroupFull}>
                                <label>Fornecedor</label>
                                <input type="text" value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} required disabled={camposDesabilitados} />
                            </div>

                            <div className={styles.formGroup}>
                                <label>CNPJ</label>
                                <input type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)} required disabled={camposDesabilitados} />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Qtd</label>
                                <input type="number" value={qtd} onChange={(e) => setQtd(e.target.value)} required disabled={camposDesabilitados} />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Und. Med.</label>
                                <input type="text" value={undMed} onChange={(e) => setUndMed(e.target.value)} required disabled={camposDesabilitados} />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Valor Und.</label>
                                <input type="text" placeholder="Ex: 45.50" value={valorUnitario} onChange={(e) => setValorUnitario(e.target.value)} required disabled={camposDesabilitados} />
                            </div>

                            <div className={styles.formGroupFull}>
                                <label>Capacidade de Empenho</label>
                                <input type="text" value={capacidadeEmpenho} disabled className={styles.inputCalculado} />
                            </div>

                            <div className={styles.modalActions}>
                                <button 
                                    type="submit" 
                                    className={modoModal === 'excluir' ? styles.btnConfirmarExcluir : styles.btnSalvar}
                                >
                                    {modoModal === 'incluir' && 'Salvar Item'}
                                    {modoModal === 'editar' && 'Atualizar Item'}
                                    {modoModal === 'excluir' && 'Confirmar Exclusão'}
                                </button>

                                <button type="button" className={styles.btnCancelar} onClick={fecharModal}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Auction
