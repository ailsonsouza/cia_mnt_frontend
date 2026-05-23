import styles from '../../styles/styles_pages/styles_creditsTabs/CreditisCard.module.css';


import { BsPencil, BsEye, BsXCircle } from 'react-icons/bs';
import { useState, useEffect } from 'react';

function CreditsCard({ 
    numeroNE, 
    finalidade,
    omAplicacao,
    processo,
    material, 
    fornecedor, 
    valorAtual, 
    linkDrive, 
    numeroNC, 
    tempoCronologico, 
    neId,
    onEdit, 
    onDetail, 
    onCancelar 
}){
    const [saldoAtualNE, setSaldoAtualNE] = useState(valorAtual);
    const [carregandoSaldo, setCarregandoSaldo] = useState(true);

    // Buscar o saldo atual considerando as NFs vinculadas
    useEffect(() => {
        if (neId) {
            fetch('http://localhost:5000/credits_nf')
                .then(res => res.json())
                .then(nfs => {
                    const nfsDaNe = nfs.filter(nf => nf.idNeVinculada === neId);
                    const totalLiquidado = nfsDaNe.reduce((sum, nf) => sum + (parseFloat(nf.valor) || 0), 0);
                    const saldo = (valorAtual || 0) - totalLiquidado;
                    setSaldoAtualNE(saldo);
                    setCarregandoSaldo(false);
                })
                .catch(() => {
                    setSaldoAtualNE(valorAtual);
                    setCarregandoSaldo(false);
                });
        } else {
            setSaldoAtualNE(valorAtual);
            setCarregandoSaldo(false);
        }
    }, [valorAtual, neId]);

    const valorFormatado = typeof saldoAtualNE === 'number'
        ? saldoAtualNE.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : valorAtual;

    const calcularDiasDesdeGeracao = (dataGeracao) => {
        if (!dataGeracao) return 'Data não disponível';
        
        const dataNE = new Date(dataGeracao);
        const dataAtual = new Date();
        
        dataNE.setHours(0, 0, 0, 0);
        dataAtual.setHours(0, 0, 0, 0);

        const diferencaTempo = dataAtual - dataNE;
        const diasDecorridos = Math.floor(diferencaTempo / (1000 * 60 * 60 * 24));

        if (diasDecorridos === 0) return 'Gerado Hoje';
        if (diasDecorridos === 1) return '1 dia decorrido';
        return `${diasDecorridos} dias decorridos`;
    };

    return(
        <div className={styles.card_general}>
            <a 
                href={linkDrive || '#'} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.titleLinkWrapper}
                title={linkDrive ? "Clique para abrir o arquivo no Google Drive" : "Link não disponível"}
            >
                <div className={styles.title_container}>
                    <h2>{numeroNE}</h2>
                </div>
            </a>

            {numeroNC && (
                <div className={styles.ncBadgeOverride}>
                    {numeroNC}
                </div>
            )}

            <div className={styles.cardBody}>
                <div className={styles.infoLeft}>
                    <div className={styles.subInfoLeft}>
                        <label>FINALIDADE</label>
                        <p>{finalidade || 'Não definida'}</p>
                    </div>
                    <div className={styles.subInfoLeft} style={{ marginTop: '10px' }}>
                        <label>OM DE APLICAÇÃO</label>
                        <p>{omAplicacao || 'Não informado'}</p>
                    </div>
                    <div className={styles.subInfoLeft} style={{ marginTop: '10px' }}>
                        <label>PROCESSO</label>
                        <p>{processo || 'Não informado'}</p>
                    </div>
                </div>

                <div className={styles.infoRight}>
                    <div className={styles.subInfo}>
                        <label>MATERIAL (ITEM)</label>
                        <p>{material || 'Não informado'}</p>
                    </div>
                    <div className={styles.subInfo}>
                        <label>FORNECEDOR</label>
                        <p>{fornecedor || 'Não informado'}</p>
                    </div>
                </div>
            </div>

            {tempoCronologico && (
                <div className={styles.prazoBlock}>
                    <label>Tempo Cronológico</label>
                    <p style={{ color: '#2b6cb0', fontWeight: 'bold' }}>
                        {calcularDiasDesdeGeracao(tempoCronologico)}
                    </p>
                </div>
            )}

            <div className={styles.cardFooter}>
                <label>VALOR ATUAL DO EMPENHO</label>
                {carregandoSaldo ? (
                    <span className={styles.valueHighlight}>Carregando...</span>
                ) : (
                    <span className={styles.valueHighlight}>{valorFormatado}</span>
                )}
            </div>

            <div className={styles.project_card_actions}>
                <button type="button" onClick={onEdit}>
                    <BsPencil /> EDITAR
                </button>
                <button type="button" onClick={onDetail}>
                    <BsEye /> DETALHAR
                </button>
                <button type="button" onClick={onCancelar} className={styles.btn_cancelar}>
                    <BsXCircle /> CANCELAR N.E.
                </button>
            </div>
        </div>
    )
}

export default CreditsCard;