import { useState, useEffect } from 'react'
import styles from '../styles/styles_pages/Credits.module.css'
import ActionButton from '../form/ActionButton'
import Auction from './CreditsTabs/Auction'
import CreditsPanel from './CreditsTabs/CreditsPanel'
import NewCredit from './CreditsTabs/NewCredit'
import NewNE from './CreditsTabs/NewNE'
import Invoice from './CreditsTabs/Invoice'
import RPNP from './CreditsTabs/RPNP'
import NEDetail from './CreditsTabs/NEDetail'
import { useAuth } from '../context/AuthContext'  // ← ADICIONE ESTA LINHA

function Credits() {
    const { usuarioAtual } = useAuth();  // ← ADICIONE ESTA LINHA
    
    const [abaAtiva, setAbaAtiva] = useState(null)
    const [abaAnterior, setAbaAnterior] = useState(null)
    const [isNcModalOpen, setIsNcModalOpen] = useState(false)
    const [isNeModalOpen, setIsNeModalOpen] = useState(false)
    const [idNeDetalhada, setIdNeDetalhada] = useState(null)

    const abrirDetalhes = (id) => {
        setAbaAnterior(abaAtiva);
        setIdNeDetalhada(id);
        setAbaAtiva('detalhe_ne');
    };

    const voltarParaOrigem = () => {
        if (abaAnterior) {
            setAbaAtiva(abaAnterior);
        } else {
            setAbaAtiva('creditos160');
        }
        setAbaAnterior(null);
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

    const gerenciarTrocaAbaManual = (novaAba) => {
        setAbaAtiva(novaAba);
        setAbaAnterior(null);
    };

    // Função para obter a cor do nível do usuário
    const getNivelCor = (nivel) => {
        switch (nivel) {
            case 'DESCENTRALIZADORA': return '#1e295d';
            case 'INTERMEDIARIA': return '#2b6cb0';
            case 'REQUISITANTE': return '#38a169';
            default: return '#718096';
        }
    };

    return (
        <div className={styles.container}>
            {/* Badge de usuário logado - fixo no canto */}
            <div style={{
                position: 'fixed',
                bottom: '10px',
                right: '10px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                zIndex: 9999,
                fontFamily: 'monospace',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                backgroundColor: getNivelCor(usuarioAtual.nivel),
                color: 'white'
            }}>
                📋 {usuarioAtual.secao} - {usuarioAtual.nivel}
            </div>

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
                    <CreditsPanel 
                        fonteAlvo="160"
                        ugAlvo="160212"
                        onVerDetalhes={abrirDetalhes}
                    />
                )}
                
                {abaAtiva === 'creditos167' && (
                    <CreditsPanel 
                        fonteAlvo="167"
                        ugAlvo="167212"
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