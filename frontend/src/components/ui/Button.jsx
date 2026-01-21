import clsx from 'clsx';
import { motion } from 'framer-motion';
import styles from './Button.module.css';

export default function Button({
    children,
    variant = 'primary', // primary, secondary, ghost, danger
    size = 'md', // sm, md, lg
    className,
    loading = false,
    disabled,
    icon: Icon,
    ...props
}) {
    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            className={clsx(
                styles.button,
                styles[variant],
                styles[size],
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <div className={styles.spinner} />
            ) : Icon ? (
                <Icon size={18} />
            ) : null}
            {children}
        </motion.button>
    );
}
