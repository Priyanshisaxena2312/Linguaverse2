'use client';

import { useSyncManager } from '@/hooks/use-sync-manager';

/**
 * Empty client component that initializes the Sync Manager.
 * We include this in the root layout so that offline data is synced
 * automatically as soon as the user is online.
 */
export function SyncEnabler() {
    useSyncManager();
    return null;
}
