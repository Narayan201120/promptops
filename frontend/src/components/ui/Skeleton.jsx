import styles from './Skeleton.module.css';

export default function Skeleton({ className, width, height, style }) {
    return (
        <div
            className={`${styles.skeleton} ${className || ''}`}
            style={{
                width,
                height,
                ...style
            }}
        />
    );
}
