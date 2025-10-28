import React, { useState } from 'react';

import Tabs from '../../../components/Tabs/Tabs';

import styles from './Students.module.css';

const StudentsLayout: React.FC = () => {


    const listTabContent = (
        <div className={styles.tabContent}>
            <h3>Список студентов</h3>
            <p>Здесь будет таблица со списком студентов.</p>
        </div>
    );

    const addTabContent = (
        <div className={styles.tabContent}>
            <h3>Добавить нового студента</h3>
            <p>Здесь будет форма для добавления нового студента.</p>
        </div>
    );

    const tabs = [
        {
            id: 'list',
            title: 'Список студентов',
            content: listTabContent,
        },
        {
            id: 'add',
            title: 'Добавить студента',
            content: addTabContent,
        },
    ];

    return (
        <>
            <Tabs tabs={tabs} defaultActiveTabId="list" />
        </>
    );
};

export default StudentsLayout;