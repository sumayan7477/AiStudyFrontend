import { useCallback, useEffect, useRef, useState } from "react";
import { parseApiError, type ApiError } from "../api/errors";

/**
 * Requests currently in flight, keyed by query key. React StrictMode mounts components twice in
 * development; both mounts share the same promise, so only ONE network request is made.
 * Entries are removed as soon as the request settles, so later loads always fetch fresh data.
 */
const inFlight = new Map<string, Promise<unknown>>();

function sharedRequest<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const existing = inFlight.get(key);
    if (existing) return existing as Promise<T>;

    const request = fetcher().finally(() => inFlight.delete(key));
    inFlight.set(key, request);
    return request;
}

export interface ApiQueryState<T> {
    data: T | null;
    error: ApiError | null;
    /** True while a request is running (initial load, key change or refetch). */
    loading: boolean;
    /** Loads again (e.g. a Retry button). Keeps showing the previous data while loading. */
    refetch: () => void;
}

interface QueryResult<T> {
    key: string;
    data: T | null;
    error: ApiError | null;
}

/**
 * Loads data for a page with loading/error state, StrictMode-safe de-duplication and retry.
 * When the key changes (e.g. another note id), data from the previous key is never shown.
 * Errors are normalised with parseApiError. A 401 is already handled globally (AuthContext logs out).
 */
export function useApiQuery<T>(key: string, fetcher: () => Promise<T>): ApiQueryState<T> {
    const [result, setResult] = useState<QueryResult<T> | null>(null);
    const [refetching, setRefetching] = useState(false);
    const [attempt, setAttempt] = useState(0);

    // Always call the latest fetcher without making it an effect dependency.
    const fetcherRef = useRef(fetcher);
    useEffect(() => {
        fetcherRef.current = fetcher;
    });

    useEffect(() => {
        let active = true;

        sharedRequest(key, () => fetcherRef.current()).then(
            (data) => {
                if (!active) return;
                setResult({ key, data, error: null });
                setRefetching(false);
            },
            (failure: unknown) => {
                if (!active) return;
                // Keep previously loaded data for the same key (e.g. a failed refresh).
                setResult((previous) => ({
                    key,
                    data: previous?.key === key ? previous.data : null,
                    error: parseApiError(failure),
                }));
                setRefetching(false);
            },
        );

        return () => {
            active = false;
        };
    }, [key, attempt]);

    const refetch = useCallback(() => {
        setRefetching(true);
        setAttempt((n) => n + 1);
    }, []);

    const current = result?.key === key ? result : null;

    return {
        data: current?.data ?? null,
        error: refetching ? null : current?.error ?? null,
        loading: current === null || refetching,
        refetch,
    };
}
