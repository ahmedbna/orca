import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { ScrollView } from '@/components/ui/scroll-view';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { ChevronLeft, User } from 'lucide-react-native';
import { TextArea } from '@/components/ui/text-area';
import { Button } from '@/components/ui/button';
import { SignOutButton } from '@/components/auth/singout';
import { Alert, TouchableOpacity } from 'react-native';
import { Spinner } from '@/components/ui/spinner';
import { useConvexAuth } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const { isLoading, isAuthenticated } = useConvexAuth();

  const user = useQuery(api.users.get, {});
  const deletionStatus = useQuery(api.userDeletion.getDeletionStatus);

  const update = useMutation(api.users.update);
  const requestDeletion = useMutation(api.userDeletion.requestDeletion);
  const cancelDeletion = useMutation(api.userDeletion.cancelDeletion);

  // 2. Initialize state with "safe" defaults
  const [loading, setLoading] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [birthday, setBirthday] = useState<Date | undefined>(undefined);

  // 3. Sync state ONLY when data is fully loaded
  // This prevents the "Initial Null" crash on iOS
  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setBio(user.bio ?? '');
      setGender(user.gender ?? '');
      if (user.birthday) {
        setBirthday(new Date(user.birthday));
      }
    }
  }, [user]);

  const today = new Date();
  const maxSelectableBirthday = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate()
  );

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

  if (isLoading || user === undefined || deletionStatus === undefined) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spinner size='lg' variant='circle' color='#000000' />
      </View>
    );
  }

  if (!isAuthenticated || user === null) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <Text variant='heading'>Please log in to view settings.</Text>
      </View>
    );
  }

  const handleUpdateProfile = async () => {
    setLoading(true);

    await update({
      name,
      bio,
      gender,
      birthday: birthday ? birthday.getTime() : undefined,
    });

    setLoading(false);
  };

  // Helper for safe date rendering
  const renderDeletionDate = () => {
    if (!deletionStatus?.deletionDate) return 'N/A';
    return new Date(deletionStatus.deletionDate).toLocaleDateString();
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior='automatic'
      contentContainerStyle={{
        padding: 16,
        paddingTop: 40,
        paddingBottom: 100,
      }}
    >
      <Text variant='heading' style={{ marginBottom: 8, fontSize: 32 }}>
        {user.name}
      </Text>

      {isDelete ? (
        <View style={{ paddingVertical: 16 }}>
          <TouchableOpacity
            onPress={() => setIsDelete(false)}
            style={{
              gap: 4,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <ChevronLeft size={24} color='#FFF' strokeWidth={3} />
            <Text
              style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: '#FFF',
              }}
            >
              Account Deletion
            </Text>
          </TouchableOpacity>

          {deletionStatus.isScheduled ? (
            <View style={{ marginLeft: 28 }}>
              <Text style={{ color: 'red', marginBottom: 10 }}>
                Your account is scheduled for deletion
              </Text>
              <Text style={{ marginBottom: 10, color: '#FFF' }}>
                Days remaining: {deletionStatus.daysRemaining ?? 0}
              </Text>
              <Text style={{ marginBottom: 20, color: '#ccc' }}>
                Your account will be permanently deleted on{' '}
                {renderDeletionDate()}
              </Text>
              <Button onPress={handleCancelDeletion} variant='success'>
                Cancel Deletion
              </Button>
            </View>
          ) : (
            <View style={{ marginLeft: 28 }}>
              <Text style={{ marginBottom: 20, color: '#666' }}>
                If you delete your account, all your data will be permanently
                removed after 30 days. You can cancel the deletion by logging in
                during this period.
              </Text>
              <Button onPress={handleRequestDeletion} variant='destructive'>
                Delete Account
              </Button>
            </View>
          )}
        </View>
      ) : (
        <View style={{ gap: 12, marginVertical: 24 }}>
          <Input
            variant='outline'
            label='Full Name'
            placeholder='Enter your full name'
            icon={User}
            value={name}
            onChangeText={setName}
            disabled={loading}
          />

          <DatePicker
            variant='outline'
            label='Birthday'
            value={birthday}
            onChange={setBirthday}
            maximumDate={maxSelectableBirthday}
            placeholder='Select your birthday'
            disabled={loading}
          />

          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Button
              style={{ flex: 1 }}
              variant={gender === 'male' ? 'default' : 'outline'}
              onPress={() => setGender('male')}
              disabled={loading}
            >
              Male
            </Button>
            <Button
              style={{ flex: 1 }}
              variant={gender === 'female' ? 'default' : 'outline'}
              onPress={() => setGender('female')}
              disabled={loading}
            >
              Female
            </Button>
          </View>

          <TextArea
            variant='outline'
            placeholder='Tell us about yourself in your bio...'
            value={bio}
            onChangeText={setBio}
            numberOfLines={4}
            disabled={loading}
          />

          <Button
            variant='success'
            onPress={handleUpdateProfile}
            style={{ marginVertical: 8 }}
            disabled={loading}
            loading={loading}
          >
            Update Profile
          </Button>

          <SignOutButton disabled={loading} />

          <Button
            variant='ghost'
            onPress={() => setIsDelete(true)}
            style={{ marginVertical: 8 }}
            disabled={loading}
            loading={loading}
          >
            Delete your account
          </Button>
        </View>
      )}
    </ScrollView>
  );
}
