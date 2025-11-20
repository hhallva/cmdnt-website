// src/hooks/useStudentData.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import type { StudentsDto, ContactDto, ExtStudentData } from '../types/students';

export const useStudentData = (studentId: number) => {
    const [student, setStudent] = useState<StudentsDto | null>(null);
    const [contacts, setContacts] = useState<ContactDto[]>([]);
    const [extStudent, setExtStudent] = useState<ExtStudentData>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isNaN(studentId) || studentId <= 0) {
            setLoading(false);
            setError('Некорректный ID студента');
            return;
        }

        const fetchStudentData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [studentRes, contactsRes, extRes] = await Promise.all([
                    apiClient.getStudentById(studentId),
                    apiClient.getStudentContactsById(studentId),
                    apiClient.getExtStudentById(studentId),
                ]);

                setStudent(studentRes);
                setContacts(contactsRes);
                setExtStudent(extRes);
                console.info(`Получение данных студента с ID: ${studentId}`);
            } catch (err: any) {
                const msg = err.message || 'Ошибка при загрузке данных студента';
                setError(msg);
                console.error('Ошибка при загрузке данных студента:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStudentData();
    }, [studentId]);

    return { student, contacts, extStudent, loading, error };
};