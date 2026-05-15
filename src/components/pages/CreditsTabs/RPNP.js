import { useState, useEffect } from 'react';
import styles from '../../styles/styles_pages/styles_creditsTabs/RPNP.module.css';
import CreditsCard from './CreditsCard';

function RPNP({ fonteRecurso, onVerDetalhes }) {
    const [notasEmpenho, setNotasEmpenho] = useState([]);
    const [listaNFs, setListaNFs] = useState([]); 
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Estados para os filtros
    const [filtroOrdem, setFiltroOrdem] = useState('');
    const [filtroItem, setFiltroItem] = useState('');
    const [filtroFornecedor, setFiltroFornecedor] = useState('');

    // Estados do Formulário
    const [idEmEdicao, setIdEmEdicao] = useState(null);
    const [numeroNC, setNumeroNC] = useState('');
    const [processoNC, setProcessoNC] = useState('');
    const [omAplicacao, setOmAplicacao] = useState('');
    const [valorNC, setValorNC] = useState('');
    const [finalidadeNC, setFinalidadeNC] = useState('');
    const [linkDriveNC, setLinkDriveNC] = useState('');
    const [numeroNE, setNumeroNE] = useState('');
    const [materialNE, setMaterialNE] = useState('');
    const [nomeFornecedor, setNomeFornecedor] = useState('');
    const [cnpjFornecedor, setCnpjFornecedor] = useState('');
    const [valorNE, setValorNE] = useState('');
    const [linkDriveNE, setLinkDriveNE] = useState('');

    const carregarDadosDoBanco = () => {
        fetch('http://localhost:5000/credits_rpnp')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const dadosFiltradosPorFonte = data.filter(item => item.fonteRecurso === fonteRecurso);
                    setNotasEmpenho(dadosFiltradosPorFonte);
                }
            })
            .catch(err => console.error("Erro RPNP:", err));

        fetch('http://localhost:5000/credits_nf')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setListaNFs(data); })
            .catch(err => console.error("Erro NFs:", err));
    };

    useEffect(() => {
        carregarDadosDoBanco();
    }, [fonteRecurso]);

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

        const metodo = idEmEdicao ? 'PUT' : 'POST';
        const url = idEmEdicao ? `http://localhost:5000/credits_rpnp/${idEmEdicao}` : 'http://localhost:5000/credits_rpnp';

        fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(idEmEdicao ? { ...dadosRPNP, id: idEmEdicao } : { ...dadosRPNP, id: Math.random().toString(36).substr(2, 9) })
        })
        .then(() => {
            alert(idEmEdicao ? 'Atualizado!' : 'Cadastrado!');
            carregarDadosDoBanco();
            fecharE_Limpar();
        });
    };

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

    const handleExcluirRPNP = (id, numeroIdentificador) => {
        if (!window.confirm(`Excluir RPNP Nº ${numeroIdentificador}?`)) return;
        fetch(`http://localhost:5000/credits_rpnp/${id}`, { method: 'DELETE' })
            .then(() => {
                alert('Removido!');
                carregarDadosDoBanco();
            });
    };

    const handleAbrirDetalhar = (item) => {
        if (onVerDetalhes) {
            onVerDetalhes(item.id);
        }
    };

    const fecharE_Limpar = () => {
        setIdEmEdicao(null);
        setNumeroNC(''); setProcessoNC(''); setOmAplicacao(''); setValorNC(''); setFinalidadeNC(''); setLinkDriveNC('');
        setNumeroNE(''); setMaterialNE(''); setNomeFornecedor(''); setCnpjFornecedor(''); setValorNE(''); setLinkDriveNE('');
        setIsModalOpen(false);
    };

    const dadosFiltrados = notasEmpenho.filter((card) => {
        return (card.numeroNE || '').toLowerCase().includes(filtroOrdem.toLowerCase()) &&
               (card.materialNE || '').toLowerCase().includes(filtroItem.toLowerCase()) &&
               (card.nomeFornecedor || '').toLowerCase().includes(filtroFornecedor.toLowerCase());
    });

    return (
        <div className={styles.container}>
            <div className={styles.actionPanel} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                <button className={styles.btnIncluir} onClick={() => setIsModalOpen(true)}>Incluir Novo RPNP</button>
            </div>

            <div className={styles.filterBar}>
                <div className={styles.filterGroup}>
                    <label>Ordem de Serviço / NE</label>
                    <input type="text" value={filtroOrdem} onChange={(e) => setFiltroOrdem(e.target.value)} />
                </div>
                <div className={styles.filterGroup}>
                    <label>Material / Item</label>
                    <input type="text" value={filtroItem} onChange={(e) => setFiltroItem(e.target.value)} />
                </div>
                <div className={styles.filterGroup}>
                    <label>Fornecedor</label>
                    <input type="text" value={filtroFornecedor} onChange={(e) => setFiltroFornecedor(e.target.value)} />
                </div>
            </div>

            <div className={styles.cardGrid}>
                {dadosFiltrados.map((card) => {
                    const { emLiquidacao, liquidado } = obterFluxoFinanceiroRpnp(card.id);
                    return (
                        <CreditsCard
                            key={card.id}
                            numeroNE={card.numeroNE}
                            finalidade={card.finalidade}
                            material={card.materialNE}
                            om={card.omAplicacao}
                            fornecedor={card.nomeFornecedor}
                            valorAtual={(card.valorAtual || 0) - emLiquidacao - liquidado}
                            numeroNC={`NC Origem: ${card.nc || 'N/D'}`}
                            linkDrive={card.linkDriveNE}
                            processo={card.processo}
                            onEdit={() => handleAbrirEdicao(card)}
                            onDetail={() => handleAbrirDetalhar(card)}
                            onDelete={() => handleExcluirRPNP(card.id, card.numeroNE)}
                        />
                    );
                })}
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ width: '650px' }}>
                        <h2>{idEmEdicao ? 'Editar RPNP' : 'Inserir Novo RPNP'}</h2>
                        <form className={styles.modalForm} onSubmit={handleSalvarRPNP}>
                            <div className={styles.formGroup}><label>Número da NC</label><input type="text" value={numeroNC} onChange={(e) => setNumeroNC(e.target.value)} required /></div>
                            <div className={styles.formGroup}><label>Valor Total da NC</label><input type="text" value={valorNC} onChange={(e) => setValorNC(e.target.value)} required /></div>
                            <div className={styles.formGroup}><label>Processo</label><input type="text" value={processoNC} onChange={(e) => setProcessoNC(e.target.value)} required /></div>
                            <div className={styles.formGroup}><label>OM</label><input type="text" value={omAplicacao} onChange={(e) => setOmAplicacao(e.target.value)} required /></div>
                            <div className={styles.formGroupFull}><label>Link NC</label><input type="url" value={linkDriveNC} onChange={(e) => setLinkDriveNC(e.target.value)} required /></div>
                            <div className={styles.formGroupFull}><label>Finalidade</label><textarea value={finalidadeNC} onChange={(e) => setFinalidadeNC(e.target.value)} required /></div>
                            
                            <hr style={{ gridColumn: 'span 2', width: '100%', margin: '15px 0' }} />
                            
                            <div className={styles.formGroup}><label>Número da NE</label><input type="text" value={numeroNE} onChange={(e) => setNumeroNE(e.target.value)} required /></div>
                            <div className={styles.formGroup}><label>Valor Empenho</label><input type="text" value={valorNE} onChange={(e) => setValorNE(e.target.value)} required /></div>
                            <div className={styles.formGroup}><label>Fornecedor</label><input type="text" value={nomeFornecedor} onChange={(e) => setNomeFornecedor(e.target.value)} required /></div>
                            <div className={styles.formGroup}><label>CNPJ</label><input type="text" value={cnpjFornecedor} onChange={(e) => setCnpjFornecedor(e.target.value)} required /></div>
                            <div className={styles.formGroupFull}><label>Material</label><input type="text" value={materialNE} onChange={(e) => setMaterialNE(e.target.value)} required /></div>
                            <div className={styles.formGroupFull}><label>Link NE</label><input type="url" value={linkDriveNE} onChange={(e) => setLinkDriveNE(e.target.value)} required /></div>
                            
                            <div className={styles.modalActions}>
                                <button type="submit" className={styles.btnSalvar}>Salvar</button>
                                <button type="button" className={styles.btnCancelar} onClick={fecharE_Limpar}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RPNP;