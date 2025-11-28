import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Dimensions, Pressable, StyleSheet, Vibration } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Progress } from '@/components/ui/progress';
import { Fish } from '@/components/orca/fish';
import { Clouds } from '@/components/orca/clouds';
import { Seafloor } from '@/components/orca/seafloor';
import { Seaweed } from '@/components/orca/seaweed';
import { Jellyfish } from '@/components/orca/jellyfish';
import { formatTime } from '@/lib/format-time';
import { LANGUAGES } from '@/constants/languages';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ORCA_SIZE = 150;
const OBSTACLE_SIZE = 60;
const ORCA_X = 0;
const ORCA_Y = SCREEN_HEIGHT / 2 - (ORCA_SIZE * 0.6) / 2;

const BRAND_COLOR = '#FFCD00';
const DARK_COLOR = '#000000';

const OBSTACLE_TYPES = ['🪸', '🦑', '🦈', '⚓', '🪼', '🐡'];

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

export const Orca = ({ lesson, native, language }: Props) => {
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

  const obstacleX = useSharedValue(SCREEN_WIDTH + OBSTACLE_SIZE);
  const obstacleY = useSharedValue(ORCA_Y);
  const obstacleOpacity = useSharedValue(0);
  const orcaShake = useSharedValue(0);

  const obstacleTimeoutRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const isMovingRef = useRef(false);
  const hasHitRef = useRef(false);
  const gameEndedRef = useRef(false);
  const currentPhraseIndexRef = useRef(0);
  const correctPhrasesRef = useRef(0);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
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

  const cleanup = useCallback(() => {
    if (obstacleTimeoutRef.current) {
      clearTimeout(obstacleTimeoutRef.current);
      obstacleTimeoutRef.current = null;
    }
    stopTimer();
    cancelAnimation(obstacleX);
    cancelAnimation(obstacleOpacity);
    cancelAnimation(obstacleY);
    cancelAnimation(orcaShake);
    isMovingRef.current = false;
    hasHitRef.current = false;
  }, [stopTimer]);

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

  const clearObstacle = useCallback(() => {
    if (
      hasHitRef.current ||
      gameEndedRef.current ||
      currentPhraseIndexRef.current >= lesson.phrases.length
    )
      return;

    console.log('Clearing obstacle for phrase:', currentPhraseIndexRef.current);
    isMovingRef.current = false;
    hasHitRef.current = true;
    cancelAnimation(obstacleX);

    // Increment both phrase index and correct phrases count
    currentPhraseIndexRef.current = currentPhraseIndexRef.current + 1;
    correctPhrasesRef.current = correctPhrasesRef.current + 1;

    setCorrectPhrases(correctPhrasesRef.current);
    setCurrentObstacleIndex(null);
    setCurrentObstacleEmoji(null);

    if (currentPhraseIndexRef.current >= TOTAL_OBSTACLES) {
      endGame(true);
      return;
    }

    obstacleY.value = withTiming(SCREEN_HEIGHT + 100, {
      duration: 400,
      easing: Easing.in(Easing.back(2)),
    });
    obstacleOpacity.value = withTiming(0, { duration: 300 });

    setTimeout(() => {
      if (!gameEndedRef.current) {
        spawnObstacle();
      }
    }, 500);
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
    hasHitRef.current = false;
    isMovingRef.current = true;

    obstacleY.value = ORCA_Y;
    obstacleX.value = SCREEN_WIDTH + OBSTACLE_SIZE;
    obstacleOpacity.value = withTiming(1, { duration: 200 });

    const collisionX = ORCA_X + ORCA_SIZE - 20;
    obstacleX.value = withTiming(
      collisionX,
      { duration: 5000, easing: Easing.linear },
      (finished) => {
        if (finished && isMovingRef.current && !gameEndedRef.current) {
          runOnJS(handleCollisionJS)();
        }
      }
    );
  }, [endGame]);

  const handleCollisionJS = useCallback(() => {
    if (hasHitRef.current || gameEndedRef.current) return;
    hasHitRef.current = true;
    isMovingRef.current = false;

    console.log(
      'Collision! Failed to clear phrase:',
      currentPhraseIndexRef.current
    );

    Vibration.vibrate(200);
    cancelAnimation(obstacleX);

    // Move to next phrase WITHOUT incrementing correct phrases count
    currentPhraseIndexRef.current = currentPhraseIndexRef.current + 1;

    setLives((prev) => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        endGame(false);
        return 0;
      }

      // Clear current obstacle and spawn next one
      setCurrentObstacleIndex(null);
      setCurrentObstacleEmoji(null);
      obstacleOpacity.value = withTiming(0, { duration: 200 });

      setTimeout(() => {
        if (!gameEndedRef.current) {
          if (currentPhraseIndexRef.current >= TOTAL_OBSTACLES) {
            endGame(true);
          } else {
            spawnObstacle();
          }
        }
      }, 800);
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

  const startGame = useCallback(() => {
    cleanup();

    gameEndedRef.current = false;
    currentPhraseIndexRef.current = 0;
    correctPhrasesRef.current = 0;
    setGameState('playing');
    setCorrectPhrases(0);
    setLives(3);
    setCurrentObstacleIndex(null);
    setCurrentObstacleEmoji(null);
    setElapsedTime(0);
    setFinalTime(0);

    obstacleX.value = SCREEN_WIDTH + OBSTACLE_SIZE;
    obstacleOpacity.value = 0;
    orcaShake.value = 0;

    startTimer();

    obstacleTimeoutRef.current = setTimeout(() => {
      spawnObstacle();
    }, 1000);
  }, [cleanup, spawnObstacle, startTimer]);

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

      {gameState === 'playing' && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: ORCA_X,
              zIndex: 10,
              justifyContent: 'center',
              alignItems: 'center',
              top: SCREEN_HEIGHT * 0.6 - (ORCA_SIZE * 0.6) / 2,
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
            { top: SCREEN_HEIGHT * 0.6 - OBSTACLE_SIZE / 2 },
          ]}
        >
          <Text style={styles.obstacleEmoji}>{currentObstacleEmoji}</Text>
        </Animated.View>
      )}

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
          <View>
            <Progress
              height={16}
              value={Math.floor((correctPhrases / TOTAL_OBSTACLES) * 100)}
            />
          </View>
        </View>

        {gameState === 'playing' && currentObstacleIndex !== null && (
          <View
            style={{
              position: 'absolute',
              top: SCREEN_HEIGHT * 0.28,
              alignSelf: 'center',
              padding: 20,
            }}
          >
            <Text
              style={{
                fontSize: 46,
                fontWeight: '800',
                textAlign: 'center',
                color: '#000',
              }}
            >
              {getTranslation(currentObstacleIndex)}
            </Text>
          </View>
        )}

        {gameState === 'playing' && (
          <View style={styles.transcriptContainer}>
            <View style={styles.transcriptCard}>
              <View style={styles.transcriptHeader}>
                <Text style={styles.transcriptLabel}>
                  {true ? '🎤 Listening' : '⏸️ Ready'}
                  {` ${LANGUAGES.find((l) => l.code === language)?.flag}`}
                </Text>
              </View>
              <Text
                style={[
                  // styles.transcriptText,
                  styles.transcriptPlaceholder,
                ]}
              >
                {'Start speaking...'}
              </Text>
            </View>
          </View>
        )}

        {gameState === 'idle' && (
          <View style={styles.overlay}>
            <Text style={styles.titleText}>🐋 Orca Swim 🐋</Text>
            <Text style={styles.instructionText}>Learning Challenge!</Text>
            <Pressable style={[styles.startButton]} onPress={startGame}>
              <Text style={styles.startButtonText}>TAP TO START</Text>
            </Pressable>
            <Text style={styles.subText}>
              Press the button to clear{'\n'}each obstacle and learn phrases!
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
    zIndex: 5,
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
    paddingVertical: 20,
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
  actionContainer: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
  },
  clearButton: {
    backgroundColor: '#4ade80',
    paddingHorizontal: 48,
    paddingVertical: 20,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  clearButtonText: {
    color: DARK_COLOR,
    fontSize: 20,
    fontWeight: 'bold',
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
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  transcriptLabel: {
    color: BRAND_COLOR,
    fontSize: 14,
    fontWeight: '700',
  },
  targetText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  transcriptText: {
    color: '#4ade80',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
  },
  transcriptPlaceholder: {
    color: '#666',
    fontStyle: 'italic',
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
