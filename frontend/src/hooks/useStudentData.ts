// src/hooks/useStudentData.ts
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import type { StudentsDto } from '../types/students';

export const useStudentData = (studentId: number) => {
    const [student, setStudent] = useState<StudentsDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        if (isNaN(studentId) || studentId <= 0) {
            setLoading(false);
            setError('Некорректный ID студента');
            setNotFound(false);
            return;
        }

        const fetchStudentData = async () => {
            try {
                setLoading(true);
                setError(null);
                setNotFound(false);

                const [studentRes, contactsRes, extRes] = await Promise.all([
                    apiClient.getStudentById(studentId),
                    apiClient.getStudentContactsById(studentId),
                    apiClient.getExtStudentById(studentId),
                ]);

                // Объединяем все данные в один объект
                setStudent({
                    ...studentRes,
                    contacts: contactsRes,
                    origin: extRes.origin,
                });
                console.info(`Получение данных студента с ID: ${studentId}`);
            } catch (err: any) {
                if (err?.status === 404) {
                    setNotFound(true);
                    setError(null);
                    return;
                }
                const msg = err.message || 'Ошибка при загрузке данных студента';
                setError(msg);
                console.error('Ошибка при загрузке данных студента:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStudentData();
    }, [studentId, reloadKey]);

    const refetch = useCallback(() => {
        setReloadKey(prev => prev + 1);
    }, []);

    return { student, loading, error, notFound, refetch };
};