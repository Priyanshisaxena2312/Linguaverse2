const DB_NAME = 'LinguaVerseAudioDB';
const STORE_NAME = 'audioChunks';
const DB_VERSION = 1;

export async function initAudioDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'timestamp' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function saveAudioChunk(blob: Blob) {
    const db = await initAudioDB() as IDBDatabase;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const data = {
            timestamp: Date.now(),
            blob
        };
        const request = store.add(data);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}

export async function getAllAudioChunks(): Promise<Blob[]> {
    const db = await initAudioDB() as IDBDatabase;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result.map((item: any) => item.blob));
        request.onerror = () => reject(request.error);
    });
}

export async function clearAudioDB() {
    const db = await initAudioDB() as IDBDatabase;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}
