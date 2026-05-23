import styles from '../../styles/styles_layout/CreditsCardNC.module.css';
import { BsPencil, BsEye, BsFillTrashFill, BsArrowLeftRight, BsCashStack, BsArrowReturnLeft } from 'react-icons/bs';

function CreditsCardNC({ 
    numeroNC, 
    valor, 
    prazoEmpenho, 
    finalidade, 
    detentor,
    linkDrive,
    podeExcluir = true,  // ← Indica se o usuário pode excluir
    onEdit, 
    onDetail, 
    onDelete,
    onTransferir,
    onEmpenhar,
    onReceber,
    onDevolver,  // ← NOVO: função para devolver
    mostrarBotaoReceber = false
}){
    // Formata o valor principal para o padrão de moeda brasileiro BRL
    const valorFormatado = typeof valor === 'number'
        ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : valor;

    // LÓGICA DE ALERTA VISUAL: Identifica se o prazo exige layout vermelho de urgência
    const verificarUrgenciaNC = () => {
        if (!prazoEmpenho) return false;
        if (prazoEmpenho.toUpperCase() === 'EMPENHO IMEDIATO') return true;

        const dataPrazo = new Date(prazoEmpenho);
        const dataAtual = new Date();
        
        dataPrazo.setHours(0, 0, 0, 0);
        dataAtual.setHours(0, 0, 0, 0);

        const diferencaEmMilissegundos = dataPrazo - dataAtual;
        const diferencaEmDias = Math.ceil(diferencaEmMilissegundos / (1000 * 60 * 60 * 24));

        return diferencaEmDias < 6;
    };

    const formatarPrazoExibicao = (prazo) => {
        if (!prazo) return 'Não informado';
        if (prazo.toUpperCase() === 'EMPENHO IMEDIATO') return prazo.toUpperCase();
        
        const partes = prazo.split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return prazo;
    };

    const isUrgente = verificarUrgenciaNC();
    const classeContainer = isUrgente 
        ? `${styles.card_general} ${styles.card_urgente}` 
        : styles.card_general;

    return(
        <div className={classeContainer}>
            <a 
                href={linkDrive || '#'} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.titleLinkWrapper}
                title={linkDrive ? "Clique para abrir o arquivo no Google Drive" : "Link não disponível"}
            >
                <div className={styles.title_container}>
                    <h2>{numeroNC}</h2>
                </div>
            </a>

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

            {(prazoEmpenho) && (
                <div className={styles.prazoBlock}>
                    <label>Prazo Limite para Empenho</label>
                    <p className={isUrgente ? styles.prazoTextoUrgente : ''}>
                        {formatarPrazoExibicao(prazoEmpenho)}
                    </p>
                </div>
            )}

            <div className={styles.project_card_actions}>
                {mostrarBotaoReceber ? (
                    <button type="button" onClick={onReceber} className={styles.btnReceber}>
                        ✓ RECEBER
                    </button>
                ) : (
                    <>
                        <button type="button" onClick={onEdit}>
                            <BsPencil /> EDITAR
                        </button>
                        <button type="button" onClick={onDetail}>
                            <BsEye /> DETALHAR
                        </button>
                        <button type="button" onClick={onTransferir}>
                            <BsArrowLeftRight /> TRANSFERIR
                        </button>
                        <button type="button" onClick={onEmpenhar}>
                            <BsCashStack /> EMPENHAR
                        </button>
                        {/* Mostra DEVOLVER se existir a função, senão mostra EXCLUIR */}
                        {onDevolver ? (
                            <button type="button" onClick={onDevolver} className={styles.btn_devolver}>
                                <BsArrowReturnLeft /> DEVOLVER
                            </button>
                        ) : podeExcluir ? (
                            <button type="button" onClick={onDelete} className={styles.btn_excluir}>
                                <BsFillTrashFill /> EXCLUIR
                            </button>
                        ) : (
                            <button type="button" className={styles.btn_disabled} disabled>
                                <BsFillTrashFill /> EXCLUIR
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default CreditsCardNC;