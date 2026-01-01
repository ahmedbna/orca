import { TouchableOpacity, ScrollView } from 'react-native';
import { Streak } from '@/components/map/streak';
import { OrcaButton } from '@/components/squishy/orca-button';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, BookOpen, Trophy, Zap } from 'lucide-react-native';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { LANGUAGES } from '@/constants/languages';
import { useColor } from '@/hooks/useColor';

type Props = {
  userId: Id<'users'>;
  user: Doc<'users'> & {
    course: Doc<'courses'> | null;
    lesson: Doc<'lessons'> | null;
    allCourses: any[];
    coursesCompleted: number;
    lessonsCompleted: number;
    totalWins: number;
    streak: number;
    credits: number;
  };
};

export const Profile = ({ user, userId }: Props) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const card = useColor('card');
  const text = useColor('text');
  const muted = useColor('textMuted');
  const background = useColor('background');

  const AVATAR_SHADOW_OFFSET = 6;
  const size = 100;
  const colors = {
    face: '#5E5CE6',
    shadow: '#3F3DB8',
    text: '#FFFFFF',
  };

  const nativeLanguag = LANGUAGES.find(
    (lang) => lang.code === user.nativeLanguage
  );

  const learningLanguage = LANGUAGES.find(
    (lang) => lang.code === user.learningLanguage
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FAD40B' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 70,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 300,
        }}
      >
        {/* Profile Header */}
        <View
          style={{
            backgroundColor: background,
            borderRadius: 24,
            padding: 20,
            paddingBottom: 26,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: 16,
            }}
          >
            <View>
              {/* Shadow */}
              <View
                pointerEvents='none'
                style={{
                  top: AVATAR_SHADOW_OFFSET,
                  left: 0,
                  width: size,
                  height: size,
                  borderRadius: 20,
                  backgroundColor: colors.shadow,
                }}
              />

              {/* Avatar */}
              <View
                pointerEvents='none'
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: size,
                  height: size,
                  borderRadius: 20,
                  backgroundColor: colors.face,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  borderWidth: 3,
                  borderColor: 'rgba(0,0,0,0.15)',
                }}
              >
                {user.image ? (
                  <Image
                    source={{ uri: user.image }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit='cover'
                  />
                ) : (
                  <Text
                    style={{
                      color: '#FFF',
                      fontSize: 28,
                      fontWeight: '800',
                    }}
                  >
                    {user.name
                      ?.split(' ')
                      .map((part) => part.charAt(0).toUpperCase())
                      .join('')}
                  </Text>
                )}
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '900',
                  color: text,
                  marginBottom: 4,
                }}
              >
                {user.name || 'User'}
              </Text>
              {user.bio && (
                <Text
                  style={{
                    fontSize: 14,
                    color: muted,
                    lineHeight: 18,
                  }}
                >
                  {user.bio}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View
          style={{
            backgroundColor: background,
            borderRadius: 24,
            padding: 20,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          {/* Stats Row */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: '#FFF3E0',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <Zap size={24} color='#FF9800' fill='#FF9800' />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: text }}>
                {user.streak}
              </Text>
              <Text style={{ fontSize: 12, color: muted }}>Day Streak</Text>
            </View>

            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: '#E8F5E9',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <BookOpen size={24} color='#4CAF50' />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: text }}>
                {user.coursesCompleted}
              </Text>
              <Text style={{ fontSize: 12, color: muted }}>Completed</Text>
            </View>

            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: '#F3E5F5',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <Trophy size={24} color='#9C27B0' />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: text }}>
                {user.lessonsCompleted}
              </Text>
              <Text style={{ fontSize: 12, color: muted }}>Lessons</Text>
            </View>
          </View>
        </View>

        {/* Languages Section */}
        <View
          style={{
            backgroundColor: background,
            borderRadius: 24,
            padding: 20,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: '800',
              color: text,
              marginBottom: 16,
            }}
          >
            🌍 Languages
          </Text>

          <View style={{ gap: 12 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 12,
                backgroundColor: card,
                borderRadius: 12,
              }}
            >
              <Text style={{ fontSize: 14, color: muted, fontWeight: '600' }}>
                Your Language
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: text }}>
                {nativeLanguag?.name} {nativeLanguag?.flag}
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 12,
                backgroundColor: card,
                borderRadius: 12,
              }}
            >
              <Text style={{ fontSize: 14, color: muted, fontWeight: '600' }}>
                Learning
              </Text>
              <Text
                style={{ fontSize: 16, fontWeight: '700', color: '#5E5CE6' }}
              >
                {learningLanguage?.name} {learningLanguage?.flag}
              </Text>
            </View>
          </View>
        </View>

        {/* Current Course Section */}
        {user.course && (
          <View
            style={{
              backgroundColor: background,
              borderRadius: 24,
              padding: 20,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '800',
                color: text,
                marginBottom: 16,
              }}
            >
              📚 Current Course
            </Text>

            <LinearGradient
              colors={['#5E5CE6', '#7C7AE8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 16,
                padding: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '800',
                  color: '#FFF',
                  marginBottom: 8,
                }}
              >
                {user.course.title}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: '#FFF',
                  opacity: 0.9,
                  marginBottom: 12,
                }}
              >
                {user.course.description}
              </Text>

              {user.lesson && (
                <View
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#FFF',
                      opacity: 0.8,
                      marginBottom: 4,
                    }}
                  >
                    Current Lesson
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: '#FFF',
                    }}
                  >
                    {user.lesson.title}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          {
            paddingBottom: insets.bottom,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#F6C90E',
            paddingHorizontal: 16,
            gap: 12,
            height: insets.bottom + 240,
            overflow: 'hidden',
            zIndex: 99,
          },
        ]}
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}
        >
          <ChevronLeft size={26} color='#000' strokeWidth={3} />

          <Text
            variant='title'
            style={{
              fontSize: 22,
              color: '#000',
              fontWeight: '800',
              opacity: 0.7,
            }}
          >
            Back
          </Text>
        </TouchableOpacity>

        <Streak
          streak={user.streak}
          onPress={() => router.push('/(home)/streak')}
        />

        {user._id === userId ? (
          <OrcaButton
            label='SETTINGS'
            variant='gray'
            onPress={() => router.push('/settings')}
          />
        ) : null}
      </View>
    </View>
  );
};
