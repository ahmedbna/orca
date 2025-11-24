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
import { useAudioPlayer } from 'expo-audio';
const audioSource = require('../../assets/music/orca.mp3');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ORCA_SIZE = 150;
const OBSTACLE_SIZE = 60;
const TOTAL_OBSTACLES = 15;
const ORCA_X = 0;
const ORCA_Y = SCREEN_HEIGHT / 2 - (ORCA_SIZE * 0.6) / 2;

const BRAND_COLOR = '#FFCD00';
const DARK_COLOR = '#000000';

const OBSTACLE_TYPES = ['🪸', '🦑', '🦈', '⚓', '🪼', '🐡'];

const LESSON = {
  order: 1,
  title: 'Begrüßungen',
  phrases: [
    { order: 1, text: 'Hallo!' },
    { order: 2, text: 'Guten Morgen' },
    { order: 3, text: 'Guten Tag, Auf Wiedersehen, Herr Klein' },
  ],
};

type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

const NATIVE_LANGUAGE = 'en';

export const Orca = () => {
  const player = useAudioPlayer(audioSource);

  const [gameState, setGameState] = useState<GameStatus>('idle');
  const [currentObstacle, setCurrentObstacle] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [canClear, setCanClear] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [finalTime, setFinalTime] = useState(0);

  const obstacleX = useSharedValue(SCREEN_WIDTH + OBSTACLE_SIZE);
  const obstacleY = useSharedValue(ORCA_Y);
  const obstacleOpacity = useSharedValue(0);
  const orcaShake = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  const obstacleTimeoutRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const isMovingRef = useRef(false);
  const hasHitRef = useRef(false);
  const gameEndedRef = useRef(false);
  const scoreRef = useRef(0);

  // Handle audio playback based on game state
  useEffect(() => {
    const handleAudio = async () => {
      if (!player) return;

      if (gameState === 'playing' && player.isLoaded) {
        // Start music when game starts
        try {
          if (player.playing) {
            await player.seekTo(0); // Reset to start
          } else {
            await player.play();
          }
        } catch (error) {
          console.error('Error playing audio:', error);
        }
      } else {
        // Stop music when game is not playing
        try {
          if (player.playing) {
            await player.pause();
            await player.seekTo(0); // Reset to start for next play
          }
        } catch (error) {
          console.error('Error stopping audio:', error);
        }
      }
    };

    handleAudio();
  }, [gameState, player]);

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
      setCurrentObstacle(null);
      setCanClear(false);
      obstacleOpacity.value = 0;
      setGameState(won ? 'won' : 'lost');
    },
    [cleanup]
  );

  const spawnObstacle = useCallback(() => {
    if (gameEndedRef.current) return;

    const type =
      OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
    setCurrentObstacle(type);
    setCanClear(true);
    hasHitRef.current = false;
    isMovingRef.current = true;

    // Reset obstacle position
    obstacleY.value = ORCA_Y;
    obstacleX.value = SCREEN_WIDTH + OBSTACLE_SIZE;
    obstacleOpacity.value = withTiming(1, { duration: 200 });

    const collisionX = ORCA_X + ORCA_SIZE - 20;
    obstacleX.value = withTiming(
      collisionX,
      { duration: 3000, easing: Easing.linear },
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

    // Vibrate on collision
    Vibration.vibrate(200);

    // Cancel the current obstacle animation
    cancelAnimation(obstacleX);

    setLives((prev) => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        endGame(false);
        return 0;
      }
      // Spawn next obstacle immediately after collision (if game continues)
      setTimeout(() => {
        if (!gameEndedRef.current) {
          spawnObstacle();
        }
      }, 300); // Small delay for shake animation to be visible
      return newLives;
    });

    orcaShake.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );

    setCurrentObstacle(null);
    setCanClear(false);
    obstacleOpacity.value = withTiming(0, { duration: 200 });
  }, [endGame, spawnObstacle]);

  const clearObstacle = useCallback(() => {
    if (
      !canClear ||
      !currentObstacle ||
      hasHitRef.current ||
      gameEndedRef.current
    )
      return;

    isMovingRef.current = false;
    hasHitRef.current = true; // Prevent collision handling
    cancelAnimation(obstacleX);

    const newScore = scoreRef.current + 1;
    scoreRef.current = newScore;
    setScore(newScore);
    setCanClear(false);
    setCurrentObstacle(null);

    // Check for win condition
    if (newScore >= TOTAL_OBSTACLES) {
      endGame(true);
      return;
    }

    obstacleY.value = withTiming(SCREEN_HEIGHT + 100, {
      duration: 400,
      easing: Easing.in(Easing.back(2)),
    });
    obstacleOpacity.value = withTiming(0, { duration: 300 });

    // Spawn next obstacle immediately
    setTimeout(() => {
      if (!gameEndedRef.current) {
        spawnObstacle();
      }
    }, 100);
  }, [canClear, currentObstacle, endGame, spawnObstacle]);

  const handleButtonPress = useCallback(() => {
    buttonScale.value = withSequence(
      withTiming(0.9, { duration: 50 }),
      withTiming(1, { duration: 100 })
    );

    if (gameState === 'idle' || gameState === 'won' || gameState === 'lost') {
      startGame();
      return;
    }

    if (gameState === 'playing') {
      clearObstacle();
    }
  }, [gameState, clearObstacle]);

  const startGame = useCallback(() => {
    cleanup();
    gameEndedRef.current = false;
    scoreRef.current = 0;
    setGameState('playing');
    setScore(0);
    setLives(5);
    setCurrentObstacle(null);
    setCanClear(false);
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

  useEffect(() => cleanup, [cleanup]);

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

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

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

      {currentObstacle && (
        <Animated.View
          style={[
            styles.obstacle,
            obstacleStyle,
            { top: SCREEN_HEIGHT * 0.6 - OBSTACLE_SIZE / 2 },
          ]}
        >
          <Text style={styles.obstacleEmoji}>{currentObstacle}</Text>
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
              value={Math.floor((score / TOTAL_OBSTACLES) * 100)}
            />
          </View>
        </View>

        {gameState === 'playing' && (
          <View
            style={{
              position: 'absolute',
              top: SCREEN_HEIGHT * 0.3,
              alignSelf: 'center',
              paddingHorizontal: 20,
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
              {LESSON.phrases[2].text}
            </Text>
          </View>
        )}

        {gameState === 'playing' && (
          <Animated.View style={[styles.buttonContainer, buttonStyle]}>
            <Pressable style={styles.actionButton} onPress={handleButtonPress}>
              <Text style={styles.buttonText}>🌊 SPLASH!</Text>
            </Pressable>
          </Animated.View>
        )}

        {gameState === 'idle' && (
          <View style={styles.overlay}>
            <Text style={styles.titleText}>🐋 Orca Swim 🐋</Text>
            <Text style={styles.instructionText}>Dodge the obstacles!</Text>
            <Pressable style={styles.startButton} onPress={handleButtonPress}>
              <Text style={styles.startButtonText}>TAP TO START</Text>
            </Pressable>
            <Text style={styles.subText}>
              Press SPLASH to clear obstacles{'\n'}before they hit you!
            </Text>
          </View>
        )}

        {gameState === 'won' && (
          <View style={styles.overlay}>
            <Text style={styles.winText}>🎉 YOU WON! 🎉</Text>
            <Text style={styles.finalTime}>⏱️ {formatTime(finalTime)}</Text>
            <Text style={styles.finalScore}>
              Score: {score}/{TOTAL_OBSTACLES}
            </Text>
            <Text style={styles.livesLeft}>Lives remaining: {lives}</Text>
            <Pressable style={styles.startButton} onPress={handleButtonPress}>
              <Text style={styles.startButtonText}>PLAY AGAIN</Text>
            </Pressable>
          </View>
        )}

        {gameState === 'lost' && (
          <View style={styles.overlay}>
            <Text style={styles.loseText}>💔 GAME OVER 💔</Text>
            <Text style={styles.finalTime}>⏱️ {formatTime(finalTime)}</Text>
            <Text style={styles.finalScore}>
              Score: {score}/{TOTAL_OBSTACLES}
            </Text>
            <Pressable style={styles.startButton} onPress={handleButtonPress}>
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
  buttonContainer: { position: 'absolute', bottom: 80, alignSelf: 'center' },
  actionButton: {
    backgroundColor: DARK_COLOR,
    paddingHorizontal: 44,
    paddingVertical: 16,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: { color: BRAND_COLOR, fontSize: 22, fontWeight: 'bold' },
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
