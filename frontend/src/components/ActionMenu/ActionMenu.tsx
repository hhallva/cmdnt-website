import { useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import styles from './ActionMenu.module.css';

export type ActionMenuItem = {
    label: string;
    icon?: string;
    onClick: () => void;
    variant?: 'default' | 'danger';
    disabled?: boolean;
};

type ActionMenuPosition = {
    top: number;
    left?: number;
    right?: number;
};

type ActionMenuProps = {
    isOpen: boolean;
    anchorRef: RefObject<HTMLElement | null>;
    items: ActionMenuItem[];
    onClose: () => void;
    minWidth?: number;
    align?: 'auto' | 'left' | 'right';
};

const MENU_OFFSET = 4;
const VIEWPORT_PADDING = 8;

const ActionMenu: React.FC<ActionMenuProps> = ({
    isOpen,
    anchorRef,
    items,
    onClose,
    minWidth = 220,
    align = 'auto',
}) => {
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [position, setPosition] = useState<ActionMenuPosition | null>(null);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (!isOpen || !anchorRef.current || items.length === 0) {
            setPosition(null);
            setAnchorRect(null);
            return;
        }

        const rect = anchorRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const shouldAlignRight = align === 'right'
            || (align === 'auto' && rect.left + minWidth > viewportWidth - VIEWPORT_PADDING);
        const shouldAlignLeft = align === 'left';

        setAnchorRect(rect);
        setPosition({
            top: rect.bottom + MENU_OFFSET,
            left: shouldAlignLeft
                ? Math.max(rect.left - minWidth, VIEWPORT_PADDING)
                : shouldAlignRight
                    ? undefined
                    : Math.max(rect.left, VIEWPORT_PADDING),
            right: shouldAlignRight
                ? Math.max(viewportWidth - rect.right, VIEWPORT_PADDING)
                : undefined,
        });
    }, [align, anchorRef, isOpen, items.length, minWidth]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (menuRef.current?.contains(target) || anchorRef.current?.contains(target)) {
                return;
            }
            onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [anchorRef, isOpen, onClose]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleViewportChange = () => {
            onClose();
        };

        window.addEventListener('scroll', handleViewportChange, true);
        window.addEventListener('resize', handleViewportChange);

        return () => {
            window.removeEventListener('scroll', handleViewportChange, true);
            window.removeEventListener('resize', handleViewportChange);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!menuRef.current || !position || !anchorRect) {
            return;
        }

        const menuRect = menuRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const bottomOverflow = menuRect.bottom > viewportHeight - VIEWPORT_PADDING;

        if (!bottomOverflow) {
            return;
        }

        const desiredTop = Math.max(anchorRect.top - menuRect.height - MENU_OFFSET, VIEWPORT_PADDING);
        if (position.top !== desiredTop) {
            setPosition({
                top: desiredTop,
                left: position.left,
                right: position.right,
            });
        }
    }, [anchorRect, position]);

    if (!isOpen || !position || items.length === 0) {
        return null;
    }

    return createPortal(
        <div
            ref={menuRef}
            className={styles.menu}
            role="menu"
            style={{
                top: position.top,
                left: position.left,
                right: position.right,
                minWidth,
            }}
        >
            {items.map((item, index) => (
                <button
                    key={index}
                    type="button"
                    className={`${styles.menuItem} ${item.variant === 'danger' ? styles.menuItemDanger : ''}`}
                    onClick={() => {
                        item.onClick();
                        onClose();
                    }}
                    disabled={item.disabled}
                >
                    {item.icon && <i className={`bi ${item.icon}`}></i>}
                    <span>{item.label}</span>
                </button>
            ))}
        </div>,
        document.body
    );
};

export default ActionMenu;
