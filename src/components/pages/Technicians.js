import Container from '../layout/Container'
import CardTechnicians from '../layout/CardTechnicians'
import { useState, useEffect } from 'react'
import styles from '../styles/styles_pages/Technicians.module.css'
import { Link } from "react-router-dom"

function Technicians(){
    const [sections, setSections] = useState([])
    const [allTechnicians, setAllTechnicians] = useState([])
    const loggedUser = JSON.parse(localStorage.getItem('loggedUser')) || null;

    useEffect(() => {
        fetch('http://localhost:5000/sections').then(resp => resp.json()).then(data => setSections(data))
        fetch('http://localhost:5000/technicians').then(resp => resp.json()).then(data => setAllTechnicians(data))
    }, [])

    function removeTechnician(id) {
        const cardElement = document.getElementById(`technician-card-${id}`);
        if (cardElement) { cardElement.style.opacity = '0'; cardElement.style.transform = 'scale(0.8)'; }

        setTimeout(() => {
            fetch(`http://localhost:5000/technicians/${id}`, { method: 'DELETE' })
            .then(() => setAllTechnicians(allTechnicians.filter((tech) => tech.id !== id)))
        }, 400);
    }

    const isAdmin = loggedUser?.roleName === 'ADMIN';
    const isUser = loggedUser?.roleName === 'USER';

    const filteredTechnicians = isAdmin 
        ? allTechnicians 
        : allTechnicians.filter(tech => String(tech.section_id) === String(loggedUser?.section_id));

    return(
        <div className={styles.technicians_page}>
            <h1>TÉCNICOS</h1>
            
            <Container customClass="column">
                {!isUser && (
                    <div className={styles.containerBtn}>
                        <Link to="/techniciandetails" state={{ action: 'NEWTECHNICIAN' }} className={styles.newTechnician}>
                            NOVO TÉCNICO
                        </Link>
                    </div>
                )}

                <div className={styles.grid_container}>
                    {filteredTechnicians.length > 0 ? (
                        filteredTechnicians.map((oneTechnician) => {
                            const sectionData = sections.find(s => String(s.id) === String(oneTechnician.section_id));
                            return (
                                <CardTechnicians 
                                    key={oneTechnician.id}
                                    technician={oneTechnician}
                                    sectionName={sectionData?.name} 
                                    handleRemove={removeTechnician}
                                />
                            );
                        })
                    ) : (
                        <p>Nenhum técnico cadastrado para sua seção.</p>
                    )}
                </div>
            </Container>
        </div>
    )
}

export default Technicians;
