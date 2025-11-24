import React, { useEffect, useMemo, useState } from 'react';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import CommonModal from '../../../../components/CommonModal/CommonModal';
import styles from './NotesTab.module.css';

interface NotesTabProps {
    studentId: number;
    studentName?: string;
    currentUserName?: string | null;
}

interface NoteItem {
    id: string;
    text: string;
    author: string;
    createdAt: string;
}

const STORAGE_PREFIX = 'student-notes';

const parseStoredNotes = (rawValue: string | null): NoteItem[] => {
    if (!rawValue) return [];
    try {
        const parsed = JSON.parse(rawValue);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((note): note is NoteItem =>
            typeof note === 'object' &&
            typeof note?.id === 'string' &&
            typeof note?.text === 'string' &&
            typeof note?.author === 'string' &&
            typeof note?.createdAt === 'string'
        );
    } catch (error) {
        console.warn('Не удалось прочитать заметки из localStorage:', error);
        return [];
    }
};

const generateNoteId = (studentId: number) => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${studentId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const NotesTab: React.FC<NotesTabProps> = ({ studentId, studentName, currentUserName }) => {
    const storageKey = useMemo(() => `${STORAGE_PREFIX}-${studentId}`, [studentId]);
    const [notes, setNotes] = useState<NoteItem[]>(() => {
        if (typeof window === 'undefined') return [];
        return parseStoredNotes(localStorage.getItem(storageKey));
    });
    const [noteText, setNoteText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        setNotes(parseStoredNotes(localStorage.getItem(storageKey)));
        setNoteText('');
        setError(null);
        setModalOpen(false);
    }, [storageKey]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(storageKey, JSON.stringify(notes));
    }, [notes, storageKey]);

    const authorName = (currentUserName && currentUserName.trim().length > 0)
        ? currentUserName.trim()
        : 'Сотрудник общежития';

    const placeholderText = studentName
        ? `Добавьте заметку о студенте ${studentName}`
        : 'Добавьте заметку о студенте';

    const handleOpenModal = () => {
        setNoteText('');
        setError(null);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setError(null);
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const trimmedText = noteText.trim();
        if (!trimmedText) {
            setError('Введите текст заметки.');
            return;
        }

        const newNote: NoteItem = {
            id: generateNoteId(studentId),
            text: trimmedText,
            author: authorName,
            createdAt: new Date().toISOString(),
        };

        setNotes(prev => [newNote, ...prev]);
        setNoteText('');
        setError(null);
        setModalOpen(false);
    };

    const handleDelete = (noteId: string) => {
        setNotes(prev => prev.filter(note => note.id !== noteId));
    };

    return (
        <section className={styles.notesSection}>
            <div className={styles.notesToolbar}>
                {notes.length > 0 ? (
                    <span className={styles.notesHint}>Всего заметок: {notes.length}</span>
                ) : (
                    <span className={styles.notesHint}>У студента пока нет заметок</span>
                )}
                <ActionButton
                    variant='primary'
                    size='md'
                    onClick={handleOpenModal}
                >
                    <i className="bi bi-plus-circle me-1" />
                    Добавить
                </ActionButton>
            </div>

            {notes.length === 0 ? (
                <div className={styles.emptyState}>
                    <i className="bi bi-journal-text" />
                    <p>У студента пока нет заметок. Добавьте первую, чтобы сохранить важную информацию.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {notes.map(note => {
                        const parts = note.author.trim().split(/\s+/);
                        const lastName = parts[0] ?? '';
                        const initials = parts
                            .slice(1)
                            .map(part => part[0]?.toUpperCase())
                            .filter(Boolean)
                            .map(initial => `${initial}.`)
                            .join(' ');
                        const formattedAuthor = initials ? `${lastName} ${initials}` : lastName;
                        const createdDate = new Date(note.createdAt);
                        const formattedDate = isNaN(createdDate.getTime())
                            ? note.createdAt
                            : `${String(createdDate.getDate()).padStart(2, '0')}.${String(createdDate.getMonth() + 1).padStart(2, '0')}.${createdDate.getFullYear()}`;

                        return (
                            <article key={note.id} className={styles.noteItem}>
                                <div className={styles.noteHeader} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span className={styles.noteAuthor}>
                                        {formattedAuthor}
                                    </span>
                                    <span aria-hidden="true" style={{ padding: '0 4px' }}>•</span>
                                    <span style={{ color: '#6c757d' }}>{formattedDate}</span>

                                    <ActionButton
                                        type="button"
                                        variant="transparent-primary"
                                        size="sm"
                                        onClick={() => handleDelete(note.id)}
                                        aria-label="Удалить заметку"
                                        style={{ marginLeft: 'auto' }}
                                    >
                                        Удалить
                                    </ActionButton>
                                </div>
                                <div className={styles.noteContent}>{note.text}</div>
                            </article>
                        );
                    })}
                </div>
            )}

            <CommonModal isOpen={isModalOpen} onClose={handleCloseModal} title="Новая заметка">
                <form className={styles.noteModalForm} onSubmit={handleSubmit}>
                    <textarea
                        className={`${styles.noteTextarea} ${error ? styles.noteTextareaError : ''}`}
                        placeholder={placeholderText}
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        maxLength={2000}
                        aria-label="Текст заметки"
                    />
                    {error && <div className={styles.validationMessage}>{error}</div>}
                    <div className={styles.modalActions}>
                        <ActionButton type="button" variant='secondary' size='md' onClick={handleCloseModal}>
                            Отмена
                        </ActionButton>
                        <ActionButton type="submit" variant='primary' size='md' >
                            Сохранить
                        </ActionButton>
                    </div>
                </form>
            </CommonModal>
        </section>
    );
};

export default NotesTab;
