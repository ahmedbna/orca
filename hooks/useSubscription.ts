// hooks/useSubscription.ts
import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { Alert } from 'react-native';
import * as Purchases from '@/config/purchases';

export type SubscriptionStatus = {
  tier: 'free' | 'Orca+';
  status: string | null;
  platform: 'ios' | 'android' | null;
  hasActiveSubscription: boolean;
  subscription: any | null;
};

export function useSubscription() {
  const [isLoading, setIsLoading] = useState(false);
  const [offerings, setOfferings] = useState<any>(null);

  // Query subscription status from Convex
  const subscriptionStatus = useQuery(api.subscriptions.getSubscriptionStatus);
  const hasAccess = useQuery(api.subscriptions.hasAccess);
  const subscription = useQuery(api.subscriptions.getSubscription);

  // Mutations
  const purchaseSubscriptionMutation = useMutation(
    api.subscriptions.purchaseSubscription,
  );
  const restoreSubscriptionMutation = useMutation(
    api.subscriptions.restoreSubscription,
  );

  // Load offerings on mount
  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      const currentOffering = await Purchases.getOfferings();
      setOfferings(currentOffering);
    } catch (error) {
      console.error('Failed to load offerings:', error);
    }
  };

  /**
   * Present RevenueCat's native paywall
   * This will show RevenueCat's pre-built paywall UI
   */
  const presentPaywall = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);

    try {
      // Present the paywall
      const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall({
        offering: offerings?.current, // Use current offering
      });

      setIsLoading(false);

      switch (paywallResult) {
        case PAYWALL_RESULT.PURCHASED:
          // Purchase successful - sync with backend
          await syncPurchaseWithBackend();
          return true;

        case PAYWALL_RESULT.RESTORED:
          // Restore successful - sync with backend
          await syncRestoreWithBackend();
          return true;

        case PAYWALL_RESULT.CANCELLED:
          // User cancelled the paywall
          console.log('Paywall cancelled by user');
          return false;

        case PAYWALL_RESULT.NOT_PRESENTED:
          // Paywall couldn't be presented
          console.log('Paywall not presented');
          Alert.alert('Error', 'Unable to load subscription options');
          return false;

        case PAYWALL_RESULT.ERROR:
          // Error occurred
          console.error('Paywall error');
          Alert.alert('Error', 'Something went wrong. Please try again.');
          return false;

        default:
          return false;
      }
    } catch (error: any) {
      setIsLoading(false);
      console.error('Paywall presentation error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to show subscription options',
      );
      return false;
    }
  }, [offerings]);

  /**
   * Present paywall only if user doesn't have access
   * Useful for "Continue" buttons that should unlock premium content
   */
  const presentPaywallIfNeeded = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);

    try {
      const paywallResult: PAYWALL_RESULT =
        await RevenueCatUI.presentPaywallIfNeeded({
          requiredEntitlementIdentifier: 'Orca+',
          offering: offerings?.current,
        });

      setIsLoading(false);

      switch (paywallResult) {
        case PAYWALL_RESULT.PURCHASED:
          await syncPurchaseWithBackend();
          return true;

        case PAYWALL_RESULT.RESTORED:
          await syncRestoreWithBackend();
          return true;

        case PAYWALL_RESULT.NOT_PRESENTED:
          // User already has access - no paywall needed
          return true;

        default:
          return false;
      }
    } catch (error: any) {
      setIsLoading(false);
      console.error('Paywall if needed error:', error);
      return false;
    }
  }, [offerings]);

  /**
   * Sync purchase with backend after successful transaction
   */
  const syncPurchaseWithBackend = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const entitlement = customerInfo?.entitlements.active['Orca+'];

      if (!entitlement) {
        console.error('Purchase successful but no entitlement found');
        return;
      }

      // Sync with Convex backend
      await purchaseSubscriptionMutation({
        productId: entitlement.productIdentifier,
        platform: entitlement.store === 'APP_STORE' ? 'ios' : 'android',
        transactionId: entitlement.latestPurchaseDate || Date.now().toString(),
        originalTransactionId:
          entitlement.originalPurchaseDate || Date.now().toString(),
        purchaseDate: new Date(
          entitlement.originalPurchaseDate || Date.now(),
        ).getTime(),
        expirationDate: entitlement.expirationDate
          ? new Date(entitlement.expirationDate).getTime()
          : Date.now() + 30 * 24 * 60 * 60 * 1000,
        isTrialPeriod: false,
        priceUSD: 0, // RevenueCat doesn't provide price in entitlement
      });

      console.log('✅ Purchase synced with backend');
    } catch (error) {
      console.error('❌ Failed to sync purchase with backend:', error);
      // Don't throw - the purchase was successful, just log the sync error
    }
  };

  /**
   * Sync restore with backend
   */
  const syncRestoreWithBackend = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const entitlement = customerInfo?.entitlements.active['Orca+'];

      if (!entitlement) {
        Alert.alert(
          'No Subscription Found',
          'No active subscription to restore.',
        );
        return;
      }

      await restoreSubscriptionMutation({
        originalTransactionId:
          entitlement.originalPurchaseDate || Date.now().toString(),
        platform: entitlement.store === 'APP_STORE' ? 'ios' : 'android',
      });

      Alert.alert(
        '✅ Subscription Restored',
        'Your subscription has been restored successfully!',
      );

      console.log('✅ Restore synced with backend');
    } catch (error) {
      console.error('❌ Failed to sync restore with backend:', error);
    }
  };

  /**
   * Manual restore purchases (not using paywall)
   */
  const restore = async () => {
    setIsLoading(true);

    try {
      const customerInfo = await Purchases.restorePurchases();
      const entitlement =
        customerInfo.customerInfo?.entitlements.active['Orca+'];

      if (!entitlement) {
        Alert.alert(
          'No Subscription Found',
          'No active subscription to restore.',
        );
        setIsLoading(false);
        return { success: false };
      }

      await syncRestoreWithBackend();
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      setIsLoading(false);
      console.error('Restore error:', error);
      Alert.alert('Error', error.message || 'Failed to restore purchases');
      return { success: false };
    }
  };

  /**
   * Check if user has active subscription
   * This checks RevenueCat directly (local check)
   */
  const checkAccess = async (): Promise<boolean> => {
    try {
      return await Purchases.hasActiveSubscription();
    } catch (error) {
      console.error('Error checking access:', error);
      return false;
    }
  };

  return {
    // Status from backend
    subscriptionStatus,
    hasAccess: hasAccess || false,
    subscription,

    // Offerings
    offerings,

    // Main actions - using RevenueCat Paywall
    presentPaywall,
    presentPaywallIfNeeded,
    restore,
    checkAccess,

    // Helpers
    syncPurchaseWithBackend,
    syncRestoreWithBackend,

    // Loading state
    isLoading,
  };
}
