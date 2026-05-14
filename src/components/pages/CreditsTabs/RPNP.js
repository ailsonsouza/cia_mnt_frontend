import { useState, useEffect } from 'react';
import styles from '../../styles/styles_pages/styles_creditsTabs/RPNP.module.css';
import CreditsCard from './CreditsCard';

// AJUSTADO: Nome do componente principal alterado para RPNP
function RPNP({ fonteRecurso }) {
    const [notasEmpenho, setNotasEmpenho] = useState([]);
    const [listaNEs, setListaNEs] = useState([]);
    const [listaNFs, setListaNFs] = useState([]); // Armazena as notas fiscais para cruzar saldos no RPNP
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Estados para o Modal de Detalhes Cruzados do RPNP
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [itemDetalhado, setItemDetalhado] = useState(null);

    // Estados para controlar os termos digitados nos filtros da barra central
    const [filtroOrdem, setFiltroOrdem] = useState('');
    const [filtroItem, setFiltroItem] = useState('');
    const [filtroFornecedor, setFiltroFornecedor] = useState('');

    // --- ESTADOS DO FORMULÁRIO (SUPORTA INCLUSÃO E EDIÇÃO) ---
    const [idEmEdicao, setIdEmEdicao] = useState(null);

    // Dados da Nota de Crédito (NC)
    const [numeroNC, setNumeroNC] = useState('');
    const [processoNC, setProcessoNC] = useState('');
    const [omAplicacao, setOmAplicacao] = useState('');
    const [valorNC, setValorNC] = useState('');
    const [finalidadeNC, setFinalidadeNC] = useState('');
    const [linkDriveNC, setLinkDriveNC] = useState('');

    // Dados da Nota de Empenho (NE)
    const [numeroNE, setNumeroNE] = useState('');
    const [materialNE, setMaterialNE] = useState('');
    const [nomeFornecedor, setNomeFornecedor] = useState('');
    const [cnpjFornecedor, setCnpjFornecedor] = useState('');
    const [valorNE, setValorNE] = useState('');
    const [linkDriveNE, setLinkDriveNE] = useState('');

    // 1. CARREGAMENTO REATIVO DOS DADOS DO BANCO
    const carregarDadosDoBanco = () => {
        fetch('http://localhost:5000/credits_rpnp')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const dadosFiltradosPorFonte = data.filter(item => item.fonteRecurso === fonteRecurso);
                    setNotasEmpenho(dadosFiltradosPorFonte);
                }
            })
            .catch(err => console.error(`Erro ao carregar RPNP ${fonteRecurso}:`, err));

        fetch('http://localhost:5000/credits_ne')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setListaNEs(data);
            })
            .catch(err => console.error("Erro ao carregar NEs:", err));

        // Carrega a coleção de notas fiscais para realizar os cruzamentos matemáticos
        fetch('http://localhost:5000/credits_nf')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setListaNFs(data);
            })
            .catch(err => console.error("Erro ao carregar NFs:", err));
    };

    useEffect(() => {
        carregarDadosDoBanco();
    }, [fonteRecurso]);

    // 2. FUNÇÃO MATEMÁTICA QUE CALCULA OS SUB-SALDOS DE LIQUIDAÇÃO DE UMA NE DO RPNP
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

    // 3. SALVAMENTO COMPLETO NO BANCO DE DADOS (POST / PUT)
    const handleSalvarRPNP = (e) => {
        e.preventDefault();

        const vNC = parseFloat(valorNC.toString().replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
        const vNE = parseFloat(valorNE.toString().replace(/[^\d,.]/g, '').replace(',', '.')) || 0;

        const dadosRPNP = {
            fonteRecurso,
            nc: numeroNC,
            processo: processoNC,
            omAplicacao: omAplicacao,
            valorNC: vNC,
            finalidade: finalidadeNC,
            linkDrive: linkDriveNC,
            numeroNE: numeroNE,
            materialNE: materialNE,
            nomeFornecedor: nomeFornecedor,
            cnpjFornecedor: cnpjFornecedor,
            valorAtual: vNE,
            linkDriveNE: linkDriveNE
        };

        if (idEmEdicao) {
            fetch(`http://localhost:5000/credits_rpnp/${idEmEdicao}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...dadosRPNP, id: idEmEdicao })
            })
                .then(res => { if (!res.ok) throw new Error(); return res.json(); })
                .then(() => {
                    alert('RPNP atualizado com sucesso!');
                    carregarDadosDoBanco();
                    fecharE_Limpar();
                })
                .catch(() => alert('Erro ao atualizar o item de RPNP.'));
        } else {
            const novoRPNP = {
                ...dadosRPNP,
                id: Math.random().toString(36).substr(2, 9)
            };

            fetch('http://localhost:5000/credits_rpnp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novoRPNP)
            })
                .then(res => { if (!res.ok) throw new Error(); return res.json(); })
                .then(() => {
                    alert('Novo item de RPNP cadastrado com sucesso!');
                    carregarDadosDoBanco();
                    fecharE_Limpar();
                })
                .catch(() => alert('Erro de gravação no db.json.'));
        }
    };

    // 4. ABRIR EM MODO DE EDIÇÃO
    const handleAbrirEdicao = (item) => {
        setIdEmEdicao(item.id);
        setNumeroNC(item.nc || '');
        setProcessoNC(item.processo || '');
        setOmAplicacao(item.omAplicacao || '');
        setValorNC(item.valorNC || '');
        setFinalidadeNC(item.finalidade || '');
        setLinkDriveNC(item.linkDrive || '');
        setNumeroNE(item.numeroNE || '');
        setMaterialNE(item.materialNE || '');
        setNomeFornecedor(item.nomeFornecedor || '');
        setCnpjFornecedor(item.cnpjFornecedor || '');
        setValorNE(item.valorAtual || '');
        setLinkDriveNE(item.linkDriveNE || '');
        setIsModalOpen(true);
    };

    // 5. ABRIR EM MODO DE DETALHAMENTO COM FLUXO FINANCEIRO ATIVO
    const handleAbrirDetalhar = (item) => {
        const { emLiquidacao, liquidado } = obterFluxoFinanceiroRpnp(item.id);
        setItemDetalhado({ rpnp: item, emLiquidacao, liquidado });
        setIsDetailModalOpen(true);
    };

    // 6. EXCLUSÃO COM CONFIRMAÇÃO NATIVA
    const handleExcluirRPNP = (id, numeroIdentificador) => {
        const confirmacao = window.confirm(`Deseja realmente excluir permanentemente o RPNP Nº ${numeroIdentificador}?`);
        if (!confirmacao) return;

        fetch(`http://localhost:5000/credits_rpnp/${id}`, { method: 'DELETE' })
            .then(() => {
                alert('RPNP removido com sucesso!');
                carregarDadosDoBanco();
            })
            .catch(err => console.error("Erro ao excluir RPNP:", err));
    };

    const fecharE_Limpar = () => {
        setIdEmEdicao(null);
        setNumeroNC(''); setProcessoNC(''); setOmAplicacao(''); setValorNC(''); setFinalidadeNC(''); setLinkDriveNC('');
        setNumeroNE(''); setMaterialNE(''); setNomeFornecedor(''); setCnpjFornecedor(''); setValorNE(''); setLinkDriveNE('');
        setIsModalOpen(false);
    };

    // Filtros unificados em tempo real
    const dadosFiltrados = notasEmpenho.filter((card) => {
        const termoNE = (card.numeroNE || '').toLowerCase();
        const termoMaterial = (card.materialNE || '').toLowerCase();
        const termoFornecedor = (card.nomeFornecedor || '').toLowerCase();

        return (
            termoNE.includes(filtroOrdem.toLowerCase()) &&
            termoMaterial.includes(filtroItem.toLowerCase()) &&
            termoFornecedor.includes(filtroFornecedor.toLowerCase())
        );
    });

    return (
        <div className={styles.container}>
            <div className={styles.actionPanel} style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginBottom: '15px' }}>
                <button className={styles.btnIncluir} onClick={() => setIsModalOpen(true)}>
                    Incluir Novo RPNP
                </button>
            </div>

            <div className={styles.filterBar}>
                <div className={styles.filterGroup}>
                    <label>Ordem de Serviço / NE</label>
                    <input type="text" placeholder="Buscar por número..." value={filtroOrdem} onChange={(e) => setFiltroOrdem(e.target.value)} />
                </div>
                <div className={styles.filterGroup}>
                    <label>Material / Item</label>
                    <input type="text" placeholder="Buscar por material..." value={filtroItem} onChange={(e) => setFiltroItem(e.target.value)} />
                </div>
                <div className={styles.filterGroup}>
                    <label>Fornecedor</label>
                    <input type="text" placeholder="Buscar por fornecedor..." value={filtroFornecedor} onChange={(e) => setFiltroFornecedor(e.target.value)} />
                </div>
            </div>

            <div className={styles.cardGrid}>
                {dadosFiltrados.length > 0 ? (
                    dadosFiltrados.map((card) => {
                        const { emLiquidacao, liquidado } = obterFluxoFinanceiroRpnp(card.id);
                        const saldoAbatidoRpnp = (card.valorAtual || 0) - emLiquidacao - liquidado;

                        return (
                            <CreditsCard
                                key={card.id}
                                numeroNE={card.numeroNE}
                                finalidade={card.finalidade}
                                material={card.materialNE}
                                om={card.omAplicacao}
                                fornecedor={card.nomeFornecedor}
                                valorAtual={saldoAbatidoRpnp}
                                numeroNC={`NC Origem: ${card.nc || 'N/D'}`}
                                linkDrive={card.linkDriveNE}
                                processo={card.processo}
                                onEdit={() => handleAbrirEdicao(card)}
                                onDetail={() => handleAbrirDetalhar(card)}
                                onDelete={() => handleExcluirRPNP(card.id, card.numeroNE)}
                            />
                        );
                    })
                ) : (
                    <p className={styles.noResults}>Nenhum registro encontrado para os filtros aplicados.</p>
                )}
            </div>

            {/* MODAL DE CADASTRO / EDIÇÃO UNIFICADO (NC + NE) */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ width: '650px' }}>
                        <h2>{idEmEdicao ? 'Editar RPNP' : 'Inserir Novo RPNP'} - Fonte {fonteRecurso}</h2>
                        <form className={styles.modalForm} onSubmit={handleSalvarRPNP}>

                            <div style={{ gridColumn: 'span 2', backgroundColor: '#f0f4f8', padding: '10px', border: '1px solid #d9e2ec', borderRadius: '4px', margin: '5px 0' }}>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#102a43', display: 'block', marginBottom: '8px', textAlign: 'center' }}>DADOS DA NOTA DE CRÉDITO (NC ORIGEM)</span>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div className={styles.formGroup}>
                                        <label>Número da NC</label>
                                        <input type="text" placeholder="Ex: 2026NC00045" value={numeroNC} onChange={(e) => setNumeroNC(e.target.value)} required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Valor Total da NC (R$)</label>
                                        <input type="text" placeholder="Ex: 50000,00" value={valorNC} onChange={(e) => setValorNC(e.target.value)} required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Número do Processo NC</label>
                                        <input type="text" placeholder="Ex: 64322.0102..." value={processoNC} onChange={(e) => setProcessoNC(e.target.value)} required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>OM de Aplicação</label>
                                        <input type="text" placeholder="Ex: 5º B Log" value={omAplicacao} onChange={(e) => setOmAplicacao(e.target.value)} required />
                                    </div>
                                    <div className={styles.formGroupFull}>
                                        <label>Link da NC no Google Drive</label>
                                        <input type="url" placeholder="https://google.com..." value={linkDriveNC} onChange={(e) => setLinkDriveNC(e.target.value)} required />
                                    </div>
                                    <div className={styles.formGroupFull}>
                                        <label>Finalidade do Crédito</label>
                                        <textarea placeholder="Ex: Atender as demandas de insumos..." value={finalidadeNC} onChange={(e) => setFinalidadeNC(e.target.value)} required style={{ height: '45px', resize: 'none', padding: '6px', fontSize: '12px', border: '1px solid #cbd5e0', borderRadius: '4px' }} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ gridColumn: 'span 2', backgroundColor: '#fffaf0', padding: '10px', border: '1px solid #feebc8', borderRadius: '4px', margin: '5px 0' }}>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#dd6b20', display: 'block', marginBottom: '8px', textAlign: 'center' }}>DADOS DA NOTA DE EMPENHO (NE APLICADA)</span>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div className={styles.formGroup}>
                                        <label>Número da NE / Ordem</label>
                                        <input type="text" placeholder="Ex: 2026NE000104" value={numeroNE} onChange={(e) => setNumeroNE(e.target.value)} required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Valor do Empenho (R$)</label>
                                        <input type="text" placeholder="Ex: 45250,00" value={valorNE} onChange={(e) => setValorNE(e.target.value)} required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Nome do Fornecedor</label>
                                        <input type="text" placeholder="Ex: AMORIN LTDA" value={nomeFornecedor} onChange={(e) => setNomeFornecedor(e.target.value)} required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>CNPJ Fornecedor</label>
                                        <input type="text" placeholder="Ex: 00.000.000/0001-00" value={cnpjFornecedor} onChange={(e) => setCnpjFornecedor(e.target.value)} required />
                                    </div>
                                    <div className={styles.formGroupFull}>
                                        <label>Descrição do Material / Item Empenhado</label>
                                        <input type="text" placeholder="Ex: Reparo e manutenção de viaturas..." value={materialNE} onChange={(e) => setMaterialNE(e.target.value)} required />
                                    </div>
                                    <div className={styles.formGroupFull}>
                                        <label>Link da NE no Google Drive</label>
                                        <input type="url" placeholder="https://google.com..." value={linkDriveNE} onChange={(e) => setLinkDriveNE(e.target.value)} required />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.modalActions}>
                                <button type="submit" className={styles.btnSalvar}>{idEmEdicao ? 'Salvar Alterações' : 'Salvar RPNP'}</button>
                                <button type="button" className={styles.btnCancelar} onClick={fecharE_Limpar}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE DETALHAMENTO CRUZADO COM QUATRO INDICADORES FINANCEIROS ATIVOS */}
            {isDetailModalOpen && itemDetalhado && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ width: '600px' }}>
                        <h2>Detalhamento do RPNP</h2>
                        <div className={styles.modalForm}>
                            <div style={{ gridColumn: 'span 2', backgroundColor: '#f0f4f8', padding: '12px', border: '1px solid #d9e2ec', borderRadius: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#102a43' }}>DADOS DA NOTA DE CRÉDITO ORIGEM</span>
                                    <button type="button" className={styles.btnLinkDoc} onClick={() => window.open(itemDetalhado.rpnp?.linkDrive, '_blank', 'noopener,noreferrer')} disabled={!itemDetalhado.rpnp?.linkDrive}>Ver Documento NC</button>
                                </div>
                                <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>Nº do Processo:</strong> {itemDetalhado.rpnp?.processo}</p>
                                <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>OM de Aplicação:</strong> {itemDetalhado.rpnp?.omAplicacao}</p>
                                <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>Finalidade:</strong> {itemDetalhado.rpnp?.finalidade}</p>
                            </div>

                            <div style={{ gridColumn: 'span 2', backgroundColor: '#fff', padding: '5px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#243b53' }}>DADOS ESPECÍFICOS DA NE DO RPNP</span>
                                    <button type="button" className={styles.btnLinkDoc} style={{ backgroundColor: '#2b6cb0' }} onClick={() => window.open(itemDetalhado.rpnp?.linkDriveNE, '_blank', 'noopener,noreferrer')} disabled={!itemDetalhado.rpnp?.linkDriveNE}>Ver Documento NE</button>
                                </div>
                                <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>Material Empenhado:</strong> {itemDetalhado.rpnp?.materialNE}</p>
                                <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>Fornecedor:</strong> {itemDetalhado.rpnp?.nomeFornecedor} ({itemDetalhado.rpnp?.cnpjFornecedor})</p>
                            </div>

                            <div className={styles.formGroup}>
                                <label style={{ color: '#1e295d' }}>Valor Total da NE</label>
                                <input type="text" value={(itemDetalhado.rpnp?.valorAtual || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} disabled className={styles.inputCalculado} style={{ fontWeight: 'bold', color: '#1e295d' }} />
                            </div>
                            <div className={styles.formGroup}>
                                <label style={{ color: '#1e295d' }}>Valor em Liquidação</label>
                                <input type="text" value={itemDetalhado.emLiquidacao?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} disabled className={styles.inputCalculado} style={{ fontWeight: 'bold', color: '#1e295d' }} />
                            </div>
                            <div className={styles.formGroup}>
                                <label style={{ color: '#1e295d' }}>Valor Liquidado</label>
                                <input type="text" value={itemDetalhado.liquidado?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} disabled className={styles.inputCalculado} style={{ fontWeight: 'bold', color: '#1e295d' }} />
                            </div>
                            <div className={styles.formGroup}>
                                <label style={{ color: '#2f855a' }}>Valor Atual Líquido</label>
                                <input type="text" value={((itemDetalhado.rpnp?.valorAtual || 0) - itemDetalhado.emLiquidacao - itemDetalhado.liquidado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} disabled className={styles.inputCalculado} style={{ fontWeight: 'bold', color: '#2f855a' }} />
                            </div>

                            <div className={styles.modalActions} style={{ gridColumn: 'span 2' }}>
                                <button type="button" className={styles.btnCancelar} onClick={() => setIsDetailModalOpen(false)}>Fechar Detalhes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// AJUSTADO: Exportação atualizada para o nome correto RPNP
export default RPNP;
