import { View } from '@/components/ui/view';

// 3D Card Component
interface SquishyCardProps {
  children: React.ReactNode;
  style?: object;
}

export const SquishyCard: React.FC<SquishyCardProps> = ({
  children,
  style = {},
}) => {
  return (
    <View style={[{ position: 'relative' }, style]}>
      <View
        style={{
          backgroundColor: '#E5C000',
          position: 'absolute',
          top: 8,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 32,
        }}
      />

      <View
        style={{
          backgroundColor: '#000',
          borderRadius: 32,
          padding: 24,
          borderWidth: 5,
          borderColor: 'rgba(0,0,0,0.1)',
        }}
      >
        {children}
      </View>
    </View>
  );
};
