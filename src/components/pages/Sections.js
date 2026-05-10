import Container from '../layout/Container'
import CardSections from '../layout/CardSections'
import { useEffect, useState } from 'react'
import styles from '../styles/styles_pages/Sections.module.css'
import { Link } from "react-router-dom"

function Sections(){

    const [sections, setSections] = useState([])

    useEffect(() => {
        fetch('http://localhost:5000/sections', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        })
        .then(resp => resp.json())
        .then(data => setSections(data))
        .catch(err => console.log(err))
    }, [])

    // --- NOVA FUNÇÃO DE DELEÇÃO (MÉTODO DELETE) ---
    function removeSection(id) {
        // Encontra o card no DOM para injetar a classe de sumiço visual antes de remover do estado
        const cardElement = document.getElementById(`section-card-${id}`);
        if (cardElement) {
            cardElement.style.opacity = '0';
            cardElement.style.transform = 'scale(0.8)';
        }

        // Aguarda 400ms (tempo da animação CSS) para deletar do banco e do array de estado
        setTimeout(() => {
            fetch(`http://localhost:5000/sections/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            .then(resp => {
                if (!resp.ok) throw new Error("Erro ao deletar no servidor.");
                // Atualiza o estado removendo a seção deletada
                setSections(sections.filter((section) => section.id !== id));
            })
            .catch(err => {
                console.log(err);
                // Caso dê erro no servidor, desfaz o efeito visual do card
                if (cardElement) {
                    cardElement.style.opacity = '1';
                    cardElement.style.transform = 'scale(1)';
                }
                alert("Não foi possível excluir a seção no banco de dados.");
            });
        }, 400);
    }

    return(
        <div className={styles.sections_page}>
            <h1>SEÇÕES</h1>
            
            <Container customClass="column"> 
                <div className={styles.button_container}>
                    <Link to="/sectiondetails" state={{ action: 'NEWSECTION' }} className={styles.newSection}>
                        NOVA SEÇÃO
                    </Link>
                </div>

                <div className={styles.grid_container}>
                    {sections.length > 0 ? (
                        sections.map((section) => (
                            <CardSections 
                                section={section} 
                                key={section.id} 
                                handleRemove={removeSection} /* Injeta a função criada no card */
                            />
                        ))
                    ) : (
                        <p>Nenhuma seção cadastrada.</p>
                    )}
                </div>
            </Container>
        </div>
    )
}

export default Sections
