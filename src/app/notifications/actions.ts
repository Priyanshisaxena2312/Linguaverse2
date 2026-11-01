'use server';

import { createActionClient } from '@/lib/supabase/actions';
import webpush from 'web-push';

// VAPID keys should be in environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BOin7EE5k1G74IADDVRxr5iuBN-tO-QqoDxNSX9X_2QEqYa83sSRMLHc_3FNGzll8VgRv9xIe2PdfFtQozRXbZ8';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'WztlEsgr7x2zF_7Z_usKkN_2N-3Ipk--RNCpyBCr_iQ';

webpush.setVapidDetails(
  'mailto:support@linguaverse.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export async function subscribeUser(subscription: any) {
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
        .from('push_subscriptions')
        .upsert({
            user_id: user.id,
            subscription_data: subscription,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

    if (error) {
        console.error('Error saving subscription:', error);
        return { error: 'Failed to save notification subscription.' };
    }

    return { success: true };
}

export async function sendNotification(userId: string, title: string, body: string, url: string = '/') {
    const supabase = await createActionClient();
    
    // Fetch subscription for user
    const { data: subscription, error } = await supabase
        .from('push_subscriptions')
        .select('subscription_data')
        .eq('user_id', userId)
        .single();

    if (error || !subscription) {
        console.error('No subscription found for user:', userId);
        return { error: 'No subscription found' };
    }

    const payload = JSON.stringify({
        title,
        body,
        url,
    });

    try {
        await webpush.sendNotification(subscription.subscription_data, payload);
        return { success: true };
    } catch (e) {
        console.error('Error sending push notification:', e);
        return { error: 'Push delivery failed' };
    }
}
