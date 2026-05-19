import styles from '../../styles/styles_layout/CreditsCardNC.module.css';

function CreditsCardNCDisabled({ 
    numeroNC,     // ← RECEBE O NÚMERO DA NC (ex: 2026NC000009)
    valor, 
    prazoEmpenho, 
    finalidade, 
    detentor,
    linkDrive
}){
    const valorFormatado = typeof valor === 'number'
        ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : valor;

    const formatarPrazoExibicao = (prazo) => {
        if (!prazo) return 'Não informado';
        if (prazo.toUpperCase() === 'EMPENHO IMEDIATO') return prazo.toUpperCase();
        const partes = prazo.split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return prazo;
    };

    return(
        <div className={`${styles.card_general} ${styles.card_disabled}`}>
            <div className={styles.title_container}>
                <h2>{numeroNC}</h2>  {/* ← MOSTRA O NÚMERO DA NC */}
            </div>

            <div className={styles.cardBody}>
                <div className={styles.infoLeft}>
                    <div className={styles.subInfoLeft}>
                        <label>VALOR</label>
                        <p className={styles.valorDestaque}>{valorFormatado}</p>
                    </div>
                    <div className={styles.subInfoLeft} style={{ marginTop: '10px' }}>
                        <label>DETENTOR</label>
                        <p>{detentor || 'Não informado'}</p>
                    </div>
                </div>

                <div className={styles.infoRight}>
                    <div className={styles.subInfo}>
                        <label>FINALIDADE</label>
                        <p>{finalidade || 'Não definida'}</p>
                    </div>
                </div>
            </div>

            {prazoEmpenho && (
                <div className={styles.prazoBlock}>
                    <label>Prazo Limite para Empenho</label>
                    <p>{formatarPrazoExibicao(prazoEmpenho)}</p>
                </div>
            )}

            <div className={styles.project_card_actions}>
                <div className={styles.disabledMessage}>
                    ⏳ Aguardando confirmação de recebimento
                </div>
            </div>
        </div>
    )
}

export default CreditsCardNCDisabled;