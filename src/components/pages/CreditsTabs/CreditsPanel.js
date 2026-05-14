import { useState, useEffect, useMemo, useCallback } from 'react';
import styles from '../../styles/styles_pages/styles_creditsTabs/CreditsPanel.module.css';
import CreditsCard from './CreditsCard'; 

// O componente agora recebe a fonte (160 ou 167) e a UG dinamicamente
function CreditsPanel({ fonteAlvo, ugAlvo }) {
    const [listaNCs, setListaNCs] = useState([]);
    const [listaNEs, setListaNEs] = useState([]);
    const [listaNFs, setListaNFs] = useState([]); 
    const [listaItensPregao, setListaItensPregao] = useState([]);
    
    // Estados para os filtros centralizados
    const [filtroNC, setFiltroNC] = useState('');
    const [filtroProcesso, setFiltroProcesso] = useState('');
    const [filtroOM, setFiltroOM] = useState('');
    const [filtroFornecedor, setFiltroFornecedor] = useState('');

    // Estados para o Modal de Edição
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [tipoEdicao, setTipoEdicao] = useState(''); 
    const [idEmEdicao, setIdEmEdicao] = useState('');
    
    // Estados para o Modal de Detalhes
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [itemDetalhado, setItemDetalhado] = useState(null);

    // Campos controlados do formulário de edição
    const [campoNumero, setCampoNumero] = useState('');
    const [campoProcesso, setCampoProcesso] = useState('');
    const [campoFinalidade, setCampoFinalidade] = useState('');
    const [campoOM, setCampoOM] = useState('');
    const [campoValor, setCampoValor] = useState('');
    const [campoLink, setCampoLink] = useState('');
    
    const [campoPrazo, setCampoPrazo] = useState('');
    const [campoIsImediato, setCampoIsImediato] = useState(false);

    // Campos de NE controlados por regras dinâmicas
    const [idMaterialSelecionado, setIdMaterialSelecionado] = useState('');
    const [descricaoItemManual, setDescricaoItemManual] = useState('');
    const [campoFornecedor, setCampoFornecedor] = useState('');
    const [campoCnpj, setCampoCnpj] = useState('');
    const [isModoManual, setIsModoManual] = useState(false);
    const [idNcVinculadaANe, setIdNcVinculadaANe] = useState('');

    useEffect(() => {
        if (campoIsImediato) {
            setCampoPrazo('EMPENHO IMEDIATO');
        } else {
            setCampoPrazo(anterior => anterior === 'EMPENHO IMEDIATO' ? '' : anterior);
        }
    }, [campoIsImediato]);

    // Otimização: useCallback evita recriação da função e renderizações extras
    const carregarDados = useCallback(() => {
        fetch('http://localhost:5000/credits_nc')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // FILTRAGEM DINÂMICA: Baseada na propriedade 'fonteAlvo' recebida
                    const apenasFonteEspecifica = data.filter(item => item.fonteRecurso === fonteAlvo);
                    setListaNCs(apenasFonteEspecifica);
                }
            })
            .catch(err => console.error("Erro ao carregar NCs:", err));

        fetch('http://localhost:5000/credits_ne')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setListaNEs(data);
            })
            .catch(err => console.error("Erro ao carregar NEs:", err));

        fetch('http://localhost:5000/credits_nf')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setListaNFs(data);
            })
            .catch(err => console.error("Erro ao carregar NFs:", err));

        fetch('http://localhost:5000/credits')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setListaItensPregao(data);
            })
            .catch(err => console.error("Erro ao carregar itens do pregão:", err));
    }, [fonteAlvo]);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    // Otimização O(1): Criação de índices mapeados para evitar múltiplos laços .find() lentos
    const ncMap = useMemo(() => new Map(listaNCs.map(nc => [nc.id, nc])), [listaNCs]);

    // Otimização: Pré-calcula o fluxo financeiro de todas as NEs de uma vez só por renderização
    const fluxoFinNeMap = useMemo(() => {
        const mapa = new Map();
        listaNEs.forEach(ne => {
            const nfsDaNe = listaNFs.filter(nf => nf.idNeVinculada === ne.id);
            const emLiquidacao = nfsDaNe.filter(nf => nf.status === 'ENVIADA_LIQUIDACAO').reduce((s, nf) => s + (parseFloat(nf.valor) || 0), 0);
            const liquidado = nfsDaNe.filter(nf => nf.status === 'LIQUIDADA').reduce((s, nf) => s + (parseFloat(nf.valor) || 0), 0);
            mapa.set(ne.id, { emLiquidacao, liquidado });
        });
        return mapa;
    }, [listaNEs, listaNFs]);

    const handleMudarMaterialEdicao = (valorSelect) => {
        setIdMaterialSelecionado(valorSelect);
        if (valorSelect === 'OUTRO') {
            setIsModoManual(true); setDescricaoItemManual(''); setCampoFornecedor(''); setCampoCnpj('');
        } else if (valorSelect !== '') {
            setIsModoManual(false); setDescricaoItemManual('');
            const itemPregao = listaItensPregao.find(item => item.id === valorSelect);
            if (itemPregao) { setCampoFornecedor(itemPregao.fornecedor || ''); setCampoCnpj(itemPregao.cnpj || ''); }
        } else {
            setIsModoManual(false); setDescricaoItemManual(''); setCampoFornecedor(''); setCampoCnpj('');
        }
    };

    const handleExcluirItem = (id, tipo, numeroIdentificador) => {
        const confirmacao = window.confirm(`Deseja realmente excluir permanentemente o documento Nº ${numeroIdentificador}?`);
        if (!confirmacao) return;
        const endpoint = tipo === 'NC' ? 'credits_nc' : 'credits_ne';
        fetch(`http://localhost:5000/${endpoint}/${id}`, { method: 'DELETE' })
        .then(() => { alert('Documento removido com sucesso!'); carregarDados(); });
    };

    const handleAbrirEdicao = (item, tipo) => {
        setTipoEdicao(tipo);
        setIdEmEdicao(item.id);
        setIsEditModalOpen(true);

        if (tipo === 'NC') {
            setCampoNumero(item.nc || '');
            setCampoProcesso(item.processo || '');
            setCampoFinalidade(item.finalidade || '');
            setCampoOM(item.omAplicacao || '');
            setCampoValor(item.valor ? item.valor.toString() : '');
            setCampoLink(item.linkDrive || '');
            
            const prazoSalvo = item.prazoEmpenho || '';
            setCampoPrazo(prazoSalvo);
            setCampoIsImediato(prazoSalvo.toUpperCase() === 'EMPENHO IMEDIATO');
        } else {
            setCampoNumero(item.numeroNE || '');
            setCampoLink(item.linkDriveNE || '');
            setIdNcVinculadaANe(item.idNcVinculada || '');

            const ncOrigem = ncMap.get(item.idNcVinculada);
            if (ncOrigem) {
                setCampoProcesso(ncOrigem.processo || '');
                setCampoFinalidade(ncOrigem.finalidade || '');
                setCampoOM(ncOrigem.omAplicacao || '');
                setCampoValor(ncOrigem.valor ? ncOrigem.valor.toString() : '');
            }

            const itemCorrespondente = listaItensPregao.find(i => `Item ${i.item} - ${i.descricao}` === item.materialNE);
            if (itemCorrespondente) {
                setIsModoManual(false); setIdMaterialSelecionado(itemCorrespondente.id); setDescricaoItemManual('');
                setCampoFornecedor(itemCorrespondente.fornecedor || ''); setCampoCnpj(itemCorrespondente.cnpj || '');
            } else {
                setIsModoManual(true); setIdMaterialSelecionado('OUTRO'); setDescricaoItemManual(item.materialNE || '');
                setCampoFornecedor(item.nomeFornecedor || ''); setCampoCnpj(item.cnpjFornecedor || '');
            }
        }
    };

    const handleAbrirDetalhar = (item, tipo) => {
        if (tipo === 'NC') {
            if (item.linkDrive) window.open(item.linkDrive, '_blank', 'noopener,noreferrer');
            else alert('Link do Google Drive não localizado.');
        } else {
            const ncOrigem = ncMap.get(item.idNcVinculada) || {};
            const { emLiquidacao, liquidado } = fluxoFinNeMap.get(item.id) || { emLiquidacao: 0, liquidado: 0 };
            setItemDetalhado({ ne: item, nc: ncOrigem, emLiquidacao, liquidado });
            setIsDetailModalOpen(true);
        }
    };

    const handleSalvarEdicao = (e) => {
        e.preventDefault();

        if (tipoEdicao === 'NC') {
            const ncEncontrada = listaNCs.find(n => n.id === idEmEdicao) || {};
            const dadosAltualizadosNC = {
                ...ncEncontrada,
                nc: campoNumero,
                processo: campoProcesso,
                finalidade: campoFinalidade,
                omAplicacao: campoOM,
                linkDrive: campoLink,
                prazoEmpenho: campoPrazo, 
                valor: parseFloat(campoValor) || 0
            };

            fetch(`http://localhost:5000/credits_nc/${idEmEdicao}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosAltualizadosNC)
            }).then(() => { alert('Nota de Crédito atualizada!'); fecharModalEdicao(); });

        } else {
            const confirmacaoNC = window.confirm("Atenção: Você realizou alterações nos dados de origem da Nota de Crédito (NC) vinculada. Deseja confirmar essas mudanças na NC base?");
            if (!confirmacaoNC) return;

            const ncOriginal = ncMap.get(idNcVinculadaANe) || {};
            const dadosAltualizadosNC = {
                ...ncOriginal,
                processo: campoProcesso,
                finalidade: campoFinalidade,
                omAplicacao: campoOM,
                valor: parseFloat(campoValor) || 0
            };

            fetch(`http://localhost:5000/credits_nc/${idNcVinculadaANe}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosAltualizadosNC)
            });

            const neEncontrada = listaNEs.find(n => n.id === idEmEdicao) || {};
            let textoMaterialFinal = isModoManual ? descricaoItemManual : (`Item ${(listaItensPregao.find(i => i.id === idMaterialSelecionado) || {}).item} - ${(listaItensPregao.find(i => i.id === idMaterialSelecionado) || {}).descricao}`);
            
            const dadosAltualizadosNE = {
                ...neEncontrada,
                numeroNE: campoNumero,
                materialNE: textoMaterialFinal,
                nomeFornecedor: campoFornecedor,
                cnpjFornecedor: campoCnpj,
                linkDriveNE: campoLink
            };

            fetch(`http://localhost:5000/credits_ne/${idEmEdicao}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosAltualizadosNE)
            }).then(() => { alert('Nota de Empenho atualizada com sucesso!'); fecharModalEdicao(); });
        }
    };

    const fecharModalEdicao = () => { setIsEditModalOpen(false); carregarDados(); };

    // Filtros unificados reativos memorizados com useMemo para ganho de performance em busca
    const ncsDisponiveis = useMemo(() => {
        const ncsFiltradas = listaNCs.filter(card => 
            (card.nc || '').toLowerCase().includes(filtroNC.toLowerCase()) && 
            (card.processo || '').toLowerCase().includes(filtroProcesso.toLowerCase()) && 
            (card.omAplicacao || '').toLowerCase().includes(filtroOM.toLowerCase()) && 
            (card.fornecedor || '').toLowerCase().includes(filtroFornecedor.toLowerCase())
        );
        const idsNcEmpenhadas = new Set(listaNEs.map(ne => ne.idNcVinculada));
        return ncsFiltradas.filter(nc => !idsNcEmpenhadas.has(nc.id));
    }, [listaNCs, listaNEs, filtroNC, filtroProcesso, filtroOM, filtroFornecedor]);

    const nesRealizadas = useMemo(() => {
        return listaNEs.filter(ne => ncMap.has(ne.idNcVinculada)).filter(ne => {
            const ncOrigem = ncMap.get(ne.idNcVinculada) || {};
            return (
                ((ne.numeroNE || '').toLowerCase().includes(filtroNC.toLowerCase()) || (ncOrigem.nc || '').toLowerCase().includes(filtroNC.toLowerCase())) && 
                (ncOrigem.processo || '').toLowerCase().includes(filtroProcesso.toLowerCase()) && 
                (ncOrigem.omAplicacao || '').toLowerCase().includes(filtroOM.toLowerCase()) && 
                (ne.nomeFornecedor || '').toLowerCase().includes(filtroFornecedor.toLowerCase())
            );
        });
    }, [listaNEs, ncMap, filtroNC, filtroProcesso, filtroOM, filtroFornecedor]);

    return (
        <div className={styles.container}>
            {/* O cabeçalho agora consome a propriedade 'ugAlvo' dinâmica */}
            <h2>Painel de Gestão Orçamentária - UG {ugAlvo}</h2>
            
            <div className={styles.filterBar}>
                <div className={styles.filterGroup}>
                    <label>Nº do Documento (NC ou NE)</label>
                    <input type="text" placeholder="Buscar..." value={filtroNC} onChange={(e) => setFiltroNC(e.target.value)} />
                </div>
                <div className={styles.filterGroup}>
                    <label>Número do Processo</label>
                    <input type="text" placeholder="Buscar..." value={filtroProcesso} onChange={(e) => setFiltroProcesso(e.target.value)} />
                </div>
                <div className={styles.filterGroup}>
                    <label>OM de Aplicação</label>
                    <input type="text" placeholder="Buscar..." value={filtroOM} onChange={(e) => setFiltroOM(e.target.value)} />
                </div>
                <div className={styles.filterGroup}>
                    <label>Fornecedor</label>
                    <input type="text" placeholder="Buscar..." value={filtroFornecedor} onChange={(e) => setFiltroFornecedor(e.target.value)} />
                </div>
            </div>

            {/* SEÇÃO 1: NCs */}
            <div className={styles.sectionDivider}>
                <h3>Notas de Crédito (Saldo Disponível)</h3>
                <span className={styles.badge}>{ncsDisponiveis.length}</span>
            </div>
            <div className={styles.cardGrid}>
                {ncsDisponiveis.map((card) => (
                    <CreditsCard 
                        key={card.id}
                        numeroNE={card.nc} 
                        finalidade={card.finalidade}
                        processo={card.processo}
                        material={card.material} 
                        om={card.omAplicacao}
                        fornecedor={card.fornecedor}
                        valorAtual={card.valor}
                        linkDrive={card.linkDrive}
                        prazoEmpenho={card.prazoEmpenho} 
                        onEdit={() => handleAbrirEdicao(card, 'NC')}
                        onDetail={() => handleAbrirDetalhar(card, 'NC')}
                        onDelete={() => handleExcluirItem(card.id, 'NC', card.nc)}
                    />
                ))}
                {ncsDisponiveis.length === 0 && <p className={styles.noResultsInline}>Nenhuma NC disponível.</p>}
            </div>

            {/* SEÇÃO 2: NEs */}
            <div className={styles.sectionDivider} style={{ marginTop: '40px' }}>
                <h3>Notas de Empenho (Crédito Aplicado)</h3>
                <span className={styles.badge} style={{ backgroundColor: '#2b6cb0' }}>{nesRealizadas.length}</span>
            </div>
            <div className={styles.cardGrid}>
                {nesRealizadas.map((ne) => {
                    const ncOrigem = ncMap.get(ne.idNcVinculada) || {};
                    const { emLiquidacao, liquidado } = fluxoFinNeMap.get(ne.id) || { emLiquidacao: 0, liquidado: 0 };
                    const saldoAbatidoNe = (ncOrigem.valor || 0) - emLiquidacao - liquidado; 

                    return (
                        <CreditsCard 
                            key={ne.id}
                            numeroNE={ne.numeroNE} 
                            finalidade={ncOrigem.finalidade}
                            processo={ncOrigem.processo}
                            material={ne.materialNE} 
                            om={ncOrigem.omAplicacao}
                            fornecedor={ne.nomeFornecedor} 
                            valorAtual={saldoAbatidoNe} 
                            linkDrive={ne.linkDriveNE}
                            tempoCronologico={ne.dataGeracaoNE}
                            numeroNC={`NC Origem: ${ncOrigem.nc || 'N/D'}`}
                            onEdit={() => handleAbrirEdicao(ne, 'NE')}
                            onDetail={() => handleAbrirDetalhar(ne, 'NE')}
                            onDelete={() => handleExcluirItem(ne.id, 'NE', ne.numeroNE)}
                        />
                    );
                })}
                {nesRealizadas.length === 0 && <p className={styles.noResultsInline}>Nenhum empenho gerado.</p>}
            </div>

            {/* MODAL CO-REUTILIZÁVEL PARA EDIÇÃO AVANÇADA */}
            {isEditModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>Editar {tipoEdicao === 'NC' ? 'Nota de Crédito' : 'Nota de Empenho'}</h2>
                        <form className={styles.modalForm} onSubmit={handleSalvarEdicao}>
                            <div className={styles.formGroup}>
                                <label>Número da {tipoEdicao}</label>
                                <input type="text" value={campoNumero} onChange={(e) => setCampoNumero(e.target.value)} required />
                            </div>
                            {tipoEdicao === 'NC' ? (
                                <>
                                    <div className={styles.formGroup}>
                                        <label>Valor Monetário (R$)</label>
                                        <input type="number" value={campoValor} onChange={(e) => setCampoValor(e.target.value)} required />
                                    </div>
                                    <div className={styles.formGroupFull}>
                                        <label>OM de Aplicação</label>
                                        <input type="text" value={campoOM} onChange={(e) => setCampoOM(e.target.value)} required />
                                    </div>
                                    <div className={styles.formGroupFull}>
                                        <label>Número do Processo</label>
                                        <input type="text" value={campoProcesso} onChange={(e) => setCampoProcesso(e.target.value)} required />
                                    </div>
                                    <div className={styles.formGroupFull}>
                                        <label>Prazo para Empenho</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '100%' }}>
                                            <input type={campoIsImediato ? "text" : "date"} value={campoPrazo} onChange={(e) => setCampoPrazo(e.target.value)} disabled={campoIsImediato} required style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e0', borderRadius: '4px' }} />
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={campoIsImediato} onChange={(e) => setCampoIsImediato(e.target.checked)} /> Empenho Imediato
                                            </label>
                                        </div>
                                    </div>
                                    <div className={styles.formGroupFull}>
                                        <label>Finalidade do Crédito</label>
                                        <textarea value={campoFinalidade} onChange={(e) => setCampoFinalidade(e.target.value)} required style={{height: '55px'}} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ gridColumn: 'span 2', backgroundColor: '#fffaf0', padding: '10px', border: '1px solid #feebc8', borderRadius: '4px', margin: '5px 0' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#dd6b20', display: 'block', marginBottom: '8px', textAlign: 'center' }}>DADOS DA NOTA DE CRÉDITO (NC ORIGEM)</span>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            <div className={styles.formGroup}>
                                                <label>OM Aplicação NC</label>
                                                <input type="text" value={campoOM} onChange={(e) => setCampoOM(e.target.value)} required />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Valor da NC (R$)</label>
                                                <input type="number" value={campoValor} onChange={(e) => setCampoValor(e.target.value)} required />
                                            </div>
                                            <div className={styles.formGroupFull}>
                                                <label>Nº Processo NC</label>
                                                <input type="text" value={campoProcesso} onChange={(e) => setCampoProcesso(e.target.value)} required />
                                            </div>
                                            <div className={styles.formGroupFull}>
                                                <label>Finalidade da NC</label>
                                                <textarea value={campoFinalidade} onChange={(e) => setCampoFinalidade(e.target.value)} required style={{height: '40px', resize: 'none'}} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.formGroupFull} style={{ marginTop: '5px' }}>
                                        <label>Descrição do Material Empenhado</label>
                                        <select value={idMaterialSelecionado} onChange={(e) => handleMudarMaterialEdicao(e.target.value)} required style={{padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', width: '100%'}}>
                                            <option value="">-- Selecione the item homologado no Pregão --</option>
                                            {listaItensPregao.map(item => <option key={item.id} value={item.id}>Item {item.item} - {item.descricao.substring(0, 55)}...</option>)}
                                            <option value="OUTRO" style={{color: '#dc3545', fontWeight: 'bold'}}>+ OUTRA MODALIDADE (CARONA, DISPENSA ELETRÔNICA, ETC.)</option>
                                        </select>
                                    </div>
                                    {isModoManual && (
                                        <div className={styles.formGroupFull}>
                                            <label style={{color: '#dc3545'}}>Descrição do Material Manual</label>
                                            <input type="text" value={descricaoItemManual} onChange={(e) => setDescricaoItemManual(e.target.value)} required />
                                        </div>
                                    )}
                                    <div className={styles.formGroup}>
                                        <label>Nome do Fornecedor</label>
                                        <input type="text" value={campoFornecedor} onChange={(e) => setCampoFornecedor(e.target.value)} disabled={!isModoManual} required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>CNPJ da Empresa</label>
                                        <input type="text" value={campoCnpj} onChange={(e) => setCampoCnpj(e.target.value)} disabled={!isModoManual} required />
                                    </div>
                                </>
                            )}
                            <div className={styles.formGroupFull}>
                                <label>Link de Compartilhamento Google Drive</label>
                                <input type="url" value={campoLink} onChange={(e) => setCampoLink(e.target.value)} required />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="submit" className={styles.btnSalvar}>Salvar Alterações</button>
                                <button type="button" className={styles.btnCancelar} onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE DETALHAMENTO CRUZADO */}
            {isDetailModalOpen && itemDetalhado && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ width: '600px' }}>
                        <h2>Detalhamento da Nota de Empenho</h2>
                        <div className={styles.modalForm}>
                            <div style={{ gridColumn: 'span 2', backgroundColor: '#f0f4f8', padding: '12px', border: '1px solid #d9e2ec', borderRadius: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#102a43' }}>DADOS DA NOTA DE CRÉDITO ORIGEM</span>
                                    <button type="button" className={styles.btnLinkDoc} onClick={() => window.open(itemDetalhado.nc?.linkDrive, '_blank', 'noopener,noreferrer')} disabled={!itemDetalhado.nc?.linkDrive}>Ver Documento NC</button>
                                </div>
                                <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>Nº do Processo:</strong> {itemDetalhado.nc?.processo}</p>
                                <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>OM de Aplicação:</strong> {itemDetalhado.nc?.omAplicacao}</p>
                                <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>Finalidade:</strong> {itemDetalhado.nc?.finalidade}</p>
                            </div>
                            
                            <div style={{ gridColumn: 'span 2', backgroundColor: '#fff', padding: '5px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#243b53' }}>DADOS ESPECÍFICOS DA NE</span>
                                    <button type="button" className={styles.btnLinkDoc} style={{ backgroundColor: '#2b6cb0' }} onClick={() => window.open(itemDetalhado.ne?.linkDriveNE, '_blank', 'noopener,noreferrer')} disabled={!itemDetalhado.ne?.linkDriveNE}>Ver Documento NE</button>
                                </div>
                                <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>Material da NE:</strong> {itemDetalhado.ne?.materialNE}</p>
                                <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>Fornecedor:</strong> {itemDetalhado.ne?.nomeFornecedor} ({itemDetalhado.ne?.cnpjFornecedor})</p>
                            </div>

                            <div className={styles.formGroup}>
                                <label style={{ color: '#1e295d' }}>Valor Total da NE</label>
                                <input type="text" value={(itemDetalhado.nc?.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} disabled className={styles.inputCalculado} style={{fontWeight: 'bold', color: '#1e295d'}} />
                            </div>
                            <div className={styles.formGroup}>
                                <label style={{ color: '#2b6cb0' }}>Valor Atual Líquido</label>
                                <input type="text" value={((itemDetalhado.nc?.valor || 0) - itemDetalhado.emLiquidacao - itemDetalhado.liquidado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} disabled className={styles.inputCalculado} style={{fontWeight: 'bold', color: '#2b6cb0'}} />
                            </div>
                            <div className={styles.formGroup}>
                                <label style={{ color: '#b7791f' }}>Valor em Liquidação</label>
                                <input type="text" value={itemDetalhado.emLiquidacao?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} disabled className={styles.inputCalculado} style={{fontWeight: 'bold', color: '#b7791f'}} />
                            </div>
                            <div className={styles.formGroup}>
                                <label style={{ color: '#2f855a' }}>Valor Liquidado</label>
                                <input type="text" value={itemDetalhado.liquidado?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} disabled className={styles.inputCalculado} style={{fontWeight: 'bold', color: '#2f855a'}} />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.btnCancelar} onClick={() => setIsDetailModalOpen(false)}>Fechar Detalhes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreditsPanel;
