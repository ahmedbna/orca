import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Dimensions, Pressable, StyleSheet, Vibration } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Progress } from '@/components/orca/progress';
import { Fish } from '@/components/orca/fish';
import { Clouds } from '@/components/orca/clouds';
import { Seafloor } from '@/components/orca/seafloor';
import { Seaweed } from '@/components/orca/seaweed';
import { Jellyfish } from '@/components/orca/jellyfish';
import { formatTime } from '@/lib/format-time';
import { LANGUAGES } from '@/constants/languages';
import { useColor } from '@/hooks/useColor';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PHRASE_TOP = SCREEN_HEIGHT * 0.4;
const ORCA_TOP = SCREEN_HEIGHT * 0.7;
const ORCA_SIZE = 150;
const OBSTACLE_SIZE = 60;
const ORCA_X = 0;
const ORCA_Y = SCREEN_HEIGHT / 2 - (ORCA_SIZE * 0.6) / 2;
const BRAND_COLOR = '#FFCD00';
const DARK_COLOR = '#000000';
const OBSTACLE_TYPES = ['🪸', '🦑', '🦈', '⚓', '🪼', '🐡'];
const ROUND_SECONDS = 5;

type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

type Props = {
  native: string;
  language: string;
  lesson: {
    order: number;
    title: string;
    phrases: {
      order: number;
      text: string;
      dictionary: { language: string; text: string }[];
    }[];
  };
};

/** --- UTILS --- */

function levenshtein(a: string, b: string) {
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  const dp: number[][] = Array.from({ length: la + 1 }, () =>
    new Array<number>(lb + 1).fill(0)
  );
  for (let i = 0; i <= la; i++) dp[i][0] = i;
  for (let j = 0; j <= lb; j++) dp[0][j] = j;

  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const v1 = dp[i - 1][j] + 1;
      const v2 = dp[i][j - 1] + 1;
      const v3 = dp[i - 1][j - 1] + cost;
      dp[i][j] = Math.min(v1, Math.min(v2, v3));
    }
  }
  return dp[la][lb];
}

