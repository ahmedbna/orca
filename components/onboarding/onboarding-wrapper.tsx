// components/onboarding/onboarding-wrapper.tsx
import React, { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Spinner } from '@/components/ui/spinner';
import { Onboarding } from '@/components/onboarding/onboarding';
import { Colors } from '@/theme/colors';

type Props = {
  children: React.ReactNode;
};

export const OnboardingWrapper = ({ children }: Props) => {
  const user = useQuery(api.users.get, {});
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user) {
      // Check if user needs onboarding
      const needsOnboarding =
        !user.gender ||
        !user.bio ||
        !user.birthday ||
        !user.nativeLanguage ||
        !user.learningLanguage;

      setShowOnboarding(needsOnboarding);
    }
  }, [user]);

  if (user === undefined) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Colors.dark.orca,
        }}
      >
        <Spinner size='lg' variant='circle' color='#000000' />
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
        }}
      >
        <Text>User Not Found!</Text>
      </View>
    );
  }

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  return <>{children}</>;
};
