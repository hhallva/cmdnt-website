import React from 'react';
import { Link } from 'react-router-dom';
import styles from './NotFound.module.css'; // Создадим файл стилей

const NotFoundLayout: React.FC = () => {
    return (
        <div className={styles.notFoundContainer}>
            <div className={styles.notFoundContent}>
                <h1 className={styles.errorCode}>404</h1>
                <p className={styles.errorMessage}>Страница не найдена</p>
                <p className={styles.errorDescription}>
                    Извините, страница, которую вы ищете, не существует.
                </p>
                <Link to="/dashboard" className={styles.homeLink}>
                    Вернуться на главную
                </Link>
            </div>
        </div>
    );
};

export default NotFoundLayout;