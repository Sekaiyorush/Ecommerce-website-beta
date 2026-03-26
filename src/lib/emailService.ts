import { formatTHB } from '@/lib/formatPrice';
import { logger } from '@/lib/logger';

export const emailService = {
    sendOrderConfirmation: async (_email: string, orderId: string, total: number) => {
        logger.warn(`[Email Service] Order confirmation for ${orderId} (${formatTHB(total)}) — email integration not configured`);
        return new Promise(resolve => setTimeout(resolve, 500));
    },

    sendOrderStatusUpdate: async (_email: string, orderId: string, status: string) => {
        logger.warn(`[Email Service] Status update for ${orderId} - ${status} — email integration not configured`);
        return new Promise(resolve => setTimeout(resolve, 500));
    },

    sendPayoutRequestNotification: async (_adminEmail: string, partnerName: string, amount: number) => {
        logger.warn(`[Email Service] Payout request from ${partnerName} for ${formatTHB(amount)} — email integration not configured`);
        return new Promise(resolve => setTimeout(resolve, 500));
    }
};
