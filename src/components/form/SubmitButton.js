import style from '../styles/styles_form/SubmitButton.module.css'


function SubmitButton({text, handleOnClick}){
    return (
        <div>
            <button type='submit' className={style.btn} onClick={handleOnClick}>
                {text}
            </button>
        </div>
    )
}

export default SubmitButton