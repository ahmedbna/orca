// components/subscription/feature-list.tsx
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Check } from 'lucide-react-native';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface FeatureListProps {
  features: Feature[];
}

export function FeatureList({ features }: FeatureListProps) {
  return (
    <View style={{ gap: 16 }}>
      {features.map((feature, index) => (
        <FeatureItem key={index} {...feature} />
      ))}
    </View>
  );
}

function FeatureItem({ icon, title, description }: Feature) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      {/* Icon Container */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: '#FAD40B',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 3,
          borderColor: 'rgba(250, 212, 11, 0.3)',
        }}
      >
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingTop: 4 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: '#FFF',
            marginBottom: 4,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: '#999',
            lineHeight: 20,
          }}
        >
          {description}
        </Text>
      </View>

      {/* Check Mark */}
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: '#34C759',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 12,
        }}
      >
        <Check size={16} color='#FFF' strokeWidth={3} />
      </View>
    </View>
  );
}
