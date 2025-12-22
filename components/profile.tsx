import { Doc } from '@/convex/_generated/dataModel';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';

type Props = {
  user: Doc<'users'>;
};

export const Profile = ({ user }: Props) => {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text variant='heading'>{user.name}</Text>
      <Text variant='subtitle'>{user.email}</Text>
    </View>
  );
};
