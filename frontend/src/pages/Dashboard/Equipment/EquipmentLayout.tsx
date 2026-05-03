import React from 'react';
import Tabs from '../../../components/Tabs/Tabs';
import styles from './Equipment.module.css';

const EquipmentLayout: React.FC = () => {
    const tabs = [
        {
            id: 'stationary',
            title: 'Стационарное',
            content: (
                <div className={styles.emptyState}>
                    <p className={styles.emptyTitle}>Стационарное оборудование</p>
                    <p className={styles.emptyText}>Раздел в разработке.</p>
                </div>
            ),
        },
        {
            id: 'consumables',
            title: 'Расходники',
            content: (
                <div className={styles.emptyState}>
                    <p className={styles.emptyTitle}>Расходные материалы</p>
                    <p className={styles.emptyText}>Раздел в разработке.</p>
                </div>
            ),
        },
    ];

    return (
        <section className={styles.container}>
            <Tabs tabs={tabs} defaultActiveTabId="stationary" />
        </section>
    );
};

export default EquipmentLayout;
