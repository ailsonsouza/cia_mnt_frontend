import styles from '../styles/styles_form/ActionButton.module.css'

function ActionButton({ text, handleOnClick  }) {
    return (
        <div>
            <button className={styles.btn} onClick={handleOnClick} >
                {text}
            </button>
        </div>
    )
}

export default ActionButton
