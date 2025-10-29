// src/components/CommonTable/CommonTable.tsx
import React, { type ReactNode } from 'react';
import styles from './CommonTable.module.css'; // Создадим стили позже

// Тип для определения колонки
// `key` - ключ в объекте данных (например, 'name', 'group.name')
// `title` - заголовок колонки
// `render` - (опционально) функция для кастомного рендеринга ячейки
interface ColumnDefinition<T> {
    key: keyof T | string; // keyof T для прямых ключей, string для вложенных (например, 'group.name')
    title: ReactNode;
    render?: (item: T) => React.ReactNode; // item - объект из массива данных
    className?: string; // Дополнительный класс для ячейки этой колонки
}

// Тип для определения действия
// `render` - функция, возвращающая ReactNode (например, кнопку) для каждой строки
interface ActionDefinition<T> {
    render: (item: T) => React.ReactNode;
}

// Пропсы для компонента таблицы
interface CommonTableProps<T> {
    title?: string; // Заголовок таблицы (опционально)
    data: T[]; // Массив данных для отображения
    totalCount?: number; // Общее количество записей (опционально)
    columns: ColumnDefinition<T>[]; // Определение колонок
    actions?: ActionDefinition<T>[]; // Определение действий (опционально)
    emptyMessage?: string; // Сообщение, если данных нет (по умолчанию "Данные не найдены")
    className?: string; // Дополнительный класс для всей таблицы
}

// Универсальный компонент таблицы
const CommonTable = <T extends Record<string, any>>({
    title,
    data,
    totalCount,
    columns,
    actions,
    emptyMessage = 'Данные не найдены',
    className = '',
}: CommonTableProps<T>) => {

    // --- Вспомогательная функция для получения значения по ключу, включая вложенные ключи ---
    const getValueByPath = (obj: T, path: string | keyof T): any => {
        // Если path является keyof T (например, 'name'), возвращаем obj[path] напрямую
        if (typeof path === 'string' && path in obj) {
            return obj[path as keyof T];
        }
        // Если path - строка с точками (например, 'group.name'), разбиваем и углубляемся
        if (typeof path === 'string') {
            return path.split('.').reduce((acc, part) => acc && acc[part], obj as any);
        }
        // Для простых ключей keyof T
        return obj[path];
    };

    return (
        <div className={`${styles.tableWrapper} ${className}`}>
            {(title || (totalCount !== undefined && data.length > 0)) && (
                <div className={styles.tableHeader}>
                    {title && <h3 className={styles.tableTitle}>{title}</h3>}
                    {totalCount !== undefined && data.length > 0 && (
                        <div className={styles.recordCount}>
                            Показано {data.length} из {totalCount}
                        </div>
                    )}
                </div>
            )}
            <div className={styles.tableResponsive}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            {/* Рендерим заголовки колонок */}
                            {columns.map((column, index) => (
                                <th key={index} className={column.className}>{column.title}</th>
                            ))}
                            {/* Если есть действия, добавляем колонку для них */}
                            {actions && actions.length > 0 && <th>Действия</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? (
                            data.map((item, rowIndex) => (
                                <tr key={rowIndex}>
                                    {columns.map((column, colIndex) => (
                                        <td key={colIndex} className={column.className}>
                                            {column.render ? column.render(item) :
                                                getValueByPath(item, column.key) ?? 'Нет'}
                                        </td>
                                    ))}
                                    {actions && actions.length > 0 && (
                                        <td>
                                            <div className={styles.actionButtons}>
                                                {actions.map((action, actionIndex) => (
                                                    <React.Fragment key={actionIndex}>
                                                        {action.render(item)}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center">
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CommonTable;