import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { ScrollView } from '@/components/ui/scroll-view';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { User } from 'lucide-react-native';
import { TextArea } from '@/components/ui/text-area';
import { Button } from '@/components/ui/button';
import { SignOutButton } from '@/components/auth/singout';
import { ButtonSpinner } from '@/components/ui/spinner';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const user = useQuery(api.users.get, {});
  const update = useMutation(api.users.update);

  const userbirthday = user?.birthday ? new Date(user.birthday) : undefined;

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [birthday, setBirthday] = useState<Date | undefined>(userbirthday);

  const today = new Date();
  const maxSelectableBirthday = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate()
  );

  if (user === undefined) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ButtonSpinner size='lg' variant='circle' color='#000000' />
      </View>
    );
  }

  if (user === null) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <Text variant='heading' style={{ marginBottom: 8 }}>
          No User Found
        </Text>
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
          onPress={() => router.push('/delete')}
          style={{ marginVertical: 8 }}
          disabled={loading}
          loading={loading}
        >
          Delete your account
        </Button>
      </View>
    </ScrollView>
  );
}
