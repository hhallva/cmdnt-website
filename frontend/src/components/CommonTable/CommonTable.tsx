import { type ReactNode, useEffect, useRef, useState } from 'react';
import styles from './CommonTable.module.css';

interface ColumnDefinition<T> {
    key: keyof T | string;
    title: ReactNode;
    sortable?: boolean;
    render?: (item: T) => ReactNode;
    className?: string;
}

interface SortConfig {
    key: string;
    direction: 'asc' | 'desc';
}

interface RowActionMenuItem<T> {
    label: string;
    icon?: string;
    onClick: (item: T) => void;
    variant?: 'default' | 'danger';
    isVisible?: (item: T) => boolean;
}

interface RowActionConfig<T> {
    icon: string;
    title?: string;
    onClick?: (item: T) => void;
    popupActions?: RowActionMenuItem<T>[];
}

interface CommonTableProps<T> {
    title?: string;
    data: T[];
    columns: ColumnDefinition<T>[];
    emptyMessage?: string;
    className?: string;
    totalCount?: number;
    enableSorting?: boolean;
    onSortRequest?: (key: string) => void;
    sortConfig?: SortConfig | null;
    rowAction?: RowActionConfig<T>;
}

const CommonTable = <T extends Record<string, any>>({
    title,
    data,
    columns,
    emptyMessage = 'Данные не найдены',
    className = '',
    enableSorting = false,
    onSortRequest,
    sortConfig,
    rowAction,
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
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', width: '100%' }}
            >
                <span>{column.title}</span>
                <i className={`bi ${icon}`} style={{ color: isActive ? '#0d6efd' : '#686868', opacity: isActive ? 1 : 0.5, transition: 'opacity 0.2s ease', marginLeft: '0.5rem', }}></i>
            </div>
        );
    };

    // Обрабатываем отображение всплывающего меню действий
    const tableWrapperRef = useRef<HTMLDivElement | null>(null);
    const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (tableWrapperRef.current && !tableWrapperRef.current.contains(event.target as Node)) {
                setActiveRowIndex(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const hasRowAction = Boolean(rowAction);
    const getVisibleMenuActions = (item: T) =>
        rowAction?.popupActions?.filter(action => (action.isVisible ? action.isVisible(item) : true)) ?? [];

    const handleRowActionClick = (item: T, rowIndex: number) => {
        if (!rowAction) return;

        const visibleMenuActions = getVisibleMenuActions(item);
        if (visibleMenuActions.length) {
            setActiveRowIndex(prev => (prev === rowIndex ? null : rowIndex));
        } else {
            rowAction.onClick?.(item);
        }
    };

    return (
        <div className={`${styles.tableWrapper} ${className}`} ref={tableWrapperRef}>
            {title && (
                <div className={styles.tableHeader}>
                    {/* Заголовок таблицы */}
                    {title && <h3 className={styles.tableTitle}>{title}</h3>}
                </div>
            )}
            <div className={styles.tableResponsive}>
                <table className={styles.table}>
                    <thead>
                        {/*Шапка таблицы*/}
                        <tr>
                            <th className={styles.indexColumn}>№</th>
                            {columns.map((column, index) => (
                                <th key={index} className={column.className}>{renderColumnTitle(column)}</th>
                            ))}
                            {hasRowAction && <th className={styles.rowActionColumn}></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {/*Данные таблицы*/}
                        {data.length ? (
                            data.map((item, rowIndex) => {
                                const visibleMenuActions = getVisibleMenuActions(item);
                                return (
                                    <tr key={rowIndex}>
                                        <td className={styles.indexColumn}>{rowIndex + 1}</td>
                                        {columns.map((column, colIndex) => (
                                            <td key={colIndex} className={column.className}>
                                                {column.render ? column.render(item) : getValueByPath(item, column.key) ?? 'Нет'}
                                            </td>
                                        ))}
                                        {hasRowAction && (
                                            <td className={styles.rowActionCell}>
                                                <button
                                                    type="button"
                                                    className={styles.rowActionButton}
                                                    title={rowAction?.title}
                                                    onClick={() => handleRowActionClick(item, rowIndex)}
                                                >
                                                    {rowAction?.icon && <i className={`bi ${rowAction.icon}`}></i>}
                                                </button>
                                                {rowAction && activeRowIndex === rowIndex && visibleMenuActions.length > 0 && (
                                                    <div className={styles.rowActionMenu}>
                                                        {visibleMenuActions.map((menuItem, menuIndex) => (
                                                            <button
                                                                key={menuIndex}

                                                                type="button"
                                                                className={`${styles.rowActionMenuItem} ${menuItem.variant === 'danger' ? styles.rowActionMenuItemDanger : ''}`}
                                                                onClick={() => {
                                                                    menuItem.onClick(item);
                                                                    setActiveRowIndex(null);
                                                                }}
                                                            >
                                                                {menuItem.icon && <i className={`bi ${menuItem.icon}`}></i>}
                                                                <span>{menuItem.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                {/*Plaseholder при отсутсвии данных*/}
                                <td colSpan={columns.length + 1 + (hasRowAction ? 1 : 0)} className="text-center">{emptyMessage}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CommonTable;