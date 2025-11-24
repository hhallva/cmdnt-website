import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../../../api/client';
import type { NoteDto } from '../../../../../types/notes';
import ActionButton from '../../../../../components/ActionButton/ActionButton';
import CommonModal from '../../../../../components/CommonModal/CommonModal';
import styles from './NotesTab.module.css';

interface NotesTabProps {
    studentId: number;
    studentName?: string;
    currentUserName?: string | null;
    currentUserId?: number | null;
    currentUserRoleName?: string | null;
}
const NotesTab: React.FC<NotesTabProps> = ({ studentId, studentName, currentUserName, currentUserId, currentUserRoleName }) => {
    const [notes, setNotes] = useState<NoteDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [noteText, setNoteText] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [isModalOpen, setModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchNotes = async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
                const response = await apiClient.getStudentNotesById(studentId);
                if (!isMounted) return;
                setNotes(response);
            } catch (error) {
                if (!isMounted) return;
                const message = error instanceof Error ? error.message : 'Не удалось загрузить заметки.';
                setLoadError(message);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchNotes();

        return () => {
            isMounted = false;
        };
    }, [studentId]);

    const fallbackAuthorName = (currentUserName && currentUserName.trim().length > 0)
        ? currentUserName.trim()
        : 'Сотрудник общежития';


    const handleOpenModal = () => {
        setNoteText('');
        setFormError(null);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setFormError(null);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const trimmedText = noteText.trim();
        if (!trimmedText) {
            setFormError('Введите текст заметки.');
            return;
        }
        setFormError(null);
        setIsSubmitting(true);

        try {
            const createdNote = await apiClient.createStudentNote({
                studentId,
                text: trimmedText,
                userId: currentUserId ?? undefined,
            });
            const normalizedNote: NoteDto = {
                ...createdNote,
                author: createdNote.author ?? (currentUserId != null
                    ? {
                        id: currentUserId,
                        name: fallbackAuthorName,
                        role: currentUserRoleName
                            ? { id: 0, name: currentUserRoleName }
                            : null
                    }
                    : null),
            };
            setNotes(prev => [normalizedNote, ...prev]);
            setNoteText('');
            setModalOpen(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Не удалось сохранить заметку.';
            setFormError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const normalizedCurrentRole = currentUserRoleName?.trim().toLowerCase() ?? '';

    const canDeleteNote = (note: NoteDto): boolean => {
        const authorId = note.author?.id;

        if (currentUserId != null && authorId === currentUserId)
            return true;

        if (!normalizedCurrentRole)
            return false;

        const authorRole = note.author?.role?.name?.trim().toLowerCase() ?? '';
        const isAuthorMissing = note.author == null;

        if (normalizedCurrentRole === 'администратор')
            return true;

        if (isAuthorMissing)
            return normalizedCurrentRole !== 'воспитатель';

        if (normalizedCurrentRole === 'комендант')
            return authorRole === 'воспитатель';

        return false;
    };


    const notesHintText = isLoading
        ? 'Загрузка заметок...'
        : notes.length > 0
            ? `Всего заметок: ${notes.length}`
            : 'У студента пока нет заметок';

    return (
        <section className={styles.notesSection}>
            <div className={styles.notesToolbar}>
                <span className={styles.notesHint}>{notesHintText}</span>
                <ActionButton
                    variant='primary'
                    size='md'
                    onClick={handleOpenModal}
                    disabled={isLoading}
                    className={styles.notesToolbarButton}
                >
                    <i className="bi bi-plus-circle me-1" />
                    Добавить
                </ActionButton>
            </div>

            {loadError && (
                <div className="alert alert-danger" role="alert">
                    {loadError}
                </div>
            )}

            {isLoading ? (
                <div className={styles.emptyState}>
                    <div className="spinner-border" role="status" aria-hidden="true" />
                    <p className="mb-0">Загружаем заметки...</p>
                </div>
            ) : notes.length === 0 ? (
                <div className={styles.emptyState}>
                    <i className="bi bi-journal-text" />
                    <p>У студента пока нет заметок. Добавьте первую, чтобы сохранить важную информацию.</p>
                </div>
            ) : (
                <div className={styles.notesListWrapper}>
                    {notes.map(note => {
                        const author = note.author?.name?.trim()
                            || (note.author?.id ? `Пользователь #${note.author.id}` : 'Сотрудник общежития');
                        const createdDate = new Date(note.createDate);
                        const formattedDate = isNaN(createdDate.getTime())
                            ? note.createDate
                            : `${String(createdDate.getDate()).padStart(2, '0')}.${String(createdDate.getMonth() + 1).padStart(2, '0')}.${createdDate.getFullYear()}`;

                        const handleDelete = async (targetNote: NoteDto): Promise<void> => {
                            if (deletingNoteId === targetNote.id) {
                                return;
                            }

                            setLoadError(null);
                            setDeletingNoteId(targetNote.id);

                            try {
                                await apiClient.deleteNote(targetNote.id);
                                setNotes(prevNotes => prevNotes.filter(n => n.id !== targetNote.id));
                            } catch (error) {
                                const message = error instanceof Error ? error.message : 'Не удалось удалить заметку.';
                                setLoadError(message);
                            } finally {
                                setDeletingNoteId(null);
                            }
                        };

                        return (
                            <article key={note.id} className={styles.noteItem}>
                                <div className={styles.noteHeader}>
                                    <div className={styles.noteMeta}>
                                        <span className={styles.noteAuthor}>{author}</span>
                                        <span
                                            aria-hidden="true"
                                            className={`d-none d-sm-inline ${styles.noteDivider}`}
                                        >
                                            •
                                        </span>
                                        <span
                                            className={`d-none d-sm-inline ${styles.noteDateText}`}
                                        >
                                            {formattedDate}
                                        </span>
                                        <span
                                            className={`d-sm-none d-block ${styles.noteDateText}`}
                                        >
                                            {formattedDate}
                                        </span>
                                    </div>

                                    {canDeleteNote(note) && (
                                        <ActionButton
                                            type="button"
                                            variant="transparent-primary"
                                            size="sm"
                                            onClick={() => handleDelete(note)}
                                            aria-label="Удалить заметку"
                                            className={styles.noteActionButton}
                                            disabled={deletingNoteId === note.id}
                                        >
                                            {deletingNoteId === note.id ? 'Удаляем...' : 'Удалить'}
                                        </ActionButton>
                                    )}
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
                        className={`${styles.noteTextarea} ${formError ? styles.noteTextareaError : ''}`}
                        placeholder={`Добавьте заметку о студенте ${studentName ?? ''}`}
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        maxLength={500}
                        aria-label="Текст заметки"
                    />
                    {formError && <div className={styles.validationMessage}>{formError}</div>}
                    <div className={styles.modalActions}>
                        <ActionButton type="button" variant='secondary' size='md' onClick={handleCloseModal}>
                            Отмена
                        </ActionButton>
                        <ActionButton type="submit" variant='primary' size='md' disabled={isSubmitting}>
                            {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                        </ActionButton>
                    </div>
                </form>
            </CommonModal>
        </section>
    );
};

export default NotesTab;
