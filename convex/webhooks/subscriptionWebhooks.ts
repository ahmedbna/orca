// convex/webhooks/subscriptionWebhooks.ts
import { httpAction } from '../_generated/server';
import { internal } from '../_generated/api';

/* ================================================== */
/* APPLE APP STORE SERVER NOTIFICATIONS */
/* ================================================== */
export const appleWebhook = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();

    console.log('Apple webhook received:', JSON.stringify(body, null, 2));

    // Verify the webhook signature (production implementation)
    // const isValid = await verifyAppleSignature(request, body);
    // if (!isValid) {
    //   return new Response('Invalid signature', { status: 401 });
    // }

    const notificationType = body.notificationType;
    const data = body.data;

    if (!data?.signedTransactionInfo) {
      return new Response('No transaction data', { status: 400 });
    }

    // Decode the JWS (JSON Web Signature) - in production, validate signature
    const transactionInfo = decodeJWT(data.signedTransactionInfo);

    const originalTransactionId = transactionInfo.originalTransactionId;
    const transactionId = transactionInfo.transactionId;
    const expiresDate = transactionInfo.expiresDate;

    switch (notificationType) {
      case 'INITIAL_BUY':
      case 'DID_RENEW':
        // Handle renewal
        await ctx.runMutation(internal.subscriptions.handleRenewal, {
          originalTransactionId,
          transactionId,
          expirationDate: expiresDate,
          platform: 'ios',
        });
        break;

      case 'DID_CHANGE_RENEWAL_STATUS':
        // User turned off auto-renewal
        if (data.autoRenewStatus === false) {
          // Mark as cancelled
          console.log('User disabled auto-renewal');
        }
        break;

      case 'EXPIRED':
      case 'DID_FAIL_TO_RENEW':
        // Handle expiration
        await ctx.runMutation(internal.subscriptions.handleExpiration, {
          originalTransactionId,
        });
        break;

      case 'REFUND':
        // Handle refund
        console.log('Subscription refunded:', originalTransactionId);
        await ctx.runMutation(internal.subscriptions.handleExpiration, {
          originalTransactionId,
        });
        break;

      case 'GRACE_PERIOD_EXPIRED':
        // Grace period ended without renewal
        await ctx.runMutation(internal.subscriptions.handleExpiration, {
          originalTransactionId,
        });
        break;

      default:
        console.log('Unhandled notification type:', notificationType);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Apple webhook error:', error);
    return new Response('Error processing webhook', { status: 500 });
  }
});

/* ================================================== */
/* GOOGLE PLAY STORE REAL-TIME DEVELOPER NOTIFICATIONS */
/* ================================================== */
export const googleWebhook = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();

    console.log('Google webhook received:', JSON.stringify(body, null, 2));

    // Decode the base64 message
    const message = body.message;
    if (!message?.data) {
      return new Response('No message data', { status: 400 });
    }

    const decodedData = JSON.parse(
      Buffer.from(message.data, 'base64').toString('utf-8'),
    );

    const notificationType = decodedData.notificationType;
    const subscriptionNotification = decodedData.subscriptionNotification;

    if (!subscriptionNotification) {
      return new Response('No subscription notification', { status: 400 });
    }

    const purchaseToken = subscriptionNotification.purchaseToken;
    const subscriptionId = subscriptionNotification.subscriptionId;

    // You'll need to verify the purchase with Google Play Developer API
    // For now, we'll handle the notification types

    switch (notificationType) {
      case 1: // SUBSCRIPTION_RECOVERED
      case 2: // SUBSCRIPTION_RENEWED
      case 7: // SUBSCRIPTION_RESTARTED
        // Handle renewal
        // Note: You'll need to fetch full subscription details from Play Developer API
        console.log('Subscription renewed:', purchaseToken);
        break;

      case 3: // SUBSCRIPTION_CANCELED
        // User cancelled subscription
        console.log('Subscription cancelled:', purchaseToken);
        break;

      case 4: // SUBSCRIPTION_PURCHASED
        // New subscription
        console.log('New subscription:', purchaseToken);
        break;

      case 5: // SUBSCRIPTION_ON_HOLD
        // Subscription on hold due to payment issue
        console.log('Subscription on hold:', purchaseToken);
        break;

      case 6: // SUBSCRIPTION_IN_GRACE_PERIOD
        // Subscription in grace period
        console.log('Subscription in grace period:', purchaseToken);
        break;

      case 10: // SUBSCRIPTION_PAUSED
        // Subscription paused
        console.log('Subscription paused:', purchaseToken);
        break;

      case 11: // SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED
        console.log('Pause schedule changed:', purchaseToken);
        break;

      case 12: // SUBSCRIPTION_REVOKED
        // Subscription revoked (refund)
        console.log('Subscription revoked:', purchaseToken);
        break;

      case 13: // SUBSCRIPTION_EXPIRED
        console.log('Subscription expired:', purchaseToken);
        break;

      default:
        console.log('Unhandled notification type:', notificationType);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Google webhook error:', error);
    return new Response('Error processing webhook', { status: 500 });
  }
});

