import styles from './Button.module.css';

export function Button({ onClick, children, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`${styles.button} ${className}`}
    >
      {children}
    </button>
  );
}

export default Button;
