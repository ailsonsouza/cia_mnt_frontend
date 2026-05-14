import styles from '../../styles/styles_pages/styles_creditsTabs/CreditisCard.module.css';
import { BsPencil, BsEye, BsFillTrashFill } from 'react-icons/bs';

function CreditsCard({ 
    numeroNE, 
    finalidade, 
    material, 
    om, 
    fornecedor, 
    processo, 
    valorAtual, 
    linkDrive, 
    numeroNC, 
    prazoEmpenho, 
    tempoCronologico, 
    onEdit, 
    onDetail, 
    onDelete 
}){
    // Formata o valor principal para o padrão de moeda brasileiro BRL
    const valorFormatado = typeof valorAtual === 'number'
        ? valorAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : valorAtual;

    // LÓGICA DE ALERTA VISUAL: Identifica se o prazo exige layout vermelho de urgência (Exclusivo de NC)
    const verificarUrgenciaNC = () => {
        if (tempoCronologico) return false; // Se for uma NE com tempo cronológico, ignora a urgência de prazo
        if (!prazoEmpenho) return false;
        if (prazoEmpenho.toUpperCase() === 'EMPENHO IMEDIATO') return true;

        const dataPrazo = new Date(prazoEmpenho);
        const dataAtual = new Date();
        
        // Zera as frações de hora para comparação precisa de dias inteiros
        dataPrazo.setHours(0, 0, 0, 0);
        dataAtual.setHours(0, 0, 0, 0);

        const diferencaEmMilissegundos = dataPrazo - dataAtual;
        const diferencaEmDias = Math.ceil(diferencaEmMilissegundos / (1000 * 60 * 60 * 24));

        // Ativa se faltarem menos de 6 dias para expirar o prazo
        return diferencaEmDias < 6;
    };

    // LÓGICA DE CÁLCULO CRONOLÓGICO: Calcula os dias decorridos desde a emissão (Exclusivo de NE)
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

    const isUrgente = verificarUrgenciaNC();
    
    // Injeta de forma reativa a classe vermelha de urgência no container do cartão
    const classeContainer = isUrgente 
        ? `${styles.card_general} ${styles.card_urgente}` 
        : styles.card_general;

    // Converte a string de data ISO (AAAA-MM-DD) do input para o formato nacional (DD/MM/AAAA)
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
        <div className={classeContainer}>
            {/* O Cabeçalho funciona como um link clicável seguro para o Drive */}
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

            {/* Se o card for de uma NE, exibe a identificação da NC Origem logo abaixo do título */}
            {numeroNC && (
                <div className={styles.ncBadgeOverride}>
                    {numeroNC}
                </div>
            )}

            {/* Corpo estruturado em duas colunas (Esquerda: Processos | Direita: Informações Técnicas) */}
            <div className={styles.cardBody}>
                {/* Lado Esquerdo: Metadados Administrativos */}
                <div className={styles.infoLeft}>
                    <div className={styles.subInfoLeft}>
                        <label>Nº do Processo</label>
                        <p>{processo || 'Não informado'}</p>
                    </div>
                    <div className={styles.subInfoLeft} style={{ marginTop: '10px' }}>
                        <label>Finalidade</label>
                        <p>{finalidade || 'Não definida'}</p>
                    </div>
                </div>

                {/* Lado Direito: Informações sobre os itens e fornecedores */}
                <div className={styles.infoRight}>
                    <div className={styles.subInfo}>
                        <label>Material da NE (Item)</label>
                        <p>{material}</p>
                    </div>
                    <div className={styles.subInfo}>
                        <label>OM</label>
                        <p>{om}</p>
                    </div>
                    <div className={styles.subInfo}>
                        <label>Fornecedor</label>
                        <p>{fornecedor}</p>
                    </div>
                </div>
            </div>

            {/* AJUSTADO: Seção Inferior Dinâmica protegida por renderização condicional estrita */}
            {(tempoCronologico || prazoEmpenho) && (
                <div className={styles.prazoBlock}>
                    {tempoCronologico ? (
                        <>
                            <label>Tempo Cronológico</label>
                            <p style={{ color: '#2b6cb0', fontWeight: 'bold' }}>
                                {calcularDiasDesdeGeracao(tempoCronologico)}
                            </p>
                        </>
                    ) : (
                        <>
                            <label>Prazo Limite para Empenho</label>
                            <p className={isUrgente ? styles.prazoTextoUrgente : ''}>
                                {formatarPrazoExibicao(prazoEmpenho)}
                            </p>
                        </>
                    )}
                </div>
            )}

            {/* Divisória de valor intermediária */}
            <div className={styles.cardFooter}>
                <label>VALOR ATUAL</label>
                <span className={styles.valueHighlight}>{valorFormatado}</span>
            </div>

            {/* Painel de ações integrado na base do card */}
            <div className={styles.project_card_actions}>
                <button type="button" onClick={onEdit}>
                    <BsPencil /> EDITAR
                </button>
                <button type="button" onClick={onDetail}>
                    <BsEye /> DETALHAR
                </button>
                <button type="button" onClick={onDelete} className={styles.btn_excluir}>
                    <BsFillTrashFill /> EXCLUIR
                </button>
            </div>
        </div>
    )
}

export default CreditsCard;
