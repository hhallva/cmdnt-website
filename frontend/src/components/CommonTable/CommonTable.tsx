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
    pageSize?: number;
    currentPage?: number;
    onPageChange?: (page: number) => void;
    showPaginationSummary?: boolean;
}

const CommonTable = <T extends Record<string, any>>({
    title,
    data,
    columns,
    emptyMessage = 'Данные не найдены',
    className = '',
    totalCount,
    enableSorting = false,
    onSortRequest,
    sortConfig,
    rowAction,
    onRowClick,
    rowActionOpenOnRowClick = false,
    pageSize = 50,
    currentPage,
    onPageChange,
    showPaginationSummary = true,
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
    const [internalPage, setInternalPage] = useState(1);
    const closeRowActionMenu = useCallback(() => {
        setActiveRowIndex(null);
        triggerButtonRef.current = null;
    }, []);

    const isServerPaginated = typeof currentPage === 'number' && typeof onPageChange === 'function';
    const totalItems = isServerPaginated ? (totalCount ?? data.length) : data.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const resolvedPage = isServerPaginated ? Math.min(Math.max(currentPage ?? 1, 1), totalPages) : Math.min(internalPage, totalPages);

    const paginatedData = useMemo(() => {
        if (isServerPaginated) {
            return data;
        }

        const startIndex = (resolvedPage - 1) * pageSize;
        return data.slice(startIndex, startIndex + pageSize);
    }, [data, isServerPaginated, pageSize, resolvedPage]);

    useEffect(() => {
        if (isServerPaginated) {
            return;
        }

        const nextPage = Math.min(Math.max(internalPage, 1), totalPages);
        if (nextPage !== internalPage) {
            setInternalPage(nextPage);
        }
    }, [internalPage, isServerPaginated, totalPages]);

    useEffect(() => {
        closeRowActionMenu();
    }, [closeRowActionMenu, resolvedPage]);

    useEffect(() => {
        if (activeRowIndex !== null && activeRowIndex >= paginatedData.length) {
            closeRowActionMenu();
        }
    }, [activeRowIndex, closeRowActionMenu, paginatedData.length]);

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

    const handlePageChange = useCallback((page: number) => {
        const nextPage = Math.min(Math.max(page, 1), totalPages);
        if (nextPage === resolvedPage) {
            return;
        }

        if (isServerPaginated) {
            onPageChange?.(nextPage);
            return;
        }

        setInternalPage(nextPage);
    }, [isServerPaginated, onPageChange, resolvedPage, totalPages]);

    const paginationItems = useMemo(() => {
        if (totalPages <= 1) {
            return [] as Array<number | string>;
        }

        const visiblePages = new Set<number>();
        visiblePages.add(1);

        if (totalPages <= 7) {
            for (let page = 2; page <= totalPages; page += 1) {
                visiblePages.add(page);
            }
        } else if (resolvedPage <= 4) {
            [2, 3, 4, 5, totalPages].forEach(page => visiblePages.add(page));
        } else if (resolvedPage >= totalPages - 3) {
            [1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages].forEach(page => {
                if (page >= 1) {
                    visiblePages.add(page);
                }
            });
        } else {
            [1, resolvedPage - 1, resolvedPage, resolvedPage + 1, totalPages].forEach(page => visiblePages.add(page));
        }

        const sortedPages = Array.from(visiblePages).sort((left, right) => left - right);
        const items: Array<number | string> = [];

        sortedPages.forEach((page, index) => {
            const previousPage = sortedPages[index - 1];
            if (previousPage && page - previousPage > 1) {
                items.push(`ellipsis-${previousPage}-${page}`);
            }
            items.push(page);
        });

        return items;
    }, [resolvedPage, totalPages]);

    const paginationSummary = useMemo(() => {
        if (totalPages <= 1 || totalItems === 0) {
            return null;
        }

        const startItem = (resolvedPage - 1) * pageSize + 1;
        const endItem = startItem + paginatedData.length - 1;

        return `Всего: с ${startItem} по ${endItem} из ${totalItems}`;
    }, [paginatedData.length, pageSize, resolvedPage, totalItems, totalPages]);

    const activeRowItem = activeRowIndex !== null ? paginatedData[activeRowIndex] : null;
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
                        {paginatedData.length ? (
                            paginatedData.map((item, rowIndex) => (
                                <tr
                                    key={rowIndex}
                                    className={(onRowClick || rowActionOpenOnRowClick) ? styles.clickableRow : undefined}
                                    onClick={(event) => {
                                        if (onRowClick || rowActionOpenOnRowClick) {
                                            handleRowClick(event, item, rowIndex);
                                        }
                                    }}
                                >
                                    <td className={styles.indexColumn}>{(resolvedPage - 1) * pageSize + rowIndex + 1}</td>
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
            {totalPages > 1 && (
                <div className={styles.paginationSection}>
                    {showPaginationSummary && paginationSummary && (
                        <div className={styles.paginationSummary}>{paginationSummary}</div>
                    )}
                    <div className={styles.pagination}>
                        <button
                            type="button"
                            className={styles.paginationButton}
                            onClick={() => handlePageChange(resolvedPage - 1)}
                            disabled={resolvedPage === 1}
                            aria-label="Перейти на предыдущую страницу"
                        >
                            <i className="bi bi-chevron-left"></i>
                        </button>
                        {paginationItems.map(item => typeof item === 'number' ? (
                            <button
                                key={item}
                                type="button"
                                className={`${styles.paginationButton} ${styles.paginationPage} ${resolvedPage === item ? styles.paginationButtonActive : ''}`}
                                onClick={() => handlePageChange(item)}
                                aria-current={resolvedPage === item ? 'page' : undefined}
                            >
                                {item}
                            </button>
                        ) : (
                            <span key={item} className={styles.paginationEllipsis}>...</span>
                        ))}
                        <button
                            type="button"
                            className={styles.paginationButton}
                            onClick={() => handlePageChange(resolvedPage + 1)}
                            disabled={resolvedPage === totalPages}
                            aria-label="Перейти на следующую страницу"
                        >
                            <i className="bi bi-chevron-right"></i>
                        </button>
                    </div>
                </div>
            )}
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