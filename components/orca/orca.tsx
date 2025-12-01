import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Vibration,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Voice, {
  SpeechErrorEvent,
  SpeechResultsEvent,
} from '@react-native-voice/voice';
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

/** Levenshtein distance for fuzzy matching */
function levenshtein(a: string, b: string) {
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  const dp = Array.from({ length: la + 1 }, () =>
    new Array<number>(lb + 1).fill(0)
  );
  for (let i = 0; i <= la; i++) dp[i][0] = i;
  for (let j = 0; j <= lb; j++) dp[0][j] = j;

  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[la][lb];
}

/** Normalize text for comparison */
function normalizeText(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Similarity 0..1 where 1 = identical */
function similarity(a: string, b: string) {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (na.length === 0 && nb.length === 0) return 1;
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 0;
  return 1 - dist / maxLen;
}

function getThresholdFor(phrase: string) {
  const words = normalizeText(phrase).split(' ').filter(Boolean).length;
  if (words <= 2) return 0.6;
  if (words <= 4) return 0.72;
  return 0.78;
}

export const Orca = ({ lesson, native, language }: Props) => {
  const green = useColor('green');
  const muted = useColor('textMuted');

  const TOTAL_OBSTACLES = lesson.phrases.length;
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
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [correctSegmentIndices, setCorrectSegmentIndices] = useState<number[]>(
    []
  );
  const [failedSegmentIndices, setFailedSegmentIndices] = useState<number[]>(
    []
  );

  const obstacleX = useSharedValue(SCREEN_WIDTH);
  const obstacleY = useSharedValue(ORCA_Y);
  const obstacleOpacity = useSharedValue(0);
  const orcaShake = useSharedValue(0);

  const obstacleTimeoutRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const roundTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const isMovingRef = useRef(false);
  const hasHitRef = useRef(false);
  const gameEndedRef = useRef(false);
  const currentPhraseIndexRef = useRef(0);
  const correctPhrasesRef = useRef(0);

  // Initialize Voice
  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = onSpeechPartialResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  async function ensureAudioPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message:
            'This app needs access to your microphone for speech recognition',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }

  async function startListening() {
    try {
      const ok = await ensureAudioPermission();
      if (!ok) {
        console.warn('Microphone permission denied');
        return;
      }
      setFinalText('');
      setInterimText('');

      await Voice.start(language);
      setIsListening(true);
    } catch (e: any) {
      console.warn('startListening error', e);
    }
  }

  async function stopListening() {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (e) {
      console.warn('stopListening error', e);
    }
  }

  function onSpeechResults(e: SpeechResultsEvent) {
    const results = e.value ?? [];
    const text = results.join(' ');
    setFinalText(text);
    checkMatch(text);
  }

  function onSpeechPartialResults(e: any) {
    const partials = e.value ?? [];
    const text = partials.join(' ');
    setInterimText(text);
    checkMatch(text);
  }

  function onSpeechError(e: SpeechErrorEvent) {
    console.warn('Speech error', e);
  }

  function checkMatch(transcribed: string) {
    if (currentPhraseIndexRef.current >= lesson.phrases.length) return;

    const targetPhrase = lesson.phrases[currentPhraseIndexRef.current].text;
    const sim = similarity(transcribed, targetPhrase);
    const threshold = getThresholdFor(targetPhrase);

    console.log(
      `Checking: "${transcribed}" vs "${targetPhrase}" - Similarity: ${sim.toFixed(2)} (threshold: ${threshold})`
    );

    if (sim >= threshold) {
      markSuccess();
    }
  }

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const stopRoundTimer = useCallback(() => {
    if (roundTimerRef.current) {
      clearInterval(roundTimerRef.current);
      roundTimerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    startTimeRef.current = Date.now();
    setElapsedTime(0);
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current);
    }, 100);
  }, [stopTimer]);

  const startRoundTimer = useCallback(() => {
    stopRoundTimer();
    setSecondsLeft(ROUND_SECONDS);
    roundTimerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          stopRoundTimer();
          handleCollisionJS();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, [stopRoundTimer]);

  const cleanup = useCallback(() => {
    if (obstacleTimeoutRef.current) {
      clearTimeout(obstacleTimeoutRef.current);
      obstacleTimeoutRef.current = null;
    }
    stopTimer();
    stopRoundTimer();
    stopListening();
    cancelAnimation(obstacleX);
    cancelAnimation(obstacleOpacity);
    cancelAnimation(obstacleY);
    cancelAnimation(orcaShake);
    isMovingRef.current = false;
    hasHitRef.current = false;
  }, [stopTimer, stopRoundTimer]);

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
    if (
      hasHitRef.current ||
      gameEndedRef.current ||
      currentPhraseIndexRef.current >= lesson.phrases.length
    )
      return;

    console.log(
      'SUCCESS! Clearing obstacle for phrase:',
      currentPhraseIndexRef.current
    );

    isMovingRef.current = false;
    hasHitRef.current = true;
    stopRoundTimer();
    stopListening();
    cancelAnimation(obstacleX);

    currentPhraseIndexRef.current = currentPhraseIndexRef.current + 1;
    setCorrectSegmentIndices((prev) => [
      ...prev,
      currentPhraseIndexRef.current - 1,
    ]);
    correctPhrasesRef.current = correctPhrasesRef.current + 1;

    setCorrectPhrases(correctPhrasesRef.current);
    setCurrentObstacleIndex(null);
    setCurrentObstacleEmoji(null);
    setInterimText('');
    setFinalText('');

    if (currentPhraseIndexRef.current >= TOTAL_OBSTACLES) {
      endGame(true);
      return;
    }

    obstacleY.value = withTiming(SCREEN_HEIGHT + 100, {
      duration: 200,
      easing: Easing.in(Easing.back(2)),
    });
    obstacleOpacity.value = withTiming(0, { duration: 100 });

    setTimeout(() => {
      if (!gameEndedRef.current) {
        spawnObstacle();
      }
    }, 100); // Reduced from 400ms to minimize transition time
  }, [endGame, stopRoundTimer]);

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
    setInterimText('');
    setFinalText('');
    hasHitRef.current = false;
    isMovingRef.current = true; // Set immediately

    obstacleY.value = ORCA_Y;
    obstacleX.value = SCREEN_WIDTH;
    obstacleOpacity.value = 1; // Instant visibility

    const collisionX = ORCA_X + ORCA_SIZE - 20;

    // Start everything immediately
    if (currentPhraseIndexRef.current === 0) {
      startTimer();
    }

    startRoundTimer();
    startListening(); // Start async but don't wait

    // Start obstacle movement immediately
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

    console.log('COLLISION! Failed phrase:', currentPhraseIndexRef.current);

    Vibration.vibrate(200);
    stopRoundTimer();
    stopListening();
    cancelAnimation(obstacleX);

    currentPhraseIndexRef.current = currentPhraseIndexRef.current + 1;
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

      setCurrentObstacleIndex(null);
      setCurrentObstacleEmoji(null);
      setInterimText('');
      setFinalText('');
      obstacleOpacity.value = withTiming(0, { duration: 200 });

      setTimeout(() => {
        if (!gameEndedRef.current) {
          if (currentPhraseIndexRef.current >= TOTAL_OBSTACLES) {
            endGame(true);
          } else {
            spawnObstacle();
          }
        }
      }, 100); // Reduced from 600ms to minimize transition time
      return newLives;
    });

    orcaShake.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }, [endGame, spawnObstacle, stopRoundTimer]);

  const startGame = useCallback(() => {
    cleanup();

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
    setFinalText('');
    setSecondsLeft(ROUND_SECONDS);
    setGameState('playing');

    obstacleX.value = SCREEN_WIDTH;
    obstacleOpacity.value = 0;
    orcaShake.value = 0;

    obstacleTimeoutRef.current = setTimeout(() => {
      spawnObstacle();
    }, 500); // Reduced from 1000ms for faster start
  }, [cleanup, spawnObstacle]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

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
        <View style={styles.headerContainer}>
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
              {isListening ? '🎤 Listening' : '🚨 Ready'}
            </Text>
            <Text style={styles.transcriptLabel}>
              {`${LANGUAGES.find((l) => l.code === native)?.flag || ''} 🗣️ ${LANGUAGES.find((l) => l.code === language)?.flag || ''}`}
            </Text>
            {/* <Text style={styles.timerBadge}>{secondsLeft}s</Text> */}
          </View>

          <View>
            <Progress
              total={TOTAL_OBSTACLES}
              correctSegments={correctSegmentIndices}
              failedSegments={failedSegmentIndices}
              height={16}
            />
          </View>
        </View>

        {gameState === 'playing' && currentObstacleIndex !== null && (
          <View
            style={{
              paddingHorizontal: 26,
              position: 'absolute',
              top: PHRASE_TOP,
              // alignSelf: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 46,
                color: '#000',
                fontWeight: '800',
                // textAlign: 'center',
              }}
            >
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
                !interimText &&
                  !finalText && {
                    color: 'rgba(0, 0, 40, 0.4)',
                    fontStyle: 'italic',
                  },
              ]}
            >
              {finalText ||
                interimText ||
                `Start ${LANGUAGES.find((l) => l.code === language)?.name} speaking..`}
            </Text>
          </View>
        )}

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

        {gameState === 'idle' && (
          <View style={styles.overlay}>
            <Text style={styles.titleText}>🐋 Orca Swim 🐋</Text>
            <Text style={styles.instructionText}>
              Speech Recognition Challenge!
            </Text>
            <Pressable style={[styles.startButton]} onPress={startGame}>
              <Text style={styles.startButtonText}>TAP TO START</Text>
            </Pressable>
            <Text style={styles.subText}>
              Pronounce each phrase correctly{'\n'}to clear obstacles and win!
            </Text>
          </View>
        )}

        {gameState === 'won' && (
          <View style={styles.overlay}>
            <Text style={styles.winText}>🎉 YOU WON! 🎉</Text>
            <Text style={styles.finalTime}>⏱️ {formatTime(finalTime)}</Text>
            <Text style={styles.finalScore}>
              Correct: {correctPhrases}/{TOTAL_OBSTACLES}
            </Text>
            <Text style={styles.livesLeft}>Lives remaining: {lives}</Text>
            <Pressable style={styles.startButton} onPress={startGame}>
              <Text style={styles.startButtonText}>PLAY AGAIN</Text>
            </Pressable>
          </View>
        )}

        {gameState === 'lost' && (
          <View style={styles.overlay}>
            <Text style={styles.loseText}>💔 GAME OVER 💔</Text>
            <Text style={styles.finalTime}>⏱️ {formatTime(finalTime)}</Text>
            <Text style={styles.finalScore}>
              Correct: {correctPhrases}/{TOTAL_OBSTACLES}
            </Text>
            <Pressable style={styles.startButton} onPress={startGame}>
              <Text style={styles.startButtonText}>TRY AGAIN</Text>
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
    top: 60,
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
  timerContainer: {
    minWidth: 100,
    alignItems: 'center',
  },
  scoreValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  transcriptContainer: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
  },
  transcriptCard: {
    backgroundColor: DARK_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transcriptLabel: {
    color: BRAND_COLOR,
    fontSize: 14,
    fontWeight: '700',
  },
  timerBadge: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    backgroundColor: 'rgba(255, 205, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  targetText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
    marginBottom: 8,
  },

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
  livesLeft: { color: BRAND_COLOR, fontSize: 16, marginBottom: 24 },
});
