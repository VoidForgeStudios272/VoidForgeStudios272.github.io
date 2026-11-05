import { useState, useEffect } from 'react';
import styles from './Toast.module.css';

/**
 * Toast notification component that displays messages at the bottom-left of the screen
 * @param {string} message - The message to display
 * @param {string} type - The type of toast: 'info', 'warning', 'error', 'success'
 * @param {number} duration - How long to show the toast in ms (0 = indefinite)
 * @param {function} onClose - Callback when toast closes
 */
export function Toast({ message, type = 'info', duration = 4000, onClose }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (duration === 0) return; // Don't auto-close if duration is 0

        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onClose) onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!isVisible) return null;

    return (
        <div className={`${styles.toast} ${styles[type]} ${isVisible ? styles.visible : styles.hidden}`}>
            <div className={styles.content}>
                <span className={styles.icon}>
                    {type === 'warning' && '⚠️'}
                    {type === 'error' && '❌'}
                    {type === 'success' && '✅'}
                    {type === 'info' && 'ℹ️'}
                </span>
                <p className={styles.message}>{message}</p>
            </div>
            <button
                className={styles.closeBtn}
                onClick={() => {
                    setIsVisible(false);
                    if (onClose) onClose();
                }}
                aria-label="Close notification"
            >
                ✕
            </button>
        </div>
    );
}

/**
 * Toast container component that manages multiple toasts
 * Place this once in your App component
 */
export function ToastContainer() {
    const [toasts, setToasts] = useState([]);

    // Add this globally so other components can access it
    useEffect(() => {
        window.showToast = (message, type = 'info', duration = 4000) => {
            const id = Date.now();
            setToasts(prev => [...prev, { id, message, type, duration }]);
            return id;
        };

        return () => {
            delete window.showToast;
        };
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
        <div className={styles.container}>
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
}

