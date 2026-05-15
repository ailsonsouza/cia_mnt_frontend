import { useState, useEffect } from 'react'
import styles from '../styles/styles_pages/Credits.module.css'
import ActionButton from '../form/ActionButton'
import Auction from './CreditsTabs/Auction'
import Creditis160 from './CreditsTabs/Creditis160'
import Credits167 from './CreditsTabs/Credits167'
import NewCredit from './CreditsTabs/NewCredit'
import NewNE from './CreditsTabs/NewNE'
import Invoice from './CreditsTabs/Invoice'
import RPNP from './CreditsTabs/RPNP'
import NEDetail from './CreditsTabs/NEDetail'

function Credits() {
    const [abaAtiva, setAbaAtiva] = useState(null)
    const [abaAnterior, setAbaAnterior] = useState(null) // Armazena a aba de origem
    const [isNcModalOpen, setIsNcModalOpen] = useState(false)
    const [isNeModalOpen, setIsNeModalOpen] = useState(false)
    const [idNeDetalhada, setIdNeDetalhada] = useState(null)

    // Função para mudar para a "aba" de detalhamento salvando a origem
    const abrirDetalhes = (id) => {
        setAbaAnterior(abaAtiva); // Salva a aba atual antes de mudar
        setIdNeDetalhada(id);
        setAbaAtiva('detalhe_ne');
    };

    // Função para retornar à aba correta
    const voltarParaOrigem = () => {
        if (abaAnterior) {
            setAbaAtiva(abaAnterior);
        } else {
            setAbaAtiva('creditos160'); // Fallback caso não haja memória
        }
        setAbaAnterior(null); // Limpa a memória após voltar
    };

    const forcarAtualizacaoAba = () => {
        const abaAtual = abaAtiva;
        if (abaAtual) {
            setAbaAtiva(null);
            setTimeout(() => setAbaAtiva(abaAtual), 10);
        }
    };

    const obterTituloDinamicamente = () => {
        switch (abaAtiva) {
            case 'pregao': return 'PREGÃO';
            case 'rpnp160': return 'RELAÇÃO DE ITENS RPNP - 160212';
            case 'rpnp167': return 'RELAÇÃO DE ITENS RPNP - 167212';
            case 'creditos160': return 'GESTÃO ORÇAMENTÁRIA - 160212';
            case 'creditos167': return 'GESTÃO ORÇAMENTÁRIA - 167212';
            case 'nota_fiscal': return 'CONTROLE DE NOTAS FISCAIS';
            case 'detalhe_ne': return 'DETALHAMENTO TÉCNICO';
            default: return 'CRÉDITOS';
        }
    };

    // Função para limpar a memória de navegação ao clicar nos botões principais do menu
    const gerenciarTrocaAbaManual = (novaAba) => {
        setAbaAtiva(novaAba);
        setAbaAnterior(null);
    };

    return (
        <div className={styles.container}>
            <div className={styles.menuGrid}>
                <ActionButton text="PREGÃO" handleOnClick={() => gerenciarTrocaAbaManual('pregao')} />
                <ActionButton text="RPNP 160" handleOnClick={() => gerenciarTrocaAbaManual('rpnp160')} />
                <ActionButton text="RPNP 167" handleOnClick={() => gerenciarTrocaAbaManual('rpnp167')} />
                <ActionButton text="CRÉDITOS 160" handleOnClick={() => gerenciarTrocaAbaManual('creditos160')} />
                <ActionButton text="CRÉDITOS 167" handleOnClick={() => gerenciarTrocaAbaManual('creditos167')} />
                <ActionButton text="NOVA N.C." handleOnClick={() => setIsNcModalOpen(true)} />
                <ActionButton text="NOVA N.E." handleOnClick={() => setIsNeModalOpen(true)} />
                <ActionButton text="NOTA FISCAL" handleOnClick={() => gerenciarTrocaAbaManual('nota_fiscal')} />
            </div>

            <h1>{obterTituloDinamicamente()}</h1>

            <div className={styles.contentArea}>
                {abaAtiva === 'pregao' && <Auction />}
                
                {abaAtiva === 'rpnp160' && (
                    <RPNP 
                        fonteRecurso="160" 
                        onVerDetalhes={abrirDetalhes} 
                    />
                )}
                
                {abaAtiva === 'rpnp167' && (
                    <RPNP 
                        fonteRecurso="167" 
                        onVerDetalhes={abrirDetalhes} 
                    />
                )}
                
                {abaAtiva === 'creditos160' && (
                    <Creditis160 
                        onVerDetalhes={abrirDetalhes} 
                    />
                )}
                
                {abaAtiva === 'creditos167' && (
                    <Credits167 
                        onVerDetalhes={abrirDetalhes} 
                    />
                )}
                
                {abaAtiva === 'nota_fiscal' && <Invoice />}
                
                {abaAtiva === 'detalhe_ne' && (
                    <NEDetail 
                        idNe={idNeDetalhada} 
                        onVoltar={voltarParaOrigem} 
                    />
                )}
            </div>

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

export default Credits;