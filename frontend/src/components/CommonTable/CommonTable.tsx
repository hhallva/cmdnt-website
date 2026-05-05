import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ActionMenu, { type ActionMenuItem } from '../ActionMenu/ActionMenu';
import styles from './CommonTable.module.css';

export interface ColumnDefinition<T> {
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

export interface RowActionConfig<T> {
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
    onRowClick?: (item: T) => void;
    rowActionOpenOnRowClick?: boolean;
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
    onRowClick,
    rowActionOpenOnRowClick = false,
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
                ? 'bi-sort-down'
                : 'bi-sort-up';

        return (
            <div
                onClick={() => onSortRequest?.(column.key as string)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', width: '100%' }}
            >
                <span>{column.title}</span>
                <i className={`bi ${icon}`} style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-light)', opacity: isActive ? 1 : 0.5, transition: 'opacity 0.2s ease', marginLeft: '0.5rem', }}></i>
            </div>
        );
    };

    // Обрабатываем отображение всплывающего меню действий
    const triggerButtonRef = useRef<HTMLElement | null>(null);
    const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
    const closeRowActionMenu = useCallback(() => {
        setActiveRowIndex(null);
        triggerButtonRef.current = null;
    }, []);

    useEffect(() => {
        if (activeRowIndex !== null && activeRowIndex >= data.length) {
            closeRowActionMenu();
        }
    }, [activeRowIndex, closeRowActionMenu, data.length]);

    const hasRowAction = Boolean(rowAction);
    const getVisibleMenuActions = (item: T) =>
        rowAction?.popupActions?.filter(action => (action.isVisible ? action.isVisible(item) : true)) ?? [];

    const handleRowActionClick = (event: React.MouseEvent<HTMLButtonElement>, item: T, rowIndex: number) => {
        event.stopPropagation();
        if (!rowAction) return;

        const visibleMenuActions = getVisibleMenuActions(item);
        if (visibleMenuActions.length) {
            if (activeRowIndex === rowIndex) {
                closeRowActionMenu();
            } else {
                triggerButtonRef.current = event.currentTarget;
                setActiveRowIndex(rowIndex);
            }
        } else {
            rowAction.onClick?.(item);
        }
    };

    const handleRowClick = (event: React.MouseEvent<HTMLTableRowElement>, item: T, rowIndex: number) => {
        onRowClick?.(item);

        if (!rowActionOpenOnRowClick || !rowAction) {
            return;
        }

        const visibleMenuActions = getVisibleMenuActions(item);
        if (!visibleMenuActions.length) {
            return;
        }

        event.preventDefault();

        if (activeRowIndex === rowIndex) {
            closeRowActionMenu();
            return;
        }

        const rowElement = event.currentTarget;
        triggerButtonRef.current = rowElement;
        setActiveRowIndex(rowIndex);
    };

    const activeRowItem = activeRowIndex !== null ? data[activeRowIndex] : null;
    const activeMenuItems = useMemo<ActionMenuItem[]>(() => {
        if (!activeRowItem) {
            return [];
        }

        return getVisibleMenuActions(activeRowItem).map(action => ({
            label: action.label,
            icon: action.icon,
            variant: action.variant,
            onClick: () => action.onClick(activeRowItem),
        }));
    }, [activeRowItem, getVisibleMenuActions]);

    return (
        <div className={`${styles.tableWrapper} ${className}`}>
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
                            data.map((item, rowIndex) => (
                                <tr
                                    key={rowIndex}
                                    className={(onRowClick || rowActionOpenOnRowClick) ? styles.clickableRow : undefined}
                                    onClick={(event) => {
                                        if (onRowClick || rowActionOpenOnRowClick) {
                                            handleRowClick(event, item, rowIndex);
                                        }
                                    }}
                                >
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
                                                onClick={(event) => handleRowActionClick(event, item, rowIndex)}
                                            >
                                                {rowAction?.icon && <i className={`bi ${rowAction.icon}`}></i>}
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                {/*Plaseholder при отсутсвии данных*/}
                                <td colSpan={columns.length + 1 + (hasRowAction ? 1 : 0)} className="text-center">{emptyMessage}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <ActionMenu
                isOpen={Boolean(activeRowItem && activeMenuItems.length > 0)}
                anchorRef={triggerButtonRef}
                items={activeMenuItems}
                onClose={closeRowActionMenu}
            />
        </div>
    );
};

export default CommonTable;