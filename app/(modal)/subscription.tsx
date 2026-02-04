// app/(modal)/subscription-revenuecat.tsx
/**
 * Alternative Subscription Screen using RevenueCat's Paywall Component
 *
 * This version embeds the RevenueCat Paywall component directly in your app
 * instead of presenting it as a modal. Use this if you want more control
 * over the navigation flow.
 */

import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import { CustomerInfo } from 'react-native-purchases';
import { useSubscription } from '@/hooks/useSubscription';
import { Spinner } from '@/components/ui/spinner';

export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { offerings, syncPurchaseWithBackend, syncRestoreWithBackend } =
    useSubscription();

  if (!offerings) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size='lg' variant='circle' color='#FAD40B' />
      </View>
    );
  }

  const handleDismiss = async () => {
    // Navigate back when paywall is dismissed
    router.back();
  };

  const handlePurchaseCompleted = async ({
    customerInfo,
  }: {
    customerInfo: CustomerInfo;
  }) => {
    console.log('Purchase completed:', customerInfo);

    // Sync with backend
    await syncPurchaseWithBackend();

    // Navigate back to courses
    router.back();
  };

  const handleRestoreCompleted = async ({
    customerInfo,
  }: {
    customerInfo: CustomerInfo;
  }) => {
    console.log('Restore completed:', customerInfo);

    // Sync with backend
    await syncRestoreWithBackend();

    // Navigate back
    router.back();
  };

  const handlePurchaseError = (error: any) => {
    console.error('Purchase error:', error);
    // Error is shown by RevenueCat UI automatically
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 16,
          paddingBottom: 16,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <ChevronLeft size={28} color='#FAD40B' strokeWidth={3} />
          <Text
            style={{
              fontSize: 18,
              color: '#FAD40B',
              fontWeight: '700',
            }}
          >
            Back
          </Text>
        </TouchableOpacity>
      </View>

      {/* RevenueCat Paywall Component */}
      <RevenueCatUI.Paywall
        options={{
          offering: offerings.current, // Use current offering
        }}
        // Lifecycle listeners
        onPurchaseStarted={() => {
          console.log('Purchase started');
        }}
        onPurchaseCompleted={handlePurchaseCompleted}
        onPurchaseError={handlePurchaseError}
        onPurchaseCancelled={() => {
          console.log('Purchase cancelled');
        }}
        onRestoreStarted={() => {
          console.log('Restore started');
        }}
        onRestoreCompleted={handleRestoreCompleted}
        onRestoreError={(error) => {
          console.error('Restore error:', error);
        }}
        onDismiss={handleDismiss}
      />
    </View>
  );
}
