/**
 * A lightweight IndexedDB wrapper for caching student journal and analytics data.
 * This helps reduce Supabase requests on the free tier.
 */

const DB_NAME = 'LinguaverseSyncCache';
const STORES = ['student_journals', 'student_analytics', 'student_settings', 'app_data', 'sync_queue'] as const;
const DB_VERSION = 4; // Incremented for sync_queue support

type StoreName = typeof STORES[number];

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: any) => {
            const db = event.target.result;
            STORES.forEach(store => {
                if (!db.objectStoreNames.contains(store)) {
                    db.createObjectStore(store);
                }
            });
        };

        request.onsuccess = (event: any) => resolve(event.target.result);
        request.onerror = (event: any) => reject(event.target.error);
    });
}

export async function getCachedData(storeName: StoreName, key: string): Promise<any | null> {
    if (typeof window === 'undefined') return null;

    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const getRequest = store.get(key);

            getRequest.onsuccess = () => {
                const result = getRequest.result;
                resolve(result ? result.data : null);
            };
            getRequest.onerror = () => resolve(null);
        });
    } catch (e) {
        return null;
    }
}

export async function setCachedData(storeName: StoreName, key: string, data: any): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);

            store.put({
                data,
                updatedAt: new Date().toISOString()
            }, key);

            transaction.oncomplete = () => resolve();
        });
    } catch (e) {
        // Silently fail if IDB is blocked
    }
}

export async function clearCachedData(storeName: StoreName, key?: string): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);

            if (key) {
                store.delete(key);
            } else {
                store.clear();
            }

            transaction.oncomplete = () => resolve();
        });
    } catch (e) {
        // Silently fail
    }
}

// Backward compatibility helpers
export const getCachedStudentEntries = (id: string) => getCachedData('student_journals', id);
export const setCachedStudentEntries = (id: string, entries: any[]) => setCachedData('student_journals', id, entries);

// Unified Bundle Helpers
export const getCachedStudentBundle = (id: string) => getCachedData('student_journals', `bundle_${id}`);
export const setCachedStudentBundle = (id: string, bundle: { entries: any[], analytics: any[] }) => setCachedData('student_journals', `bundle_${id}`, bundle);

// --- SYNC QUEUE HELPERS ---

export interface SyncItem {
    id: string;
    action: 'add_entry' | 'update_entry' | 'delete_entry' | 'analyze_entry';
    payload: any;
    timestamp: string;
}

export async function addToSyncQueue(action: SyncItem['action'], payload: any): Promise<string> {
    if (typeof window === 'undefined') return '';
    const id = crypto.randomUUID();
    const syncItem: SyncItem = {
        id,
        action,
        payload,
        timestamp: new Date().toISOString(),
    };
    
    await setCachedData('sync_queue', id, syncItem);
    return id;
}

export async function getSyncQueue(): Promise<SyncItem[]> {
    if (typeof window === 'undefined') return [];
    
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const transaction = db.transaction('sync_queue', 'readonly');
            const store = transaction.objectStore('sync_queue');
            const request = store.getAll();
            
            request.onsuccess = () => {
                const results = request.result || [];
                resolve(results.map((r: any) => r.data));
            };
            request.onerror = () => resolve([]);
        });
    } catch (e) {
        return [];
    }
}

export async function removeFromSyncQueue(id: string): Promise<void> {
    await clearCachedData('sync_queue', id);
}
