import { useState, useEffect } from 'react'
import { FcAddDatabase } from 'react-icons/fc';
import { useParams, useNavigate } from 'react-router-dom'
import styles from '../styles/styles_pages/Credits.module.css'
import Auction from './CreditsTabs/Auction'
import CreditsPanel from './CreditsTabs/CreditsPanel'
import NewCredit from './CreditsTabs/NewCredit'
import NewNE from './CreditsTabs/NewNE'
import Invoice from './CreditsTabs/Invoice'
import RPNP from './CreditsTabs/RPNP'
import RPNPModal from './CreditsTabs/modais/RPNPModal'  // ← NOVO IMPORT
import NEDetail from './CreditsTabs/NEDetail'
import NCDetail from './CreditsTabs/NCDetail'
import Relatorio from './CreditsTabs/Relatorio'
import { useAuth } from '../context/AuthContext'

function Credits() {
    const { usuarioAtual } = useAuth();
    const { aba } = useParams();
    const navigate = useNavigate();

    const [abaAtiva, setAbaAtiva] = useState(() => {
        if (aba && ['pregao', 'rpnp', 'ano_atual', 'relatorio', 'nota_fiscal'].includes(aba)) {
            return aba;
        }
        const savedAba = sessionStorage.getItem('abaAtiva');
        return savedAba || 'ano_atual';
    });
    
    const [abaAnterior, setAbaAnterior] = useState(null)
    const [isNcModalOpen, setIsNcModalOpen] = useState(false)
    const [isNeModalOpen, setIsNeModalOpen] = useState(false)
    const [isNfModalOpen, setIsNfModalOpen] = useState(false)
    const [isRPNPModalOpen, setIsRPNPModalOpen] = useState(false)  // ← NOVO ESTADO
    const [creditoParaEmpenhar, setCreditoParaEmpenhar] = useState(null)
    const [idNeDetalhada, setIdNeDetalhada] = useState(null)
    const [idNCDetalhada, setIdNCDetalhada] = useState(null)
    const [isNCDetailOpen, setIsNCDetailOpen] = useState(false)
    
    const [ugSelecionada, setUgSelecionada] = useState(() => {
        const savedUg = sessionStorage.getItem('ugSelecionada');
        return savedUg === '160' || savedUg === '167' ? savedUg : '160';
    });

    const [rpnpUgSelecionada, setRpnpUgSelecionada] = useState(() => {
        const savedRpnpUg = sessionStorage.getItem('rpnpUgSelecionada');
        return savedRpnpUg === '160' || savedRpnpUg === '167' ? savedRpnpUg : '160';
    });

    // Sincroniza a URL com a aba ativa
    useEffect(() => {
        if (abaAtiva && !['detalhe_ne', 'detalhe_nc'].includes(abaAtiva)) {
            navigate(`/credits/${abaAtiva}`, { replace: true });
        }
        sessionStorage.setItem('abaAtiva', abaAtiva);
    }, [abaAtiva, navigate]);

    // Sincroniza a aba da URL com o estado quando a URL muda
    useEffect(() => {
        if (aba && ['pregao', 'rpnp', 'ano_atual', 'relatorio', 'nota_fiscal'].includes(aba)) {
            if (aba !== abaAtiva) {
                setAbaAtiva(aba);
            }
        }
    }, [aba]);

    useEffect(() => {
        sessionStorage.setItem('ugSelecionada', ugSelecionada);
    }, [ugSelecionada]);

    useEffect(() => {
        sessionStorage.setItem('rpnpUgSelecionada', rpnpUgSelecionada);
    }, [rpnpUgSelecionada]);

    const abrirDetalhes = (id) => {
        setAbaAnterior(abaAtiva);
        setIdNeDetalhada(id);
        setAbaAtiva('detalhe_ne');
    };

    const abrirDetalhesNC = (id) => {
        setAbaAnterior(abaAtiva);
        setIdNCDetalhada(id);
        setAbaAtiva('detalhe_nc');
    };

    const voltarParaOrigem = () => {
        if (abaAnterior) {
            setAbaAtiva(abaAnterior);
        } else {
            setAbaAtiva('ano_atual');
        }
        setAbaAnterior(null);
        setIsNCDetailOpen(false);
        setIdNCDetalhada(null);
    };

    const forcarAtualizacaoAba = () => {
        const abaAtual = abaAtiva;
        if (abaAtual) {
            setAbaAtiva(null);
            setTimeout(() => setAbaAtiva(abaAtual), 10);
        }
    };

    const obterTitulo = () => {
        switch (abaAtiva) {
            case 'pregao': return 'PREGÃO';
            case 'rpnp': return `RPNP`;
            case 'ano_atual': return `GESTÃO ORÇAMENTÁRIA`;
            case 'relatorio': return 'RELATÓRIO GERAL';
            case 'nota_fiscal': return 'NOTAS FISCAIS';
            case 'detalhe_ne': return 'DETALHAMENTO DA N.E.';
            case 'detalhe_nc': return 'DETALHAMENTO DA N.C.';
            default: return 'CRÉDITOS';
        }
    };

    const gerenciarTrocaAba = (novaAba) => {
        setAbaAtiva(novaAba);
        setAbaAnterior(null);
    };

    const handleAbrirNeModal = () => {
        setCreditoParaEmpenhar(null);
        setIsNeModalOpen(true);
    };

    const handleFecharNeModal = () => {
        setIsNeModalOpen(false);
        setCreditoParaEmpenhar(null);
        forcarAtualizacaoAba();
    };

    const handleFecharNcModal = () => {
        setIsNcModalOpen(false);
        forcarAtualizacaoAba();
    };

    const handleAbrirNfModal = () => {
        setIsNfModalOpen(true);
    };

    const handleFecharNfModal = () => {
        setIsNfModalOpen(false);
        forcarAtualizacaoAba();
    };

    // NOVAS FUNÇÕES PARA RPNP MODAL
    const handleAbrirRPNPModal = () => {
        setIsRPNPModalOpen(true);
    };

    const handleFecharRPNPModal = () => {
        setIsRPNPModalOpen(false);
        forcarAtualizacaoAba();
    };

    const handleUgChange = (novaUg) => {
        if (novaUg !== ugSelecionada) {
            setUgSelecionada(novaUg);
        }
    };

    const handleRpnpUgChange = (novaUg) => {
        if (novaUg !== rpnpUgSelecionada) {
            setRpnpUgSelecionada(novaUg);
        }
    };

    const renderContent = () => {
        switch (abaAtiva) {
            case 'pregao':
                return <Auction />;
            case 'rpnp':
                return (
                    <RPNP
                        key={`rpnp-${rpnpUgSelecionada}`}
                        fonteRecurso={rpnpUgSelecionada}
                        onVerDetalhes={abrirDetalhes}
                        onUgChange={handleRpnpUgChange}
                        ugSelecionada={rpnpUgSelecionada}
                    />
                );
            case 'ano_atual':
                return (
                    <CreditsPanel
                        key={`credits-panel-${ugSelecionada}`}
                        fonteAlvo={ugSelecionada}
                        ugAlvo={ugSelecionada === '160' ? '160212' : '167212'}
                        onVerDetalhes={abrirDetalhes}
                        onVerDetalhesNC={abrirDetalhesNC}
                        onUgChange={handleUgChange}
                    />
                );
            case 'relatorio':
                return (
                    <Relatorio 
                        onVerDetalhesNC={abrirDetalhesNC}
                        onVerDetalhesNE={abrirDetalhes}
                    />
                );
            case 'nota_fiscal':
                return (
                    <Invoice 
                        onVerDetalhesNE={abrirDetalhes}  // ← ADICIONAR ESTA LINHA
                    />
                );
            case 'detalhe_ne':
                return (
                    <NEDetail
                        idNe={idNeDetalhada}
                        onVoltar={voltarParaOrigem}
                        onVerDetalhesNC={abrirDetalhesNC}
                    />
                );
            case 'detalhe_nc':
                return (
                    <NCDetail
                        idNc={idNCDetalhada}
                        onVoltar={voltarParaOrigem}
                        onVerDetalhesNE={abrirDetalhes}
                    />
                );
            default:
                return <CreditsPanel
                    key={`credits-panel-${ugSelecionada}`}
                    fonteAlvo={ugSelecionada}
                    ugAlvo={ugSelecionada === '160' ? '160212' : '167212'}
                    onVerDetalhes={abrirDetalhes}
                    onVerDetalhesNC={abrirDetalhesNC}
                    onUgChange={handleUgChange}
                />;
        }
    };

    return (
        <div className={styles.creditsContainer}>
            <div className={styles.titleBarOriginal}>
                <h1 className={styles.pageTitleOriginal}>{obterTitulo()}</h1>
                <div className={styles.actionIconsOriginal}>
                    <button 
                        className={styles.iconBtnOriginal} 
                        onClick={() => setIsNcModalOpen(true)}
                        title="Nova Nota de Crédito"
                    >
                        ➕
                    </button>
                    <button 
                        className={styles.iconBtnOriginal} 
                        onClick={handleAbrirNeModal}
                        title="Nova Nota de Empenho"
                    >
                        📝
                    </button>
                    {/* NOVO BOTÃO RPNP - só aparece quando a aba RPNP estiver ativa */}
                    {abaAtiva === 'rpnp' && (
                        <button 
                            className={styles.iconBtnOriginal} 
                            onClick={handleAbrirRPNPModal}
                            title="Nova RPNP"
                        >
                            <FcAddDatabase />
                        </button>
                    )}
                    <button 
                        className={styles.iconBtnOriginal} 
                        onClick={handleAbrirNfModal}
                        title="Nova Nota Fiscal"
                    >
                        🧾
                    </button>
                </div>
            </div>

            <div className={styles.contentAreaOriginal}>
                {renderContent()}
            </div>

            {isNcModalOpen && (
                <NewCredit
                    onClose={handleFecharNcModal}
                    onSuccess={forcarAtualizacaoAba}
                />
            )}

            {isNeModalOpen && (
                <NewNE
                    onClose={handleFecharNeModal}
                    onSuccess={handleFecharNeModal}
                    creditoParaEmpenhar={creditoParaEmpenhar}
                />
            )}

            {/* NOVO MODAL RPNP */}
            {isRPNPModalOpen && (
                <RPNPModal
                    isOpen={isRPNPModalOpen}
                    onClose={handleFecharRPNPModal}
                    onSuccess={handleFecharRPNPModal}
                    modo="incluir"
                    dadosIniciais={null}
                    fonteRecurso={rpnpUgSelecionada}
                />
            )}

            {isNfModalOpen && (
                <Invoice 
                    onClose={handleFecharNfModal}
                    onSuccess={handleFecharNfModal}
                />
            )}
        </div>
    )
}

export default Credits;