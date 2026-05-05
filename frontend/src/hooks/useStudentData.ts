// src/hooks/useStudentData.ts
import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/client';
import type { StudentsDto } from '../types/students';
import { useAsyncResource } from './shared/useAsyncResource';

export const useStudentData = (studentId: number) => {
    const [notFound, setNotFound] = useState(false);
    const isValidStudentId = Number.isFinite(studentId) && studentId > 0;
    const initialData = useMemo(() => ({
        student: null as StudentsDto | null,
        notFound: false,
    }), []);

    const { data, loading, error, refetch } = useAsyncResource({
        enabled: isValidStudentId,
        initialData,
        loader: async () => {
            try {
                const [studentRes, contactsRes, extRes] = await Promise.all([
                    apiClient.getStudentById(studentId),
                    apiClient.getStudentContactsById(studentId),
                    apiClient.getExtStudentById(studentId),
                ]);

                console.info(`Получение данных студента с ID: ${studentId}`);

                return {
                    student: {
                        ...studentRes,
                        contacts: contactsRes,
                        origin: extRes.origin,
                    },
                    notFound: false,
                };
            } catch (err: unknown) {
                const status = (err as { status?: number })?.status;
                if (status === 404) {
                    return {
                        student: null,
                        notFound: true,
                    };
                }

                throw err;
            }
        },
        deps: [studentId],
    });

    const finalError = isValidStudentId ? error : 'Некорректный ID студента';

    useEffect(() => {
        setNotFound(data.notFound);
    }, [data.notFound]);

    return {
        student: data.student,
        loading: isValidStudentId ? loading : false,
        error: finalError,
        notFound,
        refetch,
    };
};