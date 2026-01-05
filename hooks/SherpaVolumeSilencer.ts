import { useEffect } from 'react';
import { Platform } from 'react-native';
import TTS from 'react-native-sherpa-onnx-offline-tts';

export function SherpaVolumeSilencer() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!TTS?.addVolumeListener) return;

    try {
      // 👇 This is REQUIRED to stop native spam
      const sub = TTS.addVolumeListener(() => {});
      return () => sub?.remove?.();
    } catch {
      // ignore
    }
  }, []);

  return null;
}
