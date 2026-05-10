import styles from '../styles/styles_form/InputNewTechnicians.module.css'

function InputNewTechnicians({icon, type, name, placeholder, handleOnChange, value}){
    return(
        <div className={styles.input_group}>
            <span className={styles.icon}>
                {icon}
            </span>

            <input 
                type={type}
                name={name}
                id={name}
                className={styles.input_field}
                placeholder={placeholder}
                onChange={handleOnChange}
                value={value} 
            />
        </div>
    )


}

export default InputNewTechnicians