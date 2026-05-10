import styles from '../styles/styles_form/Input.module.css';

function Input({ type, text, name, placeholder, handleOnChange, value, layout }) {
  return (
    /* Se passar layout="row", ele usa as duas classes, senão usa só a padrão */
    <div className={`${styles.form_control} ${layout === 'row' ? styles.form_row : ''}`}>
      <label htmlFor={name}>{text}:</label>
      <input
        type={type}
        name={name}
        id={name}
        placeholder={placeholder}
        onChange={handleOnChange}
        value={value}
      />
    </div>
  );
}


export default Input;
