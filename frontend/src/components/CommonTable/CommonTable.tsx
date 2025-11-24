import React, { type ReactNode } from 'react';
import styles from './CommonTable.module.css';

interface ColumnDefinition<T> {
    key: keyof T | string;
    title: ReactNode;
    sortable?: boolean;
    render?: (item: T) => ReactNode;
    className?: string;
}

interface ActionDefinition<T> {
    render: (item: T) => React.ReactNode;
}

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
    enableSorting?: boolean;
    onSortRequest?: (key: string) => void;
    sortConfig?: SortConfig | null;
}

const CommonTable = <T extends Record<string, any>>({
    title,
    data,
    columns,
    actions,
    emptyMessage = 'Данные не найдены',
    className = '',
    totalCount,
    enableSorting = false,
    onSortRequest,
    sortConfig,
}: CommonTableProps<T>) => {
    // Универсальный резолвер значения по ключу или dot-path (group.name)
    const getValueByPath = (obj: T, path: string | keyof T) =>
        typeof path === 'string'
            ? path in obj
                ? (obj as T)[path]
                : path.split('.').reduce((acc, part) => acc?.[part], obj as any)
            : obj[path];

    // Возвращает заголовок колонки с иконкой сортировки при необходимости
    const renderColumnTitle = (column: ColumnDefinition<T>) => {
        if (!enableSorting || !column.sortable) return column.title;
        const isActive = sortConfig?.key === column.key;
        const icon = !isActive
            ? 'bi-arrow-down-up'
            : sortConfig?.direction === 'asc'
                ? 'bi-sort-alpha-down'
                : 'bi-sort-alpha-up';

        return (
            <div
                onClick={() => onSortRequest?.(column.key as string)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
            >
                <span>{column.title}</span>
                <i className={`bi ${icon}`} style={{ color: isActive ? '#0d6efd' : '#686868', opacity: isActive ? 1 : 0.5, transition: 'opacity 0.2s ease' }}></i>
            </div>
        );
    };

    // Флаг, нужно ли рисовать столбец действий
    const hasActions = Boolean(actions?.length);

    return (
        <div className={`${styles.tableWrapper} ${className}`}>
            {(title || (totalCount !== undefined && data.length)) && (
                <div className={styles.tableHeader}>
                    {/* Заголовок таблицы */}
                    {title && <h3 className={styles.tableTitle}>{title}</h3>}
                    {/* Информация о количестве записей */}
                    {totalCount !== undefined && data.length > 0 && (
                        <div className={styles.recordCount}>Показано {data.length} из {totalCount}</div>
                    )}
                </div>
            )}
            <div className={styles.tableResponsive}>
                <table className={styles.table}>
                    <thead>
                        {/*Шапка таблицы*/}
                        <tr>
                            {columns.map((column, index) => (
                                <th key={index} className={column.className}>{renderColumnTitle(column)}</th>
                            ))}
                            {hasActions && <th>Действия</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {/*Данные таблицы*/}
                        {data.length ? (
                            data.map((item, rowIndex) => (
                                <tr key={rowIndex}>
                                    {columns.map((column, colIndex) => (
                                        <td key={colIndex} className={column.className}>
                                            {column.render ? column.render(item) : getValueByPath(item, column.key) ?? 'Нет'}
                                        </td>
                                    ))}
                                    {hasActions && (
                                        <td>
                                            <div className={styles.actionButtons}>
                                                {actions!.map((action, actionIndex) => (
                                                    <React.Fragment key={actionIndex}>{action.render(item)}</React.Fragment>
                                                ))}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                {/*Plaseholder при отсутсвии данных*/}
                                <td colSpan={columns.length + (hasActions ? 1 : 0)} className="text-center">{emptyMessage}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CommonTable;