'use client';

import { useEffect, useCallback, useState } from 'react';
import { getSyncQueue, removeFromSyncQueue, type SyncItem } from '@/lib/idb-cache';
import * as journalActions from '@/app/journal/actions';
import { useToast } from '@/hooks/use-toast';

export function useSyncManager() {
    const [isSyncing, setIsSyncing] = useState(false);
    const { toast } = useToast();

    const processQueue = useCallback(async () => {
        if (typeof window === 'undefined' || !navigator.onLine || isSyncing) return;

        const queue = await getSyncQueue();
        if (queue.length === 0) return;

        setIsSyncing(true);
        console.log(`[SyncManager] Processing ${queue.length} pending items...`);

        for (const item of queue) {
            try {
                let success = false;
                switch (item.action) {
                    case 'add_entry':
                        const addResult = await journalActions.addEntry(item.payload, item.payload.source || 'manual');
                        if (!addResult.error) success = true;
                        break;
                    case 'update_entry':
                        const updateResult = await journalActions.updateEntry(item.payload);
                        if (updateResult) success = true;
                        break;
                    case 'delete_entry':
                        const deleteResult = await journalActions.deleteEntry(item.payload.id);
                        if (!deleteResult?.error) success = true;
                        break;
                    case 'analyze_entry':
                        const analyzeResult = await journalActions.analyzeVoiceEntry(item.payload.entryId, item.payload.audioDataUri);
                        if (!analyzeResult.error) success = true;
                        break;
                }

                if (success) {
                    await removeFromSyncQueue(item.id);
                    console.log(`[SyncManager] Successfully synced ${item.action} (${item.id})`);
                }
            } catch (error) {
                console.error(`[SyncManager] Failed to sync ${item.action}:`, error);
            }
        }

        setIsSyncing(false);
        
        // Final check to see if more was added during processing
        const remaining = await getSyncQueue();
        if (remaining.length > 0) {
            toast({
                title: 'Sync in progress',
                description: `${remaining.length} items still pending. Will retry shortly.`,
            });
        } else {
             toast({
                title: 'Sync Complete',
                description: 'All offline changes have been saved to the cloud.',
            });
        }
    }, [isSyncing, toast]);

    useEffect(() => {
        // Run on mount
        processQueue();

        // Listen for online event
        window.addEventListener('online', processQueue);
        
        // Periodic check every 5 minutes
        const interval = setInterval(processQueue, 5 * 60 * 1000);

        return () => {
            window.removeEventListener('online', processQueue);
            clearInterval(interval);
        };
    }, [processQueue]);

    return { isSyncing, processQueue };
}
