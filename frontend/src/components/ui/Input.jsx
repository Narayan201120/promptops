import clsx from 'clsx';
import styles from './Input.module.css';

export default function Input({
    label,
    error,
    icon: Icon,
    className,
    ...props
}) {
    return (
        <div className={clsx(styles.wrapper, className)}>
            {label && <label className={styles.label}>{label}</label>}

            <div className={styles.inputContainer}>
                {Icon && <Icon size={18} className={styles.icon} />}
                <input
                    className={clsx(
                        styles.input,
                        error && styles.errorInput,
                        Icon && styles.hasIcon
                    )}
                    {...props}
                />
            </div>

            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
}
