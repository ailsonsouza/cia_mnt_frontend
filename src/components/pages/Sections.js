import Container from '../layout/Container'
import CardSections from '../layout/CardSections'
import { useEffect, useState } from 'react'
import styles from '../styles/styles_pages/Sections.module.css'
import { Link } from "react-router-dom"

function Sections(){
    const [sections, setSections] = useState([])
    const API_URL = 'http://localhost:8080/api/sections'

    useEffect(() => {
        fetch(API_URL)
            .then(resp => resp.json())
            .then(data => setSections(data))
            .catch(err => console.log("Erro ao buscar seções:", err))
    }, [])

    function removeSection(id) {
        const cardElement = document.getElementById(`section-card-${id}`);
        if (cardElement) {
            cardElement.style.opacity = '0';
            cardElement.style.transform = 'scale(0.8)';
        }

        setTimeout(() => {
            fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            })
            .then(resp => {
                if (!resp.ok) throw new Error("Erro ao deletar no servidor.");
                setSections(sections.filter((section) => section.id !== id));
            })
            .catch(err => {
                console.log(err);
                if (cardElement) {
                    cardElement.style.opacity = '1';
                    cardElement.style.transform = 'scale(1)';
                }
                alert("Não foi possível excluir a seção. Verifique dependências.");
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
                                handleRemove={removeSection} 
                            />
                        ))
                    ) : (
                        <p>Nenhuma seção cadastrada no sistema.</p>
                    )}
                </div>
            </Container>
        </div>
    )
}

export default Sections