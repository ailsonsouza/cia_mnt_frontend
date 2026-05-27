// src/components/pages/CreditsTabs/RPNP.js
import { useState, useEffect } from 'react';
import styles from '../../styles/styles_pages/styles_creditsTabs/RPNP.module.css';
import CreditsCard from './CreditsCard';
import RPNPModal from './modais/RPNPModal';
import { useAuth } from '../../context/AuthContext';

function RPNP({ fonteRecurso, onVerDetalhes, onUgChange, ugSelecionada }) {
    const { usuarioAtual } = useAuth();  // ← ADICIONADO
    const [notasEmpenho, setNotasEmpenho] = useState([]);
    const [listaNFs, setListaNFs] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modoModal, setModoModal] = useState('incluir');
    const [dadosEdicao, setDadosEdicao] = useState(null);

    // Filtros
    const [filtroOrdem, setFiltroOrdem] = useState('');
    const [filtroItem, setFiltroItem] = useState('');
    const [filtroFornecedor, setFiltroFornecedor] = useState('');

    // Opções para os selects
    const [opcoesOrdem, setOpcoesOrdem] = useState([]);
    const [opcoesItem, setOpcoesItem] = useState([]);
    const [opcoesFornecedor, setOpcoesFornecedor] = useState([]);

    const handleUgChange = (novaUg) => {
        if (onUgChange) {
            onUgChange(novaUg);
        }
    };

    const carregarDados = () => {
        fetch('http://localhost:5000/credits_rpnp')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // CORREÇÃO: Filtra por fonteRecurso E por detentor (usuário atual)
                    const dadosFiltradosPorFonte = data.filter(item => 
                        item.fonteRecurso === fonteRecurso &&
                        item.detentor === usuarioAtual.secao  // ← APENAS O DETENTOR
                    );
                    setNotasEmpenho(dadosFiltradosPorFonte);
                    
                    // Gerar opções únicas para os selects
                    const ordensUnicas = [...new Set(dadosFiltradosPorFonte.map(item => item.numeroNE).filter(Boolean))];
                    const itensUnicos = [...new Set(dadosFiltradosPorFonte.map(item => item.materialNE).filter(Boolean))];
                    const fornecedoresUnicos = [...new Set(dadosFiltradosPorFonte.map(item => item.nomeFornecedor).filter(Boolean))];
                    
                    setOpcoesOrdem(ordensUnicas);
                    setOpcoesItem(itensUnicos);
                    setOpcoesFornecedor(fornecedoresUnicos);
                }
            })
            .catch(err => console.error("Erro RPNP:", err));

        fetch('http://localhost:5000/credits_nf')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setListaNFs(data); })
            .catch(err => console.error("Erro NFs:", err));
    };

    useEffect(() => {
        carregarDados();
    }, [fonteRecurso, usuarioAtual.secao]);  // ← ADICIONADO dependência do usuário

    const obterFluxoFinanceiroRpnp = (idRpnp) => {
        const nfsDoRpnp = listaNFs.filter(nf => nf.idNeVinculada === idRpnp);
        const emLiquidacao = nfsDoRpnp
            .filter(nf => nf.status === 'ENVIADA_LIQUIDACAO')
            .reduce((soma, nf) => soma + (parseFloat(nf.valor) || 0), 0);
        const liquidado = nfsDoRpnp
            .filter(nf => nf.status === 'LIQUIDADA')
            .reduce((soma, nf) => soma + (parseFloat(nf.valor) || 0), 0);
        return { emLiquidacao, liquidado };
    };

    const handleAbrirEdicao = (item) => {
        // Verifica se o usuário atual é o detentor do RPNP
        if (item.detentor !== usuarioAtual.secao) {
            alert('❌ Você não tem permissão para editar este RPNP!');
            return;
        }
        setModoModal('editar');
        setDadosEdicao(item);
        setIsModalOpen(true);
    };

    const handleExcluirRPNP = (id, numeroIdentificador, detentor) => {
        // Verifica se o usuário atual é o detentor do RPNP
        if (detentor !== usuarioAtual.secao) {
            alert('❌ Você não tem permissão para excluir este RPNP!');
            return;
        }
        
        if (!window.confirm(`Excluir RPNP Nº ${numeroIdentificador}?`)) return;
        fetch(`http://localhost:5000/credits_rpnp/${id}`, { method: 'DELETE' })
            .then(() => {
                alert('Removido!');
                carregarDados();
            });
    };

    const handleAbrirDetalhar = (item) => {
        if (onVerDetalhes) {
            onVerDetalhes(item.id);
        }
    };

    const fecharModal = () => {
        setIsModalOpen(false);
        setDadosEdicao(null);
        setModoModal('incluir');
        carregarDados();
    };

    const limparFiltros = () => {
        setFiltroOrdem('');
        setFiltroItem('');
        setFiltroFornecedor('');
    };

    const dadosFiltrados = notasEmpenho.filter((card) => {
        return (filtroOrdem === '' || card.numeroNE === filtroOrdem) &&
               (filtroItem === '' || card.materialNE === filtroItem) &&
               (filtroFornecedor === '' || card.nomeFornecedor === filtroFornecedor);
    });

    return (
        <div className={styles.container}>
            {/* Seletor de UG */}
            <div className={styles.ugSelectorContainer}>
                <div className={styles.ugInfo}>
                    <span className={styles.ugLabel}>UNIDADE GESTORA:</span>
                    <div className={styles.ugToggle}>
                        <button 
                            className={`${styles.ugOption} ${fonteRecurso === '160' ? styles.active : ''}`}
                            onClick={() => handleUgChange('160')}
                        >
                            160212
                        </button>
                        <button 
                            className={`${styles.ugOption} ${fonteRecurso === '167' ? styles.active : ''}`}
                            onClick={() => handleUgChange('167')}
                        >
                            167212
                        </button>
                    </div>
                </div>
            </div>

            {/* BARRA DE FILTROS COM SELECTS */}
            <div className={styles.filterBar}>
                <div className={styles.filterGroup}>
                    <label>NOTA DE EMPENHO</label>
                    <select 
                        value={filtroOrdem} 
                        onChange={(e) => setFiltroOrdem(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="">TODAS</option>
                        {opcoesOrdem.map(opcao => (
                            <option key={opcao} value={opcao}>{opcao}</option>
                        ))}
                    </select>
                </div>
                
                <div className={styles.filterGroup}>
                    <label>Material / Item</label>
                    <select 
                        value={filtroItem} 
                        onChange={(e) => setFiltroItem(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="">TODOS</option>
                        {opcoesItem.map(opcao => (
                            <option key={opcao} value={opcao}>{opcao.length > 50 ? opcao.substring(0, 50) + '...' : opcao}</option>
                        ))}
                    </select>
                </div>
                
                <div className={styles.filterGroup}>
                    <label>Fornecedor</label>
                    <select 
                        value={filtroFornecedor} 
                        onChange={(e) => setFiltroFornecedor(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="">TODOS</option>
                        {opcoesFornecedor.map(opcao => (
                            <option key={opcao} value={opcao}>{opcao}</option>
                        ))}
                    </select>
                </div>

                <button className={styles.btnLimparFiltros} onClick={limparFiltros} title="Limpar filtros">
                    ✖
                </button>
            </div>

            <div className={styles.cardGrid}>
                {dadosFiltrados.length === 0 ? (
                    <div className={styles.noResults}>
                        Nenhum RPNP encontrado para sua seção.
                    </div>
                ) : (
                    dadosFiltrados.map((card) => {
                        const { emLiquidacao, liquidado } = obterFluxoFinanceiroRpnp(card.id);
                        return (
                            <CreditsCard
                                key={card.id}
                                numeroNE={card.numeroNE}
                                finalidade={card.finalidade}
                                material={card.materialNE}
                                omAplicacao={card.omAplicacao}
                                fornecedor={card.nomeFornecedor}
                                valorAtual={(card.valorAtual || 0) - emLiquidacao - liquidado}
                                numeroNC={`NC Origem: ${card.nc || 'N/D'}`}
                                linkDrive={card.linkDriveNE}
                                processo={card.processo}
                                onEdit={() => handleAbrirEdicao(card)}
                                onDetail={() => handleAbrirDetalhar(card)}
                                onDelete={() => handleExcluirRPNP(card.id, card.numeroNE, card.detentor)}
                            />
                        );
                    })
                )}
            </div>

            {/* Modal separado */}
            <RPNPModal
                isOpen={isModalOpen}
                onClose={fecharModal}
                onSuccess={carregarDados}
                modo={modoModal}
                dadosIniciais={dadosEdicao}
                fonteRecurso={fonteRecurso}
            />
        </div>
    );
}

export default RPNP;