import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  PermissionsAndroid,
} from 'react-native';
import Voice, {
  SpeechErrorEvent,
  SpeechResultsEvent,
} from '@react-native-voice/voice';

/**
 * 15 phrases (example). Replace with your lesson phrases.
 */
const PHRASES = [
  'Hello',
  'Good morning',
  'How are you',
  "I'm fine",
  'Thank you',
  'See you later',
  'Good night',
  'My name is Ahmed',
  'I come from Egypt',
  'I learn German',
  'Do you speak English',
  "I don't understand",
  'Excuse me',
  'Please speak slowly',
  'Nice to meet you',
];

/** Round settings */
const ROUND_SECONDS = 10;

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

/** Normalize text for comparison: lowercase, remove punctuation, strip diacritics */
function normalizeText(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '') // remove punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

/** similarity 0..1 where 1 = identical */
function similarity(a: string, b: string) {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (na.length === 0 && nb.length === 0) return 1;
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 0;
  return 1 - dist / maxLen;
}

export const Game = () => {
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [status, setStatus] = useState<
    'idle' | 'listening' | 'success' | 'failed'
  >('idle');
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = onSpeechPartialResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    // Start the first round on mount
    startRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // when index changes, reset and start a new round
    // small delay for UX
    if (status === 'success') return;
  }, [index, status]);

  async function ensureAudioPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message:
            'This app needs access to your microphone to check pronunciation',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    // iOS: ensure you added NSMicrophoneUsageDescription in Info.plist
    return true;
  }

  async function startListening() {
    try {
      const ok = await ensureAudioPermission();
      if (!ok) {
        Alert.alert('Microphone permission is required');
        return;
      }
      setFinalText('');
      setInterimText('');
      await Voice.start(undefined); // default locale; you can pass language like "de-DE"
      setStatus('listening');
    } catch (e: any) {
      console.warn('startListening error', e);
    }
  }

  async function stopListening() {
    try {
      await Voice.stop();
    } catch (e) {
      // ignore
    }
  }

  async function onSpeechResults(e: SpeechResultsEvent) {
    const results = e.value ?? [];
    const text = results.join(' ');
    setFinalText(text);
    checkMatch(text);
  }

  function onSpeechPartialResults(e: any) {
    const partials = e.value ?? [];
    const text = partials.join(' ');
    setInterimText(text);
    // optionally check partials for early acceptance
    checkMatch(text);
  }

  function onSpeechError(e: SpeechErrorEvent) {
    console.warn('Speech error', e);
    // If an error occurs, we might want to continue or restart listening depending on type
  }

  function checkMatch(transcribed: string) {
    const target = PHRASES[index];
    const sim = similarity(transcribed, target);
    // threshold can be tweaked: for short phrases allow lower threshold
    const threshold = getThresholdFor(target);
    if (sim >= threshold) {
      // pass
      markSuccess();
    }
  }

  function getThresholdFor(phrase: string) {
    // shorter phrases are inherently harder; lower threshold a bit for <=3 words
    const words = normalizeText(phrase).split(' ').filter(Boolean).length;
    if (words <= 2) return 0.6; // allow more fuzziness for very short phrases
    if (words <= 4) return 0.72;
    return 0.78;
  }

  function markSuccess() {
    // stop timer & listening, move to success state, then advance
    clearTimer();
    stopListening();
    setStatus('success');
    setTimeout(() => {
      // next phrase or finished
      if (index < PHRASES.length - 1) {
        setIndex((i) => i + 1);
        resetAndStartRound();
      } else {
        setStatus('idle');
        Alert.alert('Well done!', 'You completed all phrases 🎉');
      }
    }, 900);
  }

  function markFailed() {
    clearTimer();
    stopListening();
    setStatus('failed');
    setTimeout(() => {
      // retry same phrase
      resetAndStartRound();
    }, 1100);
  }

  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function resetAndStartRound() {
    setSecondsLeft(ROUND_SECONDS);
    setInterimText('');
    setFinalText('');
    setStatus('idle');
    setTimeout(() => {
      startRound();
    }, 300);
  }

  function startRound() {
    setSecondsLeft(ROUND_SECONDS);
    setInterimText('');
    setFinalText('');
    setStatus('idle');

    // small UX delay
    setTimeout(async () => {
      setSecondsLeft(ROUND_SECONDS);
      startTimer();
      await startListening();
    }, 300);
  }

  function startTimer() {
    clearTimer();
    setSecondsLeft(ROUND_SECONDS);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          // time out -> fail
          clearTimer();
          markFailed();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function restartGame() {
    clearTimer();
    stopListening();
    setIndex(0);
    setStatus('idle');
    setTimeout(() => startRound(), 300);
  }

  const target = PHRASES[index];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle='dark-content' />
      <View style={styles.card}>
        <Text style={styles.title}>Pronounce the phrase</Text>

        <View style={styles.phraseBox}>
          <Text style={styles.phraseText}>"{target}"</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.timerText}>Time: {secondsLeft}s</Text>
          <Text style={styles.progressText}>
            {index + 1}/{PHRASES.length}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusText}>
            {status === 'listening' && 'Listening...'}
            {status === 'success' && 'Correct ✔️'}
            {status === 'failed' && "Time's up ❌"}
            {status === 'idle' && 'Get ready'}
          </Text>
        </View>

        <View style={styles.transcriptionBox}>
          <Text style={styles.label}>Partial:</Text>
          <Text style={styles.transcription}>{interimText}</Text>

          <Text style={[styles.label, { marginTop: 8 }]}>Final:</Text>
          <Text style={styles.transcription}>{finalText}</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => {
              if (status === 'listening') {
                stopListening().then(() => setStatus('idle'));
              } else {
                startListening();
              }
            }}
          >
            <Text style={styles.controlButtonText}>
              {status === 'listening' ? 'Stop' : 'Listen'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: '#666' }]}
            onPress={restartGame}
          >
            <Text style={styles.controlButtonText}>Restart</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ marginTop: 14 }}>
        <Text style={{ color: '#666', textAlign: 'center' }}>
          Tip: Speak clearly, one phrase at a time. Short phrases use a lower
          similarity threshold.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f8' },
  card: {
    margin: 18,
    padding: 18,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  phraseBox: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  phraseText: { fontSize: 22, fontWeight: '700' },
  metaRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timerText: { fontSize: 16 },
  progressText: { fontSize: 16 },
  statusRow: { marginTop: 12, alignItems: 'center' },
  statusText: { fontSize: 16, fontWeight: '600' },
  transcriptionBox: {
    marginTop: 14,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
  },
  label: { fontSize: 12, color: '#888' },
  transcription: { marginTop: 6, fontSize: 16, minHeight: 22 },
  controls: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 6,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#007AFF',
  },
  controlButtonText: { color: 'white', fontWeight: '600' },
});
