import { motion } from 'framer-motion';
import clsx from 'clsx';
import styles from './GlassCard.module.css';

export default function GlassCard({
    children,
    className,
    hoverable = false,
    variant = 'default', // default, solid, gradient
    ...props
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={clsx(
                styles.card,
                styles[`variant-${variant}`],
                hoverable && styles.hoverable,
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
}
