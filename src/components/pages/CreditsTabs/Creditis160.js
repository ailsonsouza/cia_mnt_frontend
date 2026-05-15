import { useState, useEffect } from 'react';
import styles from '../../styles/styles_pages/styles_creditsTabs/Credits160.module.css';
import CreditsCard from './CreditsCard'; 

function Credits160({ onVerDetalhes }) { // Recebe a prop para mudar a aba no pai
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

    const carregarDados = () => {
        fetch('http://localhost:5000/credits_nc')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const apenasFR160 = data.filter(item => item.fonteRecurso === '160');
                    setListaNCs(apenasFR160);
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
    };

    useEffect(() => {
        carregarDados();
    }, []);

    const obterFluxoFinanceiroNe = (idNe) => {
        const nfsDaNe = listaNFs.filter(nf => nf.idNeVinculada === idNe);
        const emLiquidacao = nfsDaNe
            .filter(nf => nf.status === 'ENVIADA_LIQUIDACAO')
            .reduce((soma, nf) => soma + (parseFloat(nf.valor) || 0), 0);
        const liquidado = nfsDaNe
            .filter(nf => nf.status === 'LIQUIDADA')
            .reduce((soma, nf) => soma + (parseFloat(nf.valor) || 0), 0);

        return { emLiquidacao, liquidado };
    };

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
            const ncOrigem = listaNCs.find(nc => nc.id === item.idNcVinculada);
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

    // CORRIGIDO: Agora chama a função de troca de aba no componente pai (Credits.js)
    const handleAbrirDetalhar = (item, tipo) => {
        if (tipo === 'NC') {
            if (item.linkDrive) window.open(item.linkDrive, '_blank', 'noopener,noreferrer');
            else alert('Link do Google Drive não localizado.');
        } else {
            // Executa a função do pai para mudar a aba ativa na mesma janela
            if (onVerDetalhes) {
                onVerDetalhes(item.id);
            }
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
            const ncOriginal = listaNCs.find(n => n.id === idNcVinculadaANe) || {};
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

    const ncsFiltradas = listaNCs.filter(card => (card.nc || '').toLowerCase().includes(filtroNC.toLowerCase()) && (card.processo || '').toLowerCase().includes(filtroProcesso.toLowerCase()) && (card.omAplicacao || '').toLowerCase().includes(filtroOM.toLowerCase()) && (card.fornecedor || '').toLowerCase().includes(filtroFornecedor.toLowerCase()));
    const idsNcEmpenhadas = new Set(listaNEs.map(ne => ne.idNcVinculada));
    const ncsDisponiveis = ncsFiltradas.filter(nc => !idsNcEmpenhadas.has(nc.id));
    
    const nesRealizadas = listaNEs.filter(ne => listaNCs.some(nc => nc.id === ne.idNcVinculada)).filter(ne => {
        const ncOrigem = listaNCs.find(nc => nc.id === ne.idNcVinculada) || {};
        return ((ne.numeroNE || '').toLowerCase().includes(filtroNC.toLowerCase()) || (ncOrigem.nc || '').toLowerCase().includes(filtroNC.toLowerCase())) && (ncOrigem.processo || '').toLowerCase().includes(filtroProcesso.toLowerCase()) && (ncOrigem.omAplicacao || '').toLowerCase().includes(filtroOM.toLowerCase()) && (ne.nomeFornecedor || '').toLowerCase().includes(filtroFornecedor.toLowerCase());
    });

    return (
        <div className={styles.container}>
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

            <div className={styles.sectionDivider} style={{ marginTop: '40px' }}>
                <h3>Notas de Empenho (Crédito Aplicado)</h3>
                <span className={styles.badge} style={{ backgroundColor: '#2b6cb0' }}>{nesRealizadas.length}</span>
            </div>
            <div className={styles.cardGrid}>
                {nesRealizadas.map((ne) => {
                    const ncOrigem = listaNCs.find(nc => nc.id === ne.idNcVinculada) || {};
                    const { emLiquidacao, liquidado } = obterFluxoFinanceiroNe(ne.id);
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
                                            <option value="">-- Selecione o item homologado no Pregão --</option>
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
        </div>
    );
}

export default Credits160;