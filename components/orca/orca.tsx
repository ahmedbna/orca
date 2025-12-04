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

/** Levenshtein distance for fuzzy matching (digit-by-digit to avoid arithmetic mistakes) */
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

/** Base threshold by phrase length */
function baseThresholdFor(phrase: string) {
  const words = normalizeText(phrase).split(' ').filter(Boolean).length;
  if (words <= 2) return 0.6;
  if (words <= 4) return 0.72;
  return 0.78;
}

/** Per-language tuning: returns multiplier/addition applied to base threshold and VAD params */
function languageTuning(langCode: string | undefined) {
  // Defaults tuned for common languages; extend as needed.
  // Returns { thresholdOffset, vadSilenceMs }.
  if (!langCode) return { thresholdOffset: 0, vadSilenceMs: 700 };

  switch (langCode.split('-')[0]) {
    case 'en':
      return { thresholdOffset: 0.02, vadSilenceMs: 600 }; // english often recognized well
    case 'de':
      return { thresholdOffset: 0.0, vadSilenceMs: 700 };
    case 'fr':
      return { thresholdOffset: 0.015, vadSilenceMs: 700 };
    case 'es':
      return { thresholdOffset: 0.01, vadSilenceMs: 650 };
    case 'ar':
      return { thresholdOffset: -0.02, vadSilenceMs: 800 }; // speech recognition for some accents may be lower
    default:
      return { thresholdOffset: 0.0, vadSilenceMs: 700 };
  }
}

/** Whether transcript looks like 'noise' (too short / punctuation only / one-letter) */
function isNoisyTranscript(t: string) {
  if (!t) return true;
  const clean = t
    .replace(/[^A-Za-z0-9\u00C0-\u024F\u0600-\u06FF\s]/g, '')
    .trim();
  if (clean.length < 2) return true;
  // if it is only numbers or single char after cleaning
  if (/^[0-9]{1,2}$/.test(clean)) return true;
  return false;
}

