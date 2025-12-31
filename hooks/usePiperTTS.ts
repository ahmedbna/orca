// hooks/usePiperTTS.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { Directory, File, Paths } from 'expo-file-system';
import { setAudioModeAsync } from 'expo-audio';
import { createDownloadResumable } from 'expo-file-system/legacy';
import { unzip } from 'react-native-zip-archive';
import TTS from 'react-native-sherpa-onnx-offline-tts';

export interface PiperModel {
  id: string;
  label: string;
  language: string;
  url: string;
  folderName: string;
  modelFile: string;
}

export const PIPER_MODELS: PiperModel[] = [
  {
    id: 'en-US-Amy',
    label: 'English (US) - Amy',
    language: 'en-US',
    url: 'https://github.com/ahmedbna/piper/releases/download/v1/vits-piper-en_US-amy-low.zip',
    folderName: 'vits-piper-en_US-amy-low',
    modelFile: 'en_US-amy-low.onnx',
  },
  {
    id: 'fr-FR-Siwis',
    label: 'French - Siwis',
    language: 'fr-FR',
    url: 'https://github.com/ahmedbna/piper/releases/download/v1/vits-piper-fr_FR-siwis-low.zip',
    folderName: 'vits-piper-fr_FR-siwis-low',
    modelFile: 'fr_FR-siwis-low.onnx',
  },
  {
    id: 'de-DE-Thorsten',
    label: 'German - Thorsten',
    language: 'de-DE',
    url: 'https://github.com/ahmedbna/piper/releases/download/v1/vits-piper-de_DE-thorsten-low.zip',
    folderName: 'vits-piper-de_DE-thorsten-low',
    modelFile: 'de_DE-thorsten-low.onnx',
  },
  {
    id: 'es-ES-Carlfm',
    label: 'Spanish - Carlfm',
    language: 'es-ES',
    url: 'https://github.com/ahmedbna/piper/releases/download/v1/vits-piper-es_ES-carlfm-x_low.zip',
    folderName: 'vits-piper-es_ES-carlfm-x_low',
    modelFile: 'es_ES-carlfm-x_low.onnx',
  },
  {
    id: 'it-IT-Riccardo',
    label: 'Italian - Riccardo',
    language: 'it-IT',
    url: 'https://github.com/ahmedbna/piper/releases/download/v1/vits-piper-it_IT-riccardo-x_low.zip',
    folderName: 'vits-piper-it_IT-riccardo-x_low',
    modelFile: 'it_IT-riccardo-x_low.onnx',
  },
];

export function usePiperTTS() {
  const [downloadProgress, setDownloadProgress] = useState<
    Record<string, number>
  >({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [currentModelId, setCurrentModelId] = useState<string | null>(null);

  const isReadyRef = useRef(false);
  const isSpeakingRef = useRef(false);

  // 1. SILENCE THE WARNING: Register a listener for VolumeUpdate
  useEffect(() => {
    const subscription = TTS.addVolumeListener?.((volume: number) => {
      // You can use this volume value (0.0 to 1.0) for a UI visualizer
    });
    return () => {
      if (subscription?.remove) subscription.remove();
    };
  }, []);

  const getTTSDirectory = useCallback(async () => {
    const dir = new Directory(Paths.document, 'piper-models');
    if (!dir.exists) {
      await dir.create({ intermediates: true });
    }
    return dir;
  }, []);

  const downloadAndExtractModel = useCallback(
    async (model: PiperModel) => {
      const baseDir = await getTTSDirectory();
      const modelDir = new Directory(baseDir, model.folderName);

      if (modelDir.exists) {
        return modelDir.uri;
      }

      setIsDownloading(true);
      const zipFile = new File(baseDir, `${model.id}.zip`);

      try {
        const downloader = createDownloadResumable(
          model.url,
          zipFile.uri,
          {},
          (p) => {
            const progress = p.totalBytesWritten / p.totalBytesExpectedToWrite;
            setDownloadProgress((prev) => ({ ...prev, [model.id]: progress }));
          }
        );

        await downloader.downloadAsync();
        await unzip(zipFile.uri, baseDir.uri);
        await zipFile.delete();

        return modelDir.uri;
      } finally {
        setIsDownloading(false);
      }
    },
    [getTTSDirectory]
  );

  const initializeTTS = useCallback(
    async (modelId: string) => {
      if (isInitializing || currentModelId === modelId) return;

      try {
        setIsInitializing(true);

        try {
          await setAudioModeAsync({
            playsInSilentMode: true, // allow playback in silent mode
            shouldPlayInBackground: false, // only if you want background audio
            interruptionMode: 'mixWithOthers', // manage other audio
          });
        } catch (error) {
          console.warn('Audio session config failed:', error);
        }

        const model = PIPER_MODELS.find((m) => m.id === modelId);
        if (!model) return;

        const folderUri = await downloadAndExtractModel(model);

        // 2. PATH FIX: The native engine often fails if 'file://' is present.
        // We strip it to provide a raw absolute path.
        const rawPath = folderUri.replace('file://', '');

        // 3. CONFIG FIX: Piper models require tokens and the espeak-ng-data folder.
        // These are included in the .zip files you are downloading.
        const config = {
          modelPath: `${rawPath}/${model.modelFile}`,
          tokensPath: `${rawPath}/tokens.txt`,
          dataDirPath: `${rawPath}/espeak-ng-data`,
          numThreads: 2,
        };

        console.log('Initializing TTS with path:', config.modelPath);
        await TTS.initialize(JSON.stringify(config));

        isReadyRef.current = true;
        setCurrentModelId(modelId);
      } catch (error) {
        console.error('TTS Init Error:', error);
        isReadyRef.current = false;
      } finally {
        setIsInitializing(false);
      }
    },
    [isInitializing, currentModelId, downloadAndExtractModel]
  );

  const speak = useCallback(
    async (text: string, speed = 0.75) => {
      // Basic guard clauses
      if (!isReadyRef.current || isInitializing || isSpeakingRef.current) {
        console.warn('TTS not ready or already speaking');
        return;
      }

      try {
        isSpeakingRef.current = true;
        // Arguments: (text, speakerId, speed)
        // Piper models usually use speakerId 0
        await TTS.generateAndPlay(text, 0, speed);
      } catch (e) {
        console.error('TTS playback error:', e);
      } finally {
        isSpeakingRef.current = false;
      }
    },
    [isInitializing]
  );

  return {
    availableModels: PIPER_MODELS,
    initializeTTS,
    speak,
    currentModelId,
    isDownloading,
    isInitializing,
    downloadProgress,
  };
}