/* ================================================== */
/* REVENUECAT WEBHOOK (RECOMMENDED) */
/* ================================================== */
export const revenuecatWebhook = httpAction(async (ctx, request) => {
  try {
    // Verify webhook authorization
    const authHeader = request.headers.get('authorization');
    const expectedAuth = process.env.REVENUECAT_WEBHOOK_SECRET;

    if (authHeader !== `Bearer ${expectedAuth}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();

    console.log('RevenueCat webhook:', JSON.stringify(body, null, 2));

    const event = body.event;
    const appUserId = event.app_user_id; // This should be your Convex user ID
    const productId = event.product_id;
    const eventType = event.type;

    // Extract subscription info
    const expirationDate = event.expiration_at_ms;
    const originalTransactionId =
      event.original_transaction_id || event.original_app_user_id;
    const transactionId = event.id;
    const platform = event.store === 'APP_STORE' ? 'ios' : 'android';

    switch (eventType) {
      case 'INITIAL_PURCHASE':
        // Handle new subscription
        console.log('New purchase:', appUserId, productId);
        // The frontend already handles this via purchaseSubscription mutation
        break;

      case 'RENEWAL':
        // Handle renewal
        await ctx.runMutation(internal.subscriptions.handleRenewal, {
          originalTransactionId,
          transactionId,
          expirationDate,
          platform,
        });
        break;

      case 'CANCELLATION':
        // Subscription cancelled (but still active until expiration)
        console.log('Subscription cancelled:', appUserId);
        break;

      case 'EXPIRATION':
        // Subscription expired
        await ctx.runMutation(internal.subscriptions.handleExpiration, {
          originalTransactionId,
        });
        break;

      case 'BILLING_ISSUE':
        // Payment failed
        console.log('Billing issue:', appUserId);
        break;

      case 'PRODUCT_CHANGE':
        // User changed subscription tier
        console.log('Product changed:', appUserId, productId);
        break;

      default:
        console.log('Unhandled event type:', eventType);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('RevenueCat webhook error:', error);
    return new Response('Error processing webhook', { status: 500 });
  }
});

/* ================================================== */
/* HELPER: DECODE JWT (SIMPLIFIED) */
/* ================================================== */
function decodeJWT(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT');

    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    throw error;
  }
}

/* ================================================== */
/* NOTE: Production Implementation */
/* ================================================== */
/*
For production, you MUST:

1. Verify Apple's JWS signatures using their public keys
2. Verify Google Play's signatures 
3. Use proper JWT validation libraries
4. Store webhook secrets securely in environment variables
5. Implement retry logic for failed webhook processing
6. Log all webhook events for debugging
7. Use RevenueCat for simplified cross-platform management

Example: Verifying Apple JWS
- Download Apple's root certificates
- Validate the JWS chain
- Verify the signature matches

Example: Verifying Google Play
- Use Google Play Developer API to verify purchase tokens
- Check subscription status from API

RevenueCat handles all of this automatically!
*/
