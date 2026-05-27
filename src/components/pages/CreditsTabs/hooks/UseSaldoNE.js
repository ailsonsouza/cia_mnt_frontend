// src/hooks/useSaldoNE.js
import { useState, useEffect } from 'react';

export const useSaldoNE = (neId, valorAtual) => {
    const [saldoAtual, setSaldoAtual] = useState(valorAtual || 0);
    const [carregando, setCarregando] = useState(true);
    const [totalLiquidado, setTotalLiquidado] = useState(0);
    const [totalEmLiquidacao, setTotalEmLiquidacao] = useState(0);

    useEffect(() => {
        if (!neId) {
            setCarregando(false);
            return;
        }

        const calcularSaldo = async () => {
            setCarregando(true);
            try {
                // Busca todas as NFs
                const response = await fetch('http://localhost:5000/credits_nf');
                const nfs = await response.json();
                
                // Filtra NFs do empenho específico
                const nfsDoEmpenho = nfs.filter(nf => nf.idNeVinculada === neId);
                
                // Calcula totais
                const liquidado = nfsDoEmpenho
                    .filter(nf => nf.status === 'LIQUIDADA')
                    .reduce((sum, nf) => sum + (parseFloat(nf.valor) || 0), 0);
                
                const emLiquidacao = nfsDoEmpenho
                    .filter(nf => nf.status === 'ENVIADA_LIQUIDACAO')
                    .reduce((sum, nf) => sum + (parseFloat(nf.valor) || 0), 0);
                
                setTotalLiquidado(liquidado);
                setTotalEmLiquidacao(emLiquidacao);
                
                const saldo = (parseFloat(valorAtual) || 0) - liquidado - emLiquidacao;
                setSaldoAtual(saldo);
            } catch (err) {
                console.error('Erro ao calcular saldo:', err);
                setSaldoAtual(parseFloat(valorAtual) || 0);
            } finally {
                setCarregando(false);
            }
        };

        calcularSaldo();
    }, [neId, valorAtual]);

    return { saldoAtual, carregando, totalLiquidado, totalEmLiquidacao };
};

export default useSaldoNE;