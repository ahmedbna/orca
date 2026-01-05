import { TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Streak } from '@/components/map/streak';
import { OrcaButton } from '@/components/squishy/orca-button';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  BookOpen,
  Trophy,
  Zap,
  Volume2,
  Download,
  Trash2,
} from 'lucide-react-native';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { LANGUAGES, NATIVES } from '@/constants/languages';
import { useColor } from '@/hooks/useColor';
import { usePiperTTS } from '@/hooks/usePiperTTS';
import { useEffect, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

type Props = {
  userId: Id<'users'>;
  user: Doc<'users'> & {
    course: Doc<'courses'> | null | undefined;
    lesson: Doc<'lessons'> | null;
    allCourses: any[];
    coursesCompleted: number;
    lessonsCompleted: number;
    totalWins: number;
    streak: number;
    credits: number;
  };
  allModels: Array<Doc<'piperModels'>>;
  userVoice: Doc<'piperModels'> | null;
};

const AVATAR_SHADOW_OFFSET = 6;
const size = 100;
const colors = {
  face: '#5E5CE6',
  shadow: '#3F3DB8',
  text: '#FFFFFF',
};

export const Profile = ({ user, userId, allModels, userVoice }: Props) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const card = useColor('card');
  const text = useColor('text');
  const muted = useColor('textMuted');
  const background = useColor('background');

  const {
    initializeTTS,
    removeModel,
    getDownloadedModels,
    downloadProgress,
    isDownloading,
    speak,
    isInitializing,
  } = usePiperTTS({ models: allModels || [] });
  const setUserVoice = useMutation(api.piperModels.setUserVoice);

  const [downloadedModels, setDownloadedModels] = useState<string[]>([]);
  const [speakingModelId, setSpeakingModelId] = useState<string | null>(null);

  // Load downloaded models
  useEffect(() => {
    const loadDownloaded = async () => {
      const downloaded = await getDownloadedModels();
      setDownloadedModels(downloaded);
    };

    if (allModels) {
      loadDownloaded();
    }
  }, [allModels, getDownloadedModels]);

  const nativeLanguag = NATIVES.find(
    (lang) => lang.code === user.nativeLanguage
  );

  const learningLanguage = LANGUAGES.find(
    (lang) => lang.code === user.learningLanguage
  );

  const handleDownloadVoice = async (model: Doc<'piperModels'>) => {
    try {
      await initializeTTS(model._id);
      const downloaded = await getDownloadedModels();
      setDownloadedModels(downloaded);
      Alert.alert('Success', `${model.voice} voice downloaded!`);
    } catch (error) {
      Alert.alert('Error', `Failed to download voice: ${error}`);
    }
  };

  const handleSetCurrentVoice = async (piperId: Id<'piperModels'>) => {
    try {
      await setUserVoice({ piperId });
    } catch (error) {
      Alert.alert('Error', String(error));
    }
  };

  const handleDeleteVoice = async (model: Doc<'piperModels'>) => {
    const languageModels =
      allModels?.filter(
        (m) =>
          m.code === user?.learningLanguage &&
          downloadedModels.includes(m.modelId)
      ) || [];

    if (languageModels.length <= 1) {
      Alert.alert(
        'Cannot Delete',
        'You must have at least one voice model downloaded for your learning language.'
      );
      return;
    }

    if (userVoice?._id === model._id) {
      Alert.alert(
        'Cannot Delete',
        'You cannot delete the currently active voice. Please switch to another voice first.'
      );
      return;
    }

    Alert.alert(
      'Delete Voice',
      `Are you sure you want to delete ${model.voice}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await removeModel(model.modelId);
            if (success) {
              const downloaded = await getDownloadedModels();
              setDownloadedModels(downloaded);
              Alert.alert('Success', 'Voice deleted!');
            } else {
              Alert.alert('Error', 'Failed to delete voice');
            }
          },
        },
      ]
    );
  };

  const handleTestVoice = async (model: Doc<'piperModels'>) => {
    if (speakingModelId || isInitializing) return;

    try {
      setSpeakingModelId(model.modelId);
      await initializeTTS(model._id);
      const downloaded = await getDownloadedModels();
      setDownloadedModels(downloaded);

      const testPhrases: Record<string, string> = {
        en: 'Hello! This is a test of the voice.',
        de: 'Hallo! Das ist ein Test der Stimme.',
        es: '¡Hola! Esta es una prueba de la voz.',
        fr: 'Bonjour! Ceci est un test de la voix.',
        it: 'Ciao! Questo è un test della voce.',
        pt: 'Olá! Este é um teste da voz.',
        ru: 'Привет! Это тест голоса.',
        zh: '你好！这是语音测试。',
        ja: 'こんにちは！これは音声のテストです。',
        ko: '안녕하세요! 음성 테스트입니다.',
      };

      const phrase = testPhrases[model.code] || 'Hello! This is a test.';
      await speak(phrase, 0.75);
    } catch (error) {
      Alert.alert('Error', `Failed to test voice: ${error}`);
    } finally {
      setSpeakingModelId(null);
    }
  };

  const availableVoices =
    allModels?.filter((m) => m.code === user?.learningLanguage) || [];

  const downloadedCount = availableVoices.filter((v) =>
    downloadedModels.includes(v.modelId)
  ).length;

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
                    style={{ width: '100%', height: '100%', borderRadius: 20 }}
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
                      ?.trim()
                      .split(/\s+/)
                      .map((part) => part[0]?.toUpperCase())
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

        {/* Stats Section */}
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

        {user._id === userId ? (
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
                marginBottom: 8,
              }}
            >
              🎙️ Voice Settings
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: muted,
                marginBottom: 16,
              }}
            >
              {downloadedCount} of {availableVoices.length} voices downloaded
            </Text>

            <View style={{ gap: 12 }}>
              {availableVoices.map((model) => {
                const isDownloaded = downloadedModels.includes(model.modelId);
                const isCurrent = userVoice?._id === model._id;
                const progress = downloadProgress[model.modelId] || 0;
                const isSpeaking = speakingModelId === model.modelId;
                const isCurrentlyDownloading =
                  isDownloading && progress > 0 && progress < 1;

                return (
                  <View
                    key={model._id}
                    style={{
                      backgroundColor: card,
                      padding: 16,
                      borderRadius: 16,
                      borderWidth: isCurrent ? 2 : 0,
                      borderColor: isCurrent ? '#4CAF50' : 'transparent',
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: text,
                            fontSize: 16,
                            fontWeight: '800',
                          }}
                        >
                          {model.voice}
                        </Text>
                        <Text
                          style={{ color: muted, fontSize: 13, marginTop: 2 }}
                        >
                          {model.language} • {model.locale}
                        </Text>
                      </View>

                      {isCurrent && (
                        <View
                          style={{
                            backgroundColor: '#4CAF50',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 8,
                            alignSelf: 'flex-start',
                          }}
                        >
                          <Text
                            style={{
                              color: '#FFF',
                              fontSize: 11,
                              fontWeight: '800',
                            }}
                          >
                            ACTIVE
                          </Text>
                        </View>
                      )}
                    </View>

                    {isCurrentlyDownloading && (
                      <View style={{ marginBottom: 12 }}>
                        <View
                          style={{
                            height: 6,
                            backgroundColor: card,
                            borderRadius: 3,
                            overflow: 'hidden',
                          }}
                        >
                          <View
                            style={{
                              height: '100%',
                              width: `${progress * 100}%`,
                              backgroundColor: '#4CAF50',
                            }}
                          />
                        </View>
                        <Text
                          style={{ color: muted, fontSize: 11, marginTop: 4 }}
                        >
                          Downloading: {Math.round(progress * 100)}%
                        </Text>
                      </View>
                    )}

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {!isDownloaded ? (
                        <TouchableOpacity
                          onPress={() => handleDownloadVoice(model)}
                          disabled={isDownloading || isInitializing}
                          style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#4CAF50',
                            paddingVertical: 12,
                            borderRadius: 12,
                            opacity: isDownloading || isInitializing ? 0.5 : 1,
                          }}
                        >
                          <Download size={16} color='#FFF' />
                          <Text
                            style={{
                              color: '#FFF',
                              marginLeft: 8,
                              fontWeight: '700',
                              fontSize: 14,
                            }}
                          >
                            Download
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <>
                          <TouchableOpacity
                            onPress={() => handleTestVoice(model)}
                            disabled={
                              isInitializing || isSpeaking || !!speakingModelId
                            }
                            style={{
                              flex: 1,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#FF3B30',
                              paddingVertical: 12,
                              borderRadius: 12,
                              opacity:
                                isInitializing ||
                                isSpeaking ||
                                !!speakingModelId
                                  ? 0.5
                                  : 1,
                            }}
                          >
                            <Volume2 size={16} color={text} />
                            <Text
                              style={{
                                color: text,
                                marginLeft: 8,
                                fontWeight: '700',
                                fontSize: 14,
                              }}
                            >
                              {'Listen'}
                              {/* {isSpeaking ? 'Playing...' : 'Listen'} */}
                            </Text>
                          </TouchableOpacity>

                          {!isCurrent && (
                            <TouchableOpacity
                              onPress={() => handleSetCurrentVoice(model._id)}
                              style={{
                                flex: 1,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#5E5CE6',
                                paddingVertical: 12,
                                borderRadius: 12,
                              }}
                            >
                              <Text
                                style={{
                                  color: '#FFF',
                                  fontWeight: '700',
                                  fontSize: 14,
                                }}
                              >
                                Set Active
                              </Text>
                            </TouchableOpacity>
                          )}

                          <TouchableOpacity
                            onPress={() => handleDeleteVoice(model)}
                            disabled={isCurrent || downloadedCount <= 1}
                            style={{
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'transparent',
                              paddingHorizontal: 16,
                              paddingVertical: 12,
                              borderRadius: 12,
                              opacity:
                                isCurrent || downloadedCount <= 1 ? 0.3 : 1,
                            }}
                          >
                            <Trash2 size={16} color='#FFF' />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}
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
