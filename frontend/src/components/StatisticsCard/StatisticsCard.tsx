import React from 'react';
import styles from './StatisticsCard.module.css';

interface StatItem {
    value: number | string; // Значение может быть числом или строкой (например, "Нет данных")
    label: string;         // Название статистики (например, "Всего пользователей")
    color?: string;        // (Опционально) Цвет числа, можно использовать для выделения
}

interface StatisticsCardProps {
    title?: string;        // (Опционально) Заголовок всей секции статистики
    stats: StatItem[];     // Массив объектов с данными для карточек
    gridColumns?: string;  // (Опционально) CSS-значение для grid-template-columns, например 'repeat(auto-fit, minmax(200px, 1fr))'
}

const StatisticsCard: React.FC<StatisticsCardProps> = ({ title, stats, gridColumns = 'repeat(auto-fit, minmax(200px, 1fr))' }) => {
    return (
        <div className={styles.statisticsCardContainer}>
            {title && <h2 className={styles.title}>{title}</h2>}
            <div className={styles.statsGrid} style={{ gridTemplateColumns: gridColumns }}>
                {stats.map((stat, index) => (
                    <div key={index} className={styles.statCard}>
                        <div className={styles.statNumber} style={{ color: stat.color }}>
                            {stat.value}
                        </div>
                        <div className={styles.statLabel}>
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StatisticsCard;