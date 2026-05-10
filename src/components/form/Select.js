import styles from '../styles/styles_form/Select.module.css'

// Adicionado a prop 'layout'
function Select({text, name, options, handleOnChange, value, layout}){
    return(
        /* Se layout for 'row', aplica as duas classes, senão apenas form_control */
        <div className={`${styles.form_control} ${layout === 'row' ? styles.form_row : ''}`}>
            <label htmlFor={name}>{text}</label>
            <select
                name={name} 
                id={name} 
                onChange={handleOnChange}
                value={value || ''}
            >
                <option value="">Selecione uma opção</option>
                {options.map((option) => (
                    <option value={option.id} key={option.id}>
                        {option.name}
                    </option>
                ))}
            </select>
        </div>
    )
}

export default Select
