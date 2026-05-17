import { useCallback, useEffect, useRef, useState } from 'react';

type RefetchOptions = {
    silent?: boolean;
};

type UseAsyncResourceOptions<TData> = {
    enabled: boolean;
    initialData: TData;
    loader: () => Promise<TData>;
    deps: ReadonlyArray<unknown>;
    resetOnDisable?: boolean;
};

export const useAsyncResource = <TData>({
    enabled,
    initialData,
    loader,
    deps,
    resetOnDisable = true,
}: UseAsyncResourceOptions<TData>) => {
    const [data, setData] = useState<TData>(initialData);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const silentReloadRef = useRef(false);
    const loaderRef = useRef(loader);
    const initialDataRef = useRef(initialData);

    loaderRef.current = loader;

    useEffect(() => {
        initialDataRef.current = initialData;
    }, [initialData]);

    useEffect(() => {
        let isMounted = true;

        if (!enabled) {
            if (resetOnDisable) {
                setData(initialDataRef.current);
            }
            setError(null);
            setLoading(false);
            silentReloadRef.current = false;
            return () => {
                isMounted = false;
            };
        }

        const run = async () => {
            const isSilentRun = silentReloadRef.current;
            if (!isSilentRun) {
                setLoading(true);
            }
            setError(null);

            try {
                const result = await loaderRef.current();
                if (!isMounted) {
                    return;
                }
                setData(result);
            } catch (err: unknown) {
                if (!isMounted) {
                    return;
                }

                const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
                setError(message);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
                silentReloadRef.current = false;
            }
        };

        run();

        return () => {
            isMounted = false;
        };
    }, [enabled, reloadKey, resetOnDisable, ...deps]);

    const refetch = useCallback((options?: RefetchOptions) => {
        if (options?.silent) {
            silentReloadRef.current = true;
            setLoading(false);
        }
        setReloadKey(prev => prev + 1);
    }, []);

    return {
        data,
        setData,
        loading,
        error,
        refetch,
    };
};
