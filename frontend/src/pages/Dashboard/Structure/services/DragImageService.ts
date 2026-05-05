import { getStudentImageSrc } from '../../../../utils/students';
import type { StudentsDto } from '../../../../types/students';
import type { MutableRefObject } from 'react';

type DragImageClassNames = {
    sideMenuCard: string;
    sideMenuAvatar: string;
    sideMenuCardInfo: string;
    sideMenuName: string;
    sideMenuMeta: string;
};

type StudentCardFormatter = {
    formatShortName: (student: StudentsDto) => string;
    getInitials: (student: StudentsDto) => string;
};

export class DragImageService {
    cleanup(ref: MutableRefObject<HTMLElement | null>): void {
        if (ref.current) {
            ref.current.remove();
            ref.current = null;
        }
    }

    setDraggingState(element: HTMLElement, isDragging: boolean): void {
        if (isDragging) {
            element.setAttribute('data-dragging', 'true');
            element.style.opacity = '1';
            element.style.transform = 'none';
            return;
        }

        element.removeAttribute('data-dragging');
        element.style.removeProperty('opacity');
        element.style.removeProperty('transform');
    }

    createFromElement(element: HTMLElement): HTMLElement | null {
        if (typeof document === 'undefined') {
            return null;
        }

        const rect = element.getBoundingClientRect();
        const computed = window.getComputedStyle(element);
        const clone = element.cloneNode(true) as HTMLElement;

        clone.style.width = `${Math.ceil(rect.width)}px`;
        clone.style.height = `${Math.ceil(rect.height)}px`;
        clone.style.position = 'absolute';
        clone.style.top = '-1000px';
        clone.style.left = '-1000px';
        clone.style.opacity = '1';
        clone.style.transform = 'none';
        clone.style.filter = 'none';
        clone.style.backdropFilter = 'none';
        clone.style.boxShadow = 'none';
        clone.style.outline = 'none';
        clone.style.borderRadius = computed.borderRadius;
        clone.style.backgroundColor = computed.backgroundColor;
        clone.style.border = computed.border;
        clone.style.overflow = 'hidden';
        clone.style.maskImage = 'none';
        clone.style.webkitMaskImage = 'none';
        clone.style.pointerEvents = 'none';
        clone.style.boxSizing = 'border-box';

        document.body.appendChild(clone);
        return clone;
    }

    createStudentCard(
        student: StudentsDto,
        classNames: DragImageClassNames,
        formatter: StudentCardFormatter
    ): HTMLElement | null {
        if (typeof document === 'undefined') {
            return null;
        }

        const imageSrc = getStudentImageSrc(student.image);
        const card = document.createElement('div');
        card.className = classNames.sideMenuCard;
        card.style.width = '220px';
        card.style.position = 'absolute';
        card.style.top = '-1000px';
        card.style.left = '-1000px';
        card.style.opacity = '1';
        card.style.transform = 'none';
        card.style.filter = 'none';
        card.style.backdropFilter = 'none';
        card.style.boxShadow = 'none';
        card.style.outline = 'none';
        card.style.overflow = 'hidden';
        card.style.pointerEvents = 'none';
        card.style.boxSizing = 'border-box';

        const avatar = document.createElement('div');
        avatar.className = classNames.sideMenuAvatar;

        if (imageSrc) {
            const img = document.createElement('img');
            img.src = imageSrc;
            img.alt = student.surname || 'Фотография студента';
            avatar.appendChild(img);
        } else {
            const initials = document.createElement('span');
            initials.textContent = formatter.getInitials(student) || '—';
            avatar.appendChild(initials);
        }

        const info = document.createElement('div');
        info.className = classNames.sideMenuCardInfo;

        const name = document.createElement('p');
        name.className = classNames.sideMenuName;
        name.textContent = formatter.formatShortName(student);

        const meta = document.createElement('p');
        meta.className = classNames.sideMenuMeta;
        meta.textContent = `Группа ${student.group?.name ?? '—'}, ${student.group?.course ?? '—'} курс`;

        info.appendChild(name);
        info.appendChild(meta);

        card.appendChild(avatar);
        card.appendChild(info);

        document.body.appendChild(card);
        return card;
    }
}
