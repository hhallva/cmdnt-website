// src/components/CommonTable/CommonTable.tsx
import React, { type ReactNode } from 'react';
import styles from './CommonTable.module.css'; // Создадим стили позже

// Тип для определения колонки
// `key` - ключ в объекте данных (например, 'name', 'group.name')
// `title` - заголовок колонки
// `render` - (опционально) функция для кастомного рендеринга ячейки
interface ColumnDefinition<T> {
    key: keyof T | string;
    title: ReactNode; // Может быть строкой или JSX
    sortable?: boolean; // Можно ли сортировать по этой колонке
    render?: (item: T) => ReactNode;
    className?: string;
}

// Тип для определения действия
// `render` - функция, возвращающая ReactNode (например, кнопку) для каждой строки
interface ActionDefinition<T> {
    render: (item: T) => React.ReactNode;
}

// Новый тип для конфигурации сортировки
interface SortConfig {
    key: string;
    direction: 'asc' | 'desc';
}


interface CommonTableProps<T> {
    title?: string;
    data: T[];
    columns: ColumnDefinition<T>[];
    actions?: ActionDefinition<T>[];
    emptyMessage?: string;
    className?: string;
    totalCount?: number;
    enableSorting?: boolean; // Включена ли сортировка в принципе
    onSortRequest?: (key: string) => void; // Callback для запроса сортировки
    sortConfig?: SortConfig | null; // Текущая конфигурация сортировки
}

// Универсальный компонент таблицы
const CommonTable = <T extends Record<string, any>>({
    title,
    data,
    columns,
    actions,
    emptyMessage = 'Данные не найдены',
    className = '',
    totalCount,
    // Новые пропсы
    enableSorting = false,
    onSortRequest,
    sortConfig,
}: CommonTableProps<T>) => {

    // --- Вспомогательная функция для получения значения по ключу ---
    const getValueByPath = (obj: T, path: string | keyof T): any => {
        if (typeof path === 'string' && path in obj) {
            return obj[path as keyof T];
        }
        if (typeof path === 'string') {
            return path.split('.').reduce((acc, part) => acc && acc[part], obj as any);
        }
        return obj[path];
    };

    // --- Рендер заголовка колонки с возможностью сортировки ---
    const renderColumnTitle = (column: ColumnDefinition<T>) => {
        // Если сортировка выключена или колонка не сортируемая, просто возвращаем title
        if (!enableSorting || !column.sortable) {
            return column.title;
        }

        return (
            <div
                onClick={() => onSortRequest && onSortRequest(column.key as string)}
                style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                }}
            >
                <span>{column.title}</span>
                <span style={{ opacity: sortConfig?.key === column.key ? 1 : 0.5, transition: 'opacity 0.2s ease' }}>
                    {sortConfig?.key === column.key ? (
                        sortConfig.direction === 'asc' ? (
                            <i className="bi bi-sort-alpha-down" style={{ color: '#0d6efd' }}></i>
                        ) : (
                            <i className="bi bi-sort-alpha-up" style={{ color: '#0d6efd' }}></i>
                        )
                    ) : (
                        <i className="bi bi-arrow-down-up"></i> // Иконка по умолчанию
                    )}
                </span>
            </div>
        );
    };

    return (
        <div className={`${styles.tableWrapper} ${className}`}>
            {/* Обновлённый заголовок с информацией о количестве записей */}
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
                            {/* Рендерим заголовки колонок с учетом сортировки */}
                            {columns.map((column, index) => (
                                <th key={index} className={column.className}>
                                    {renderColumnTitle(column)}
                                </th>
                            ))}
                            {actions && actions.length > 0 && <th>Действия</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? (
                            data.map((item, rowIndex) => (
                                <tr key={rowIndex}>
                                    {columns.map((column, colIndex) => (
                                        <td key={colIndex} className={column.className}>
                                            {column.render ? column.render(item) : (getValueByPath(item, column.key) ?? 'Нет')}
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