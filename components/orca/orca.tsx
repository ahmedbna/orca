import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Vibration,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
  runOnJS,
  withRepeat,
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
import { useWhisperModels } from '@/components/whisper/useWhisperModels';
import { TranscribeRealtimeOptions } from 'whisper.rn/index.js';
import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';

const audioSource = require('../../assets/music/orca.mp3');

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
  const player = useAudioPlayer(audioSource);

  const TOTAL_OBSTACLES = lesson.phrases.length;
  const [gameState, setGameState] = useState<GameStatus>('idle');
  const [currentObstacleIndex, setCurrentObstacleIndex] = useState<
    number | null
  >(null);
  const [currentObstacleEmoji, setCurrentObstacleEmoji] = useState<
    string | null
  >(null);
  const [correctPhrases, setCorrectPhrases] = useState(0);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [lives, setLives] = useState(5);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [finalTime, setFinalTime] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');

  const { whisperContext, isInitializingModel, initializeWhisperModel } =
    useWhisperModels();

  const obstacleX = useSharedValue(SCREEN_WIDTH + OBSTACLE_SIZE);
  const obstacleY = useSharedValue(ORCA_Y);
  const obstacleOpacity = useSharedValue(0);
  const orcaShake = useSharedValue(0);
  const micScale = useSharedValue(1);

  const obstacleTimeoutRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const isMovingRef = useRef(false);
  const hasHitRef = useRef(false);
  const gameEndedRef = useRef(false);
  const currentPhraseIndexRef = useRef(0);
  const correctPhrasesRef = useRef(0);
  const realtimeTranscriberRef = useRef<any>(null);

  // Initialize Whisper model on mount
  useEffect(() => {
    const initModel = async () => {
      try {
        await initializeWhisperModel('small', { initVad: false });
      } catch (error) {
        console.error('Failed to initialize Whisper model:', error);
      }
    };
    initModel();
  }, []);

  // Animate mic icon when listening
  useEffect(() => {
    if (isListening) {
      micScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(micScale);
      micScale.value = withTiming(1, { duration: 200 });
    }
  }, [isListening]);

  // Handle audio playback based on game state
  useEffect(() => {
    const handleAudio = async () => {
      if (!player) return;

      if (gameState === 'playing' && player.isLoaded) {
        try {
          if (player.playing) {
            await player.seekTo(0);
          } else {
            await player.play();
          }
        } catch (error) {
          console.error('Error playing audio:', error);
        }
      } else {
        try {
          if (player.playing) {
            await player.pause();
            await player.seekTo(0);
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

  const stopListening = useCallback(async () => {
    try {
      if (realtimeTranscriberRef.current?.stop) {
        await realtimeTranscriberRef.current.stop();
        realtimeTranscriberRef.current = null;
      }
      setIsListening(false);
      setCurrentTranscript('');
    } catch (err) {
      console.error('Error stopping listening:', err);
    }
  }, []);

  const cleanup = useCallback(async () => {
    if (obstacleTimeoutRef.current) {
      clearTimeout(obstacleTimeoutRef.current);
      obstacleTimeoutRef.current = null;
    }
    stopTimer();
    await stopListening();
    cancelAnimation(obstacleX);
    cancelAnimation(obstacleOpacity);
    cancelAnimation(obstacleY);
    cancelAnimation(orcaShake);
    cancelAnimation(micScale);
    isMovingRef.current = false;
    hasHitRef.current = false;
  }, [stopTimer, stopListening]);

  const endGame = useCallback(
    async (won: boolean) => {
      if (gameEndedRef.current) return;
      gameEndedRef.current = true;

      const ft = Date.now() - startTimeRef.current;
      setFinalTime(ft);
      await cleanup();
      setCurrentObstacleIndex(null);
      setCurrentObstacleEmoji(null);
      obstacleOpacity.value = 0;
      setGameState(won ? 'won' : 'lost');
    },
    [cleanup]
  );

  const getNormalizedText = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const checkPronunciation = useCallback(
    (transcript: string, targetPhrase: string): boolean => {
      const normalizedTranscript = getNormalizedText(transcript);
      const normalizedTarget = getNormalizedText(targetPhrase);

      console.log('Checking pronunciation:', {
        transcript: normalizedTranscript,
        target: normalizedTarget,
      });

      // Check for exact match
      if (normalizedTranscript === normalizedTarget) {
        return true;
      }

      // Check if target is contained in transcript
      if (normalizedTranscript.includes(normalizedTarget)) {
        return true;
      }

      // Check for word-by-word match (at least 80% of words match)
      const transcriptWords = normalizedTranscript.split(' ');
      const targetWords = normalizedTarget.split(' ');

      if (targetWords.length === 0) return false;

      let matchedWords = 0;
      for (const targetWord of targetWords) {
        if (transcriptWords.includes(targetWord)) {
          matchedWords++;
        }
      }

      const matchPercentage = matchedWords / targetWords.length;
      return matchPercentage >= 0.8;
    },
    []
  );

  const clearObstacle = useCallback(async () => {
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

    await stopListening();

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
  }, [endGame, stopListening]);

  const startListening = useCallback(async () => {
    if (!whisperContext) {
      console.log('Whisper context not available');
      return;
    }

    // Stop any existing transcription first
    if (realtimeTranscriberRef.current?.stop) {
      try {
        await realtimeTranscriberRef.current.stop();
      } catch (e) {
        console.log('Error stopping previous transcriber:', e);
      }
      realtimeTranscriberRef.current = null;
    }

    try {
      const hasMicPermission = await getRecordingPermissionsAsync();
      if (!hasMicPermission.granted) {
        const permission = await requestRecordingPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Microphone Permission',
            'Microphone access is required to play this game.'
          );
          return;
        }
      }

      setIsListening(true);
      setCurrentTranscript('');

      const realtimeOptions: TranscribeRealtimeOptions = {
        language,
        realtimeAudioSec: 300,
        realtimeAudioSliceSec: 5,
        realtimeAudioMinSec: 0.5,
        audioSessionOnStartIos: {
          category: 'PlayAndRecord' as any,
          options: ['DefaultToSpeaker' as any, 'AllowBluetooth' as any],
          mode: 'Default' as any,
        },
        audioSessionOnStopIos: 'restore' as any,
      };

      console.log('Starting Whisper realtime transcription...');
      const { stop, subscribe } =
        await whisperContext.transcribeRealtime(realtimeOptions);

      let hasCleared = false;

      subscribe((event: any) => {
        const { isCapturing, data, error } = event;

        if (error) {
          console.error('Transcription error:', error);
          return;
        }

        if (data?.result) {
          const transcript = data.result.trim();
          console.log('Received transcript:', transcript);
          setCurrentTranscript(transcript);

          // Only check if we haven't already cleared this obstacle
          if (
            !hasCleared &&
            currentPhraseIndexRef.current < lesson.phrases.length
          ) {
            const targetPhrase =
              lesson.phrases[currentPhraseIndexRef.current].text;
            console.log('Checking against target:', targetPhrase);

            if (checkPronunciation(transcript, targetPhrase)) {
              console.log('✓ Pronunciation matched!');
              hasCleared = true;
              runOnJS(clearObstacle)();
            }
          }
        }

        if (!isCapturing) {
          console.log('Speech segment finished, continuing to listen...');
        }
      });

      realtimeTranscriberRef.current = { stop };
      console.log('Whisper listening started successfully');
    } catch (err) {
      console.error('Failed to start listening:', err);
      setIsListening(false);
    }
  }, [whisperContext, checkPronunciation, clearObstacle]);

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
    setCurrentPhraseIndex(nextIndex);
    setCurrentObstacleEmoji(emoji);
    hasHitRef.current = false;
    isMovingRef.current = true;

    obstacleY.value = ORCA_Y;
    obstacleX.value = SCREEN_WIDTH + OBSTACLE_SIZE;
    obstacleOpacity.value = withTiming(1, { duration: 200 });

    // Start listening immediately for pronunciation
    setTimeout(() => {
      startListening();
    }, 100);

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
  }, [endGame, startListening]);

  const handleCollisionJS = useCallback(async () => {
    if (hasHitRef.current || gameEndedRef.current) return;
    hasHitRef.current = true;
    isMovingRef.current = false;

    console.log(
      'Collision! Failed to say phrase:',
      currentPhraseIndexRef.current
    );
    await stopListening();

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
  }, [endGame, spawnObstacle, stopListening]);

  const startGame = useCallback(async () => {
    if (!whisperContext) {
      Alert.alert(
        'Not Ready',
        'Whisper model is still loading. Please wait...'
      );
      return;
    }

    await cleanup();
    gameEndedRef.current = false;
    currentPhraseIndexRef.current = 0;
    correctPhrasesRef.current = 0;
    setGameState('playing');
    setCorrectPhrases(0);
    setCurrentPhraseIndex(0);
    setLives(5);
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
  }, [cleanup, spawnObstacle, startTimer, whisperContext]);

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

  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
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
              top: SCREEN_HEIGHT * 0.25,
              alignSelf: 'center',
              paddingHorizontal: 20,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              borderRadius: 20,
              padding: 20,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                textAlign: 'center',
                color: BRAND_COLOR,
                marginBottom: 8,
              }}
            >
              Say in German:
            </Text>
            <Text
              style={{
                fontSize: 36,
                fontWeight: '800',
                textAlign: 'center',
                color: '#FFF',
              }}
            >
              {getTranslation(currentObstacleIndex)}
            </Text>
          </View>
        )}

        {gameState === 'playing' && (
          <Animated.View style={[styles.indicatorContainer, micAnimatedStyle]}>
            <View style={styles.indicatorButton}>
              <View style={styles.indicatorContent}>
                <Text style={styles.micIcon}>{isListening ? '🎤' : '🔇'}</Text>
                <Text style={styles.languageIndicator}>🇺🇸 → 🇩🇪</Text>
              </View>
              {isListening && currentTranscript && (
                <Text style={styles.transcriptText} numberOfLines={2}>
                  {currentTranscript}
                </Text>
              )}
            </View>
          </Animated.View>
        )}

        {gameState === 'idle' && (
          <View style={styles.overlay}>
            <Text style={styles.titleText}>🐋 Orca Swim 🐋</Text>
            <Text style={styles.instructionText}>Pronunciation Challenge!</Text>
            <Pressable
              style={[
                styles.startButton,
                (isInitializingModel || !whisperContext) &&
                  styles.buttonDisabled,
              ]}
              onPress={startGame}
              disabled={isInitializingModel || !whisperContext}
            >
              <Text style={styles.startButtonText}>
                {isInitializingModel ? 'LOADING...' : 'TAP TO START'}
              </Text>
            </Pressable>
            <Text style={styles.subText}>
              Say the German phrase aloud{'\n'}to clear each obstacle!
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
  indicatorContainer: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
  },
  indicatorButton: {
    backgroundColor: DARK_COLOR,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  indicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  micIcon: {
    fontSize: 24,
  },
  languageIndicator: {
    color: BRAND_COLOR,
    fontSize: 20,
    fontWeight: 'bold',
  },
  transcriptText: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
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