export const Orca = ({ lesson, native, language }: Props) => {
  const insets = useSafeAreaInsets();

  const green = useColor('green');
  const TOTAL_OBSTACLES = lesson.phrases.length;
  const NATIVE_LANGUAGE = LANGUAGES.find((l) => l.code === native);
  const LEARNING_LANGUAGE = LANGUAGES.find((l) => l.code === language);

  // --- Game state (unchanged UI) ---
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

  // --- UI feedback states (kept but we don't change layout) ---
  const [isListening, setIsListening] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);

  const [correctSegmentIndices, setCorrectSegmentIndices] = useState<number[]>(
    []
  );
  const [failedSegmentIndices, setFailedSegmentIndices] = useState<number[]>(
    []
  );

  // --- Animation refs ---
  const obstacleX = useSharedValue(SCREEN_WIDTH);
  const obstacleY = useSharedValue(ORCA_Y);
  const obstacleOpacity = useSharedValue(0);
  const orcaShake = useSharedValue(0);

  // --- Classic refs for timers and state (avoid unnecessary state updates) ---
  const obstacleTimeoutRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const roundTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const isMovingRef = useRef(false);
  const hasHitRef = useRef(false);
  const gameEndedRef = useRef(false);
  const currentPhraseIndexRef = useRef(0);
  const correctPhrasesRef = useRef(0);

  // --- Microphone + VAD refs ---
  const isListeningRef = useRef(false);
  const micStartAttemptedRef = useRef(false); // guard single restart attempt
  const lastInterimTimestamp = useRef<number>(0); // for VAD
  const silenceTimerRef = useRef<number | null>(null);
  const processingPhraseRef = useRef(false); // prevent double-processing the same phrase

  // Per-language tuning
  const tuning = languageTuning(LEARNING_LANGUAGE?.locale);

  // --- Utility: stop timers safely ---
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

  // --- Start / Stop listening (stable single-start approach) ---
  const startListening = useCallback(async () => {
    try {
      if (isListeningRef.current) return;
      micStartAttemptedRef.current = true;

      const perms = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perms.granted) {
        console.warn('Microphone permission denied');
        return;
      }

      // reset exposition texts
      setFinalText('');
      setInterimText('');

      await ExpoSpeechRecognitionModule.start({
        lang: LEARNING_LANGUAGE?.locale || 'de-DE',
        interimResults: true,
        maxAlternatives: 1,
        continuous: true, // key for continuous illusion
      });

      isListeningRef.current = true;
      setIsListening(true);
      setMicReady(true);
      // initialize VAD timestamps
      lastInterimTimestamp.current = Date.now();
    } catch (e: any) {
      console.warn('startListening error', e);
      isListeningRef.current = false;
      setIsListening(false);
      setMicReady(false);
    }
  }, [LEARNING_LANGUAGE]);

  const stopListening = useCallback(async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
    } catch (e) {
      // ignore
    } finally {
      isListeningRef.current = false;
      setIsListening(false);
      setMicReady(false);
      // clear VAD timers
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }
  }, []);

  // --- Microphone events (minimal, robust) ---
  // When SDK emits 'start', we mark listening
  useSpeechRecognitionEvent('start', () => {
    isListeningRef.current = true;
    setIsListening(true);
    setMicReady(true);
    lastInterimTimestamp.current = Date.now();
  });

  // If OS stops the mic unexpectedly, attempt single recovery
  useSpeechRecognitionEvent('end', () => {
    isListeningRef.current = false;
    setIsListening(false);
    setMicReady(false);

    // Attempt one restart only (guarded by micStartAttemptedRef)
    if (!micStartAttemptedRef.current) {
      micStartAttemptedRef.current = true;
      setTimeout(() => {
        startListening().catch(() => {});
      }, 250);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.warn('Speech Recognition Error:', event?.error ?? event);
    isListeningRef.current = false;
    setIsListening(false);
    setMicReady(false);
    // single restart attempt
    if (!micStartAttemptedRef.current) {
      micStartAttemptedRef.current = true;
      setTimeout(() => {
        startListening().catch(() => {});
      }, 400);
    }
  });

  // --- VAD + transcript handling ---
  // Strategy:
  // 1. Use interim results to know user is speaking
  // 2. Reset a silence timer on every interim result
  // 3. When silence timer fires (no speech for vadSilenceMs), evaluate the last interim/final transcript
  // 4. Debounce & guard processing to prevent duplicate marking

  // Evaluate (noise filter + similarity) and mark success if matched
  function evaluateTranscript(transcribed: string) {
    if (!transcribed) return;
    if (processingPhraseRef.current) return;
    if (currentPhraseIndexRef.current >= lesson.phrases.length) return;

    // Basic noise filter
    if (isNoisyTranscript(transcribed)) {
      // ignore short/noisy phrases
      return;
    }

    const targetPhrase = lesson.phrases[currentPhraseIndexRef.current].text;
    const sim = similarity(transcribed, targetPhrase);
    const base = baseThresholdFor(targetPhrase);
    const threshold = Math.max(0, Math.min(1, base + tuning.thresholdOffset)); // clamp 0..1

    // Only accept if similarity meets tuned threshold
    if (sim >= threshold) {
      processingPhraseRef.current = true;
      // slight delay to ensure we don't race with animations
      setTimeout(() => {
        markSuccess();
        processingPhraseRef.current = false;
      }, 50);
    }
  }

  // result events — update interim/final, refresh VAD timer
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results?.[0]?.transcript ?? '';
    const isFinal = !!event.isFinal;

    const now = Date.now();
    lastInterimTimestamp.current = now;

    if (isFinal) {
      setFinalText(transcript);
      setInterimText('');
      // Evaluate immediately for final
      evaluateTranscript(transcript);
    } else {
      setInterimText(transcript);

      // Reset old silence timer and set a new one so we evaluate when speech stops
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      const vadMs = tuning.vadSilenceMs ?? 700;
      silenceTimerRef.current = setTimeout(() => {
        // Use latest interim text to evaluate (user likely stopped speaking)
        evaluateTranscript(transcript);
        silenceTimerRef.current = null;
      }, vadMs) as unknown as number;
    }
  });

  // --- Game timing & animation functions (mostly unchanged) ---
  const startTimer = useCallback(() => {
    stopTimer();
    startTimeRef.current = Date.now();
    setElapsedTime(0);
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current);
    }, 100) as unknown as number;
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
    }, 1000) as unknown as number;
  }, [stopRoundTimer]);

  const cleanup = useCallback(async () => {
    if (obstacleTimeoutRef.current) {
      clearTimeout(obstacleTimeoutRef.current);
      obstacleTimeoutRef.current = null;
    }
    stopTimer();
    stopRoundTimer();
    await stopListening();
    cancelAnimation(obstacleX);
    cancelAnimation(obstacleOpacity);
    cancelAnimation(obstacleY);
    cancelAnimation(orcaShake);
    isMovingRef.current = false;
    hasHitRef.current = false;
    processingPhraseRef.current = false;
    // clear VAD timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, [stopTimer, stopRoundTimer, stopListening]);

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

    isMovingRef.current = false;
    hasHitRef.current = true;
    stopRoundTimer();
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
    }, 100);
  }, [endGame, stopRoundTimer]);

  const spawnObstacle = useCallback(async () => {
    if (gameEndedRef.current) return;

    // Ensure mic is started - startListening is idempotent
    if (!isListeningRef.current) {
      await startListening();
    }

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
    isMovingRef.current = true;

    obstacleY.value = ORCA_Y;
    obstacleX.value = SCREEN_WIDTH;
    obstacleOpacity.value = 1;

    const collisionX = ORCA_X + ORCA_SIZE - 20;

    if (currentPhraseIndexRef.current === 0) {
      startTimer();
    }

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
  }, [endGame, startRoundTimer, startTimer, startListening]);

  const handleCollisionJS = useCallback(() => {
    if (hasHitRef.current || gameEndedRef.current) return;
    hasHitRef.current = true;
    isMovingRef.current = false;

    Vibration.vibrate(200);
    stopRoundTimer();
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
  }, [endGame, spawnObstacle, stopRoundTimer]);

  // startGame ensures mic is started once before gameplay but will NOT aggressively restart it
  const startGame = useCallback(async () => {
    await cleanup();

    // reset single-start guard so we can recover if needed
    micStartAttemptedRef.current = false;
    processingPhraseRef.current = false;

    await startListening(); // start once

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
    }, 500) as unknown as number;
  }, [cleanup, startListening, spawnObstacle]);

  useEffect(() => {
    // cleanup on unmount
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
              {isListening
                ? '🎤 Listening'
                : micReady
                  ? '✅ Mic Ready'
                  : '🚨 Mic Off'}
            </Text>
            <Text style={styles.transcriptLabel}>
              {`${LANGUAGES.find((l) => l.code === native)?.flag || ''} 🗣️ ${LANGUAGES.find((l) => l.code === language)?.flag || ''}`}
            </Text>
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
            }}
          >
            <Text
              style={{
                fontSize: 46,
                color: '#000',
                fontWeight: '800',
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
            <Text style={{ marginTop: 8, color: '#ddd', fontSize: 12 }}>
              (The game will start once the microphone is ready)
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
    // top: 60,
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
