import { useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { View } from './ui/view';
import { Button } from './ui/button';
import { ScrollView } from './ui/scroll-view';
import { Text } from './ui/text';

export const Speech = () => {
  const [recognizing, setRecognizing] = useState(false);
  const [transcript, setTranscript] = useState('');

  useSpeechRecognitionEvent('start', () => {
    console.log('Speech recognition started');
    setRecognizing(true);
  });

  useSpeechRecognitionEvent('end', () => {
    console.log('Speech recognition ended');
    setRecognizing(false);
  });

  useSpeechRecognitionEvent('result', (event) => {
    console.log('results:', event.results, 'final:', event.isFinal);

    setTranscript(event.results[0]?.transcript);
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.log('error code:', event.error, 'error message:', event.message);
  });

  const handleStart = async () => {
    const permissions =
      await ExpoSpeechRecognitionModule.requestPermissionsAsync();

    if (!permissions.granted) {
      console.warn('Permissions not granted', permissions);
      return;
    }

    // Start speech recognition
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      // Whether to return results as they become available without waiting for the final result.
      interimResults: true,
      // [Default: 5] The maximum number of alternative transcriptions to return.
      maxAlternatives: 1,
      // [Default: false] Continuous recognition.
      // If false:
      //    - on iOS 17-, recognition will run until no speech is detected for 3 seconds.
      //    - on iOS 18+ and Android, recognition will run until a final result is received.
      // Not supported on Android 12 and below.
      continuous: true,
      // [Default: false] Prevent device from sending audio over the network. Only enabled if the device supports it.
      requiresOnDeviceRecognition: false,
      // [Default: false] Include punctuation in the recognition results. This applies to full stops and commas.
      // Not supported on Android 12 and below. On Android 13+, only supported when on-device recognition is enabled.
      addsPunctuation: false,
      // [Default: undefined] Short custom phrases that are unique to your app.
      contextualStrings: ['Hello', 'Good morning', 'How old are you?'],
      // [Default: undefined] Android-specific options to pass to the recognizer.
      androidIntentOptions: {
        EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 10000,
        EXTRA_MASK_OFFENSIVE_WORDS: false,
      },
      // [Default: undefined] The package name of the speech recognition service to use.
      androidRecognitionServicePackage: 'com.google.android.tts',
      // [Default: unspecified] The type of speech recognition being performed.
      iosTaskHint: 'unspecified', // "unspecified" | "dictation" | "search" | "confirmation"
      // [Default: undefined] The audio session category and options to use.
      iosCategory: {
        mode: 'measurement',
        category: 'record',
        // category: 'playAndRecord',
        categoryOptions: ['defaultToSpeaker', 'allowBluetooth'],
      },
      // Settings for volume change events.
      volumeChangeEventOptions: {
        // [Default: false] Whether to emit the `volumechange` events when the input volume changes.
        enabled: false,
        // [Default: 100ms on iOS] The interval (in milliseconds) to emit `volumechange` events.
        intervalMillis: 300,
      },
      // [Default: false] Does extra audio processing to prevent
      // microphone feedback from speakers.
      // Note: this setting may switch the AVAudioSession mode to "voiceChat"
      // and lower the volume of speaker playback
      iosVoiceProcessingEnabled: true,
    });
  };

  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 100 }}>
      {!recognizing ? (
        <Button onPress={handleStart}>Start</Button>
      ) : (
        <Button onPress={() => ExpoSpeechRecognitionModule.stop()}>Stop</Button>
      )}

      <ScrollView>
        <Text>{transcript}</Text>
      </ScrollView>
    </View>
  );
};