function normalizeText(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarity(a: string, b: string) {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (na.length === 0 && nb.length === 0) return 1;
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 0;
  return 1 - dist / maxLen;
}

function baseThresholdFor(phrase: string) {
  const words = normalizeText(phrase).split(' ').filter(Boolean).length;
  if (words <= 2) return 0.6;
  if (words <= 4) return 0.72;
  return 0.78;
}

function languageTuning(langCode: string | undefined) {
  if (!langCode) return { thresholdOffset: 0 };
  const base = langCode.split('-')[0];
  switch (base) {
    case 'en':
      return { thresholdOffset: 0.02 };
    case 'de':
      return { thresholdOffset: 0.0 };
    case 'fr':
      return { thresholdOffset: 0.015 };
    case 'es':
      return { thresholdOffset: 0.01 };
    case 'ar':
      return { thresholdOffset: -0.02 };
    default:
      return { thresholdOffset: 0.0 };
  }
}

export const Orca = ({ lesson, native, language }: Props) => {
  const insets = useSafeAreaInsets();
  const green = useColor('green');

  const TOTAL_OBSTACLES = lesson.phrases.length;
  const NATIVE_LANGUAGE = LANGUAGES.find((l) => l.code === native);
  const LEARNING_LANGUAGE = LANGUAGES.find((l) => l.code === language);
  const tuning = languageTuning(LEARNING_LANGUAGE?.locale);

  // --- GAME STATE ---
  const [gameState, setGameState] = useState<GameStatus>('idle');
  const [currentObstacleIndex, setCurrentObstacleIndex] = useState<
    number | null
  >(null);
  const [currentObstacleEmoji, setCurrentObstacleEmoji] = useState<
    string | null
  >(null);
  const [correctPhrases, setCorrectPhrases] = useState(0);
  const [lives, setLives] = useState(3);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [finalTime, setFinalTime] = useState(0);

  // --- UI STATE ---
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState(''); // Kept for logic, though purely visual in this continuous mode
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [correctSegmentIndices, setCorrectSegmentIndices] = useState<number[]>(
    []
  );
  const [failedSegmentIndices, setFailedSegmentIndices] = useState<number[]>(
    []
  );
  const [isRecognizing, setIsRecognizing] = useState(false);

  // --- ANIMATION VALUES ---
  const obstacleX = useSharedValue(SCREEN_WIDTH);
  const obstacleY = useSharedValue(ORCA_Y);
  const obstacleOpacity = useSharedValue(0);
  const orcaShake = useSharedValue(0);

  // --- REFS ---
  const timerIntervalRef = useRef<number | null>(null);
  const roundTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const isMovingRef = useRef(false);
  const hasHitRef = useRef(false);
  const gameEndedRef = useRef(false);
  const currentPhraseIndexRef = useRef(0);
  const correctPhrasesRef = useRef(0);
  const processingSuccessRef = useRef(false);

  // -------------------------------------------------------------------------
  //  STT LOGIC (Cleaned Up)
  // -------------------------------------------------------------------------

  const startListening = async () => {
    try {
      const permissions =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      if (!permissions.granted) {
        console.warn('Permissions not granted', permissions);
        return;
      }

      await ExpoSpeechRecognitionModule.start({
        lang: LEARNING_LANGUAGE?.locale || 'en-US',
        interimResults: true,
        maxAlternatives: 1,
        continuous: true,
        requiresOnDeviceRecognition: false,
        addsPunctuation: false,
        androidIntentOptions: {
          EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 10000,
          EXTRA_MASK_OFFENSIVE_WORDS: false,
        },
        androidRecognitionServicePackage: 'com.google.android.tts',
        iosTaskHint: 'unspecified',
        iosCategory: {
          mode: 'measurement',
          category: 'record',
          categoryOptions: ['defaultToSpeaker', 'allowBluetooth'],
        },
        iosVoiceProcessingEnabled: true,
      });
    } catch (e) {
      console.warn('Start listening failed', e);
    }
  };

  const stopListening = async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      console.warn('Stop listening failed', error);
    }
  };

  useSpeechRecognitionEvent('start', () => {
    console.log('Speech recognition started');
    setIsRecognizing(true);
  });

  useSpeechRecognitionEvent('end', () => {
    console.log('Speech recognition ended');
    setIsRecognizing(false);
  });

  useSpeechRecognitionEvent('error', () => {
    console.warn('Speech recognition error occurred');
  });

  useSpeechRecognitionEvent('result', (event) => {
    if (gameEndedRef.current || hasHitRef.current) return;

    const transcript = event.results?.[0]?.transcript;
    if (!transcript) return;

    setInterimText(transcript);

    // Process immediately (no wait for silence)
    processTranscript(transcript);
  });

  const processTranscript = (text: string) => {
    if (processingSuccessRef.current) return; // Already succeeded this round
    if (currentPhraseIndexRef.current >= lesson.phrases.length) return;

    // Basic noise filtering
    const clean = text
      .replace(/[^A-Za-z0-9\u00C0-\u024F\u0600-\u06FF\s]/g, '')
      .trim();
    if (clean.length < 2) return;

    const targetPhrase = lesson.phrases[currentPhraseIndexRef.current].text;
    const sim = similarity(text, targetPhrase);
    const base = baseThresholdFor(targetPhrase);
    const threshold = Math.max(0, Math.min(1, base + tuning.thresholdOffset));

    if (sim >= threshold) {
      processingSuccessRef.current = true;
      markSuccess();
    }
  };

  // -------------------------------------------------------------------------
  //  GAME LOGIC
  // -------------------------------------------------------------------------

  const startTimer = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    startTimeRef.current = Date.now();
    setElapsedTime(0);
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current);
    }, 100) as unknown as number;
  }, []);

  const startRoundTimer = useCallback(() => {
    if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    setSecondsLeft(ROUND_SECONDS);
    roundTimerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (roundTimerRef.current) clearInterval(roundTimerRef.current);
          handleCollisionJS();
          return 0;
        }
        return s - 1;
      });
    }, 1000) as unknown as number;
  }, []);

  const stopTimers = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (roundTimerRef.current) clearInterval(roundTimerRef.current);
  }, []);

  const cleanup = useCallback(async () => {
    stopTimers();
    await stopListening();

    cancelAnimation(obstacleX);
    cancelAnimation(obstacleOpacity);
    cancelAnimation(obstacleY);
    cancelAnimation(orcaShake);

    isMovingRef.current = false;
    hasHitRef.current = false;
  }, [stopTimers]);

  const endGame = useCallback(
    (won: boolean) => {
      if (gameEndedRef.current) return;
      gameEndedRef.current = true;

      const ft = Date.now() - startTimeRef.current;
      setFinalTime(ft);
      cleanup();

      setCurrentObstacleIndex(null);
      setCurrentObstacleEmoji(null);
      obstacleOpacity.value = 0;
      setGameState(won ? 'won' : 'lost');
    },
    [cleanup]
  );

  const markSuccess = useCallback(() => {
    if (hasHitRef.current || gameEndedRef.current) return;

    isMovingRef.current = false;
    hasHitRef.current = true;
    if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    cancelAnimation(obstacleX);

    currentPhraseIndexRef.current += 1;
    setCorrectSegmentIndices((prev) => [
      ...prev,
      currentPhraseIndexRef.current - 1,
    ]);
    correctPhrasesRef.current += 1;
    setCorrectPhrases(correctPhrasesRef.current);

    setCurrentObstacleIndex(null);
    setCurrentObstacleEmoji(null);
    setInterimText('');
    setFinalText(''); // Clear text

    if (currentPhraseIndexRef.current >= TOTAL_OBSTACLES) {
      endGame(true);
      return;
    }

    // Animation: Orca passes obstacle (move obstacle down)
    obstacleY.value = withTiming(SCREEN_HEIGHT + 100, {
      duration: 200,
      easing: Easing.in(Easing.back(2)),
    });
    obstacleOpacity.value = withTiming(0, { duration: 100 });

    setTimeout(() => {
      if (!gameEndedRef.current) spawnObstacle();
    }, 250); // Slight delay before next spawn
  }, [endGame]);

  const spawnObstacle = useCallback(() => {
    if (gameEndedRef.current) return;

    const nextIndex = currentPhraseIndexRef.current;
    if (nextIndex >= lesson.phrases.length) {
      endGame(true);
      return;
    }

    const emoji =
      OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
    setCurrentObstacleIndex(nextIndex);
    setCurrentObstacleEmoji(emoji);

    // Reset state for new round
    setInterimText('');
    setFinalText('');
    processingSuccessRef.current = false;
    hasHitRef.current = false;
    isMovingRef.current = true;

    obstacleY.value = ORCA_Y;
    obstacleX.value = SCREEN_WIDTH;
    obstacleOpacity.value = 1;

    const collisionX = ORCA_X + ORCA_SIZE - 20;

    if (currentPhraseIndexRef.current === 0) startTimer();
    startRoundTimer();

    obstacleX.value = withTiming(
      collisionX,
      { duration: ROUND_SECONDS * 1000, easing: Easing.linear },
      (finished) => {
        if (finished && isMovingRef.current && !gameEndedRef.current) {
          scheduleOnRN(handleCollisionJS);
        }
      }
    );
  }, [endGame, startRoundTimer, startTimer]);

  const handleCollisionJS = useCallback(() => {
    if (hasHitRef.current || gameEndedRef.current) return;

    hasHitRef.current = true;
    isMovingRef.current = false;
    Vibration.vibrate(200);
    if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    cancelAnimation(obstacleX);

    currentPhraseIndexRef.current += 1;
    setFailedSegmentIndices((prev) => [
      ...prev,
      currentPhraseIndexRef.current - 1,
    ]);

    setLives((prev) => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        endGame(false);
        return 0;
      }

      // Reset for next round
      setCurrentObstacleIndex(null);
      setCurrentObstacleEmoji(null);
      setInterimText('');
      obstacleOpacity.value = withTiming(0, { duration: 200 });

      setTimeout(() => {
        if (!gameEndedRef.current) {
          if (currentPhraseIndexRef.current >= TOTAL_OBSTACLES) endGame(true);
          else spawnObstacle();
        }
      }, 100);
      return newLives;
    });

    orcaShake.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }, [endGame, spawnObstacle]);

  const startGame = async () => {
    // Reset Game State
    await cleanup();

    gameEndedRef.current = false;
    currentPhraseIndexRef.current = 0;
    correctPhrasesRef.current = 0;
    setCorrectSegmentIndices([]);
    setFailedSegmentIndices([]);
    setCorrectPhrases(0);
    setLives(3);
    setCurrentObstacleIndex(null);
    setCurrentObstacleEmoji(null);
    setElapsedTime(0);
    setFinalTime(0);
    setInterimText('');
    setSecondsLeft(ROUND_SECONDS);
    setGameState('playing');
    processingSuccessRef.current = false;

    obstacleX.value = SCREEN_WIDTH;
    obstacleOpacity.value = 0;
    orcaShake.value = 0;

    await startListening();
    spawnObstacle();
  };

  useEffect(() => {
    // This return function now only runs when the component unmounts (navigates away)
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- STYLES ---
  const orcaContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: orcaShake.value }],
  }));

  const obstacleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: obstacleX.value },
      { translateY: obstacleY.value - ORCA_Y },
    ],
    opacity: obstacleOpacity.value,
  }));

  const getTranslation = (phraseIndex: number): string => {
    const phrase = lesson.phrases[phraseIndex];
    const translation = phrase.dictionary.find((d) => d.language === native);
    return translation?.text || phrase.text;
  };

  return (
    <View style={styles.container}>
      <View style={styles.background} />
      <Clouds />
      <Jellyfish />
      <Seaweed />
      <Seafloor />

      <View style={styles.uiOverlay}>
        {/* Header */}
        <View style={[styles.headerContainer, { top: insets.top }]}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text variant='title' style={{ color: '#FFF' }}>
                Orca
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.scoreLabel}>TIME</Text>
              <View style={styles.timerContainer}>
                <Text style={styles.scoreValue}>{formatTime(elapsedTime)}</Text>
              </View>
            </View>
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'flex-end',
                flexDirection: 'row',
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 22 }}>❤️</Text>
              <Text variant='title' style={{ fontSize: 22, color: '#FFF' }}>
                {lives}
              </Text>
            </View>
          </View>

          <View style={styles.transcriptHeader}>
            <Text style={styles.transcriptLabel}>
              {isRecognizing ? '🎤 Listening' : '⏳ Initializing...'}
            </Text>
            <Text style={styles.transcriptLabel}>
              {`${NATIVE_LANGUAGE?.flag || ''} 🗣️ ${LEARNING_LANGUAGE?.flag || ''}`}
            </Text>
          </View>

          <Progress
            total={TOTAL_OBSTACLES}
            correctSegments={correctSegmentIndices}
            failedSegments={failedSegmentIndices}
            height={16}
          />
        </View>

        {/* Game UI */}
        {gameState === 'playing' && currentObstacleIndex !== null && (
          <View
            style={{
              paddingHorizontal: 26,
              position: 'absolute',
              top: PHRASE_TOP,
            }}
          >
            <Text style={{ fontSize: 46, color: '#000', fontWeight: '800' }}>
              {getTranslation(currentObstacleIndex)}
            </Text>

            <Text
              style={[
                {
                  color: green,
                  fontSize: 18,
                  fontWeight: '600',
                  lineHeight: 26,
                },
                !interimText && {
                  color: 'rgba(0, 0, 40, 0.4)',
                  fontStyle: 'italic',
                },
              ]}
            >
              {interimText || `Say it in ${LEARNING_LANGUAGE?.name}...`}
            </Text>
          </View>
        )}

        {/* Orca & Obstacles */}
        {gameState === 'playing' && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: ORCA_X,
                zIndex: 10,
                justifyContent: 'center',
                alignItems: 'center',
                top: ORCA_TOP - (ORCA_SIZE * 0.6) / 2,
              },
              orcaContainerStyle,
            ]}
          >
            <Fish style={{ width: ORCA_SIZE, height: ORCA_SIZE * 0.6 }} />
          </Animated.View>
        )}

        {currentObstacleEmoji && (
          <Animated.View
            style={[
              styles.obstacle,
              obstacleStyle,
              { top: ORCA_TOP - OBSTACLE_SIZE / 2 },
            ]}
          >
            <Text style={styles.obstacleEmoji}>{currentObstacleEmoji}</Text>
          </Animated.View>
        )}

        {/* Screens */}
        {gameState === 'idle' && (
          <View style={styles.overlay}>
            <Text style={styles.titleText}>🐋 Orca Swim 🐋</Text>
            <Text style={styles.instructionText}>
              Speech Recognition Challenge!
            </Text>
            <Pressable style={styles.startButton} onPress={startGame}>
              <Text style={styles.startButtonText}>TAP TO START</Text>
            </Pressable>
            <Text style={styles.subText}>
              Pronounce each phrase correctly{'\n'}to clear obstacles and win!
            </Text>
          </View>
        )}

        {(gameState === 'won' || gameState === 'lost') && (
          <View style={styles.overlay}>
            <Text
              style={gameState === 'won' ? styles.winText : styles.loseText}
            >
              {gameState === 'won' ? '🎉 YOU WON! 🎉' : '💔 GAME OVER 💔'}
            </Text>
            <Text style={styles.finalTime}>⏱️ {formatTime(finalTime)}</Text>
            <Text style={styles.finalScore}>
              Correct: {correctPhrases}/{TOTAL_OBSTACLES}
            </Text>
            <Pressable style={styles.startButton} onPress={startGame}>
              <Text style={styles.startButtonText}>
                {gameState === 'won' ? 'PLAY AGAIN' : 'TRY AGAIN'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BRAND_COLOR,
  },
  obstacle: {
    position: 'absolute',
    width: OBSTACLE_SIZE,
    height: OBSTACLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  obstacleEmoji: { fontSize: 50 },
  uiOverlay: { ...StyleSheet.absoluteFillObject, pointerEvents: 'box-none' },
  headerContainer: {
    backgroundColor: '#000',
    position: 'absolute',
    left: 16,
    right: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 36,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scoreLabel: { color: BRAND_COLOR, fontSize: 11, fontWeight: '600' },
  timerContainer: { minWidth: 100, alignItems: 'center' },
  scoreValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transcriptLabel: { color: BRAND_COLOR, fontSize: 14, fontWeight: '700' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  titleText: {
    color: BRAND_COLOR,
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  instructionText: { color: '#fff', fontSize: 18, marginBottom: 24 },
  startButton: {
    backgroundColor: BRAND_COLOR,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 24,
    marginBottom: 20,
  },
  startButtonText: { color: DARK_COLOR, fontSize: 18, fontWeight: 'bold' },
  subText: { color: '#aaa', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  winText: {
    color: '#4ade80',
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  loseText: {
    color: '#ef4444',
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  finalTime: {
    color: BRAND_COLOR,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  finalScore: { color: '#fff', fontSize: 22, marginBottom: 8 },
});
