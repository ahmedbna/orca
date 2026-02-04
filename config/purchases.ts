// config/purchases.ts
import Purchases, {
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
} from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys
const EXPO_PUBLIC_REVENUECAT_IOS_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const EXPO_PUBLIC_REVENUECAT_ANDROID_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

// Product IDs
export const PRODUCT_IDS = {
  MONTHLY: 'orca_plus_monthly',
  YEARLY: 'orca_plus_yearly',
} as const;

// Subscription tiers
export type SubscriptionTier = 'free' | 'Orca+';

// Initialize RevenueCat
export const initializePurchases = async (userId: string) => {
  try {
    const apiKey = Platform.select({
      ios: EXPO_PUBLIC_REVENUECAT_IOS_KEY,
      android: EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
      default: EXPO_PUBLIC_REVENUECAT_IOS_KEY,
    });

    if (!apiKey) {
      console.error('RevenueCat API key not configured');
      return;
    }

    // Configure SDK
    Purchases.setLogLevel(LOG_LEVEL.DEBUG); // Use INFO in production

    // Initialize with user ID
    await Purchases.configure({
      apiKey,
      appUserID: userId, // Use Convex user ID
    });

    console.log('✅ RevenueCat initialized for user:', userId);
  } catch (error) {
    console.error('❌ Failed to initialize RevenueCat:', error);
  }
};

// Get available offerings
export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    const offerings = await Purchases.getOfferings();

    if (offerings.current !== null) {
      return offerings.current;
    }

    return null;
  } catch (error) {
    console.error('Error fetching offerings:', error);
    return null;
  }
};

// Purchase a package
export const purchasePackage = async (
  packageToPurchase: PurchasesPackage,
): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}> => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);

    console.log('✅ Purchase successful:', customerInfo);

    return { success: true, customerInfo };
  } catch (error: any) {
    if (error.userCancelled) {
      console.log('User cancelled purchase');
      return { success: false, error: 'User cancelled' };
    }

    console.error('❌ Purchase failed:', error);
    return { success: false, error: error.message || 'Purchase failed' };
  }
};

// Restore purchases
export const restorePurchases = async (): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}> => {
  try {
    const customerInfo = await Purchases.restorePurchases();

    console.log('✅ Purchases restored:', customerInfo);

    return { success: true, customerInfo };
  } catch (error: any) {
    console.error('❌ Restore failed:', error);
    return { success: false, error: error.message || 'Restore failed' };
  }
};

// Get customer info
export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Error fetching customer info:', error);
    return null;
  }
};

// Check if user has active subscription
export const hasActiveSubscription = async (): Promise<boolean> => {
  try {
    const customerInfo = await getCustomerInfo();

    if (!customerInfo) return false;

    // Check for active entitlement
    const entitlements = customerInfo.entitlements.active;

    // Check if "Orca+" entitlement is active
    return 'Orca+' in entitlements && entitlements['Orca+'].isActive;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
};

// Get subscription info
export const getSubscriptionInfo = async () => {
  try {
    const customerInfo = await getCustomerInfo();

    if (!customerInfo) return null;

    const plusEntitlement = customerInfo.entitlements.active['Orca+'];

    if (!plusEntitlement) return null;

    return {
      isActive: plusEntitlement.isActive,
      willRenew: plusEntitlement.willRenew,
      periodType: plusEntitlement.periodType,
      productIdentifier: plusEntitlement.productIdentifier,
      expirationDate: plusEntitlement.expirationDate,
      isSandbox: plusEntitlement.isSandbox,
      store: plusEntitlement.store,
    };
  } catch (error) {
    console.error('Error getting subscription info:', error);
    return null;
  }
};

// Format price
export const formatPrice = (price: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
};

// Calculate savings for yearly plan
export const calculateYearlySavings = (
  monthlyPrice: number,
  yearlyPrice: number,
): { amount: number; percentage: number } => {
  const annualMonthlyPrice = monthlyPrice * 12;
  const savings = annualMonthlyPrice - yearlyPrice;
  const percentage = Math.round((savings / annualMonthlyPrice) * 100);

  return { amount: savings, percentage };
};
