import { useState } from 'react'
import styles from '../styles/styles_pages/Credits.module.css'
import ActionButton from '../form/ActionButton'
import Auction from './CreditsTabs/Auction'
import Creditis160 from './CreditsTabs/Creditis160'
import Credits167 from './CreditsTabs/Credits167'
import NewCredit from './CreditsTabs/NewCredit'
import NewNE from './CreditsTabs/NewNE'
import Invoice from './CreditsTabs/Invoice'
import RPNP from './CreditsTabs/RPNP'

function Credits() {
    const [abaAtiva, setAbaAtiva] = useState(null)
    const [isNcModalOpen, setIsNcModalOpen] = useState(false)
    const [isNeModalOpen, setIsNeModalOpen] = useState(false)

    const forcarAtualizacaoAba = () => {
        const abaAtual = abaAtiva;
        if (abaAtual) {
            setAbaAtiva(null);
            setTimeout(() => setAbaAtiva(abaAtual), 10);
        }
    };

    // LÓGICA DE TEXTO DINÂMICA: Determina o título baseado na chave do estado ativo
    const obterTituloDinamicamente = () => {
        switch (abaAtiva) {
            case 'pregao': return 'PREGÃO';
            case 'rpnp160': return 'RELAÇÃO DE ITENS RPNP - 160212';
            case 'rpnp167': return 'RELAÇÃO DE ITENS RPNP - 167212';
            case 'creditos160': return 'GESTÃO ORÇAMENTÁRIA - 160212';
            case 'creditos167': return 'GESTÃO ORÇAMENTÁRIA - 167212';
            case 'nota_fiscal': return 'CONTROLE DE NOTAS FISCAIS';
            default: return 'CRÉDITOS';
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.menuGrid}>
                <ActionButton text="PREGÃO" handleOnClick={() => setAbaAtiva('pregao')} />
                <ActionButton text="RPNP 160" handleOnClick={() => setAbaAtiva('rpnp160')} />
                <ActionButton text="RPNP 167" handleOnClick={() => setAbaAtiva('rpnp167')} />
                <ActionButton text="CRÉDITOS 160" handleOnClick={() => setAbaAtiva('creditos160')} />
                <ActionButton text="CRÉDITOS 167" handleOnClick={() => setAbaAtiva('creditos167')} />
                <ActionButton text="NOVA N.C." handleOnClick={() => setIsNcModalOpen(true)} />
                <ActionButton text="NOVA N.E." handleOnClick={() => setIsNeModalOpen(true)} />
                <ActionButton text="NOTA FISCAL" handleOnClick={() => setAbaAtiva('nota_fiscal')} />
            </div>

            {/* Título modificado para injetar o retorno da função em tempo real */}
            <h1>{obterTituloDinamicamente()}</h1>

            <div className={styles.contentArea}>
                {abaAtiva === 'pregao' && <Auction />}
                {abaAtiva === 'rpnp160' && <RPNP fonteRecurso="160" />}
                {abaAtiva === 'rpnp167' && <RPNP fonteRecurso="167" />}
                {abaAtiva === 'creditos160' && <Creditis160 />}
                {abaAtiva === 'creditos167' && <Credits167 />}
                {abaAtiva === 'nota_fiscal' && <Invoice />}
            </div>

            {/* Modais Globais */}
            {isNcModalOpen && (
                <NewCredit
                    onClose={() => setIsNcModalOpen(false)}
                    onSuccess={forcarAtualizacaoAba}
                />
            )}

            {isNeModalOpen && (
                <NewNE
                    onClose={() => setIsNeModalOpen(false)}
                    onSuccess={forcarAtualizacaoAba}
                />
            )}
        </div>
    )
}

export default Credits
