// Example usage in your React Native app

import { View, Text, Button, Alert } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/convex/_generated/api';
import { useConvexAuth } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useRouter } from 'expo-router';

export default function AccountDeletionScreen() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();

  const deletionStatus = useQuery(api.userDeletion.getDeletionStatus);
  const requestDeletion = useMutation(api.userDeletion.requestDeletion);
  const cancelDeletion = useMutation(api.userDeletion.cancelDeletion);

  const handleRequestDeletion = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? Your account will be permanently deleted in 30 days unless you log in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!isAuthenticated) return;

            try {
              const result = await requestDeletion();
              Alert.alert('Success', result.message);

              await signOut();
              // Force a hard refresh to ensure clean state
              router.dismissAll();
            } catch (error) {
              Alert.alert('Error', String(error));
            }
          },
        },
      ]
    );
  };

  const handleCancelDeletion = async () => {
    try {
      const result = await cancelDeletion();
      Alert.alert('Success', result.message);
    } catch (error) {
      Alert.alert('Error', String(error));
    }
  };

  if (!deletionStatus) {
    return <Spinner />;
  }

  return (
    <View style={{ padding: 20 }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 20,
          color: '#FFF',
        }}
      >
        Account Deletion
      </Text>

      {deletionStatus.isScheduled ? (
        <View>
          <Text style={{ color: 'red', marginBottom: 10 }}>
            Your account is scheduled for deletion
          </Text>
          <Text style={{ marginBottom: 10, color: '#FFF' }}>
            Days remaining: {deletionStatus.daysRemaining}
          </Text>
          <Text style={{ marginBottom: 20, color: '#ccc' }}>
            Your account will be permanently deleted on{' '}
            {new Date(deletionStatus.deletionDate!).toLocaleDateString()}
          </Text>
          <Button
            title='Cancel Deletion'
            onPress={handleCancelDeletion}
            color='green'
          />
        </View>
      ) : (
        <View>
          <Text style={{ marginBottom: 20, color: '#666' }}>
            If you delete your account, all your data will be permanently
            removed after 30 days. You can cancel the deletion by logging in
            during this period.
          </Text>
          <Button
            title='Delete Account'
            onPress={handleRequestDeletion}
            color='red'
          />
        </View>
      )}
    </View>
  );
}
