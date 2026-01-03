// hooks/usePiperTTS.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { Directory, File, Paths } from 'expo-file-system';
import { setAudioModeAsync } from 'expo-audio';
import { createDownloadResumable } from 'expo-file-system/legacy';
import { unzip } from 'react-native-zip-archive';
import TTS from 'react-native-sherpa-onnx-offline-tts';
import { Platform } from 'react-native';

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
  const [error, setError] = useState<string | null>(null);

  const isReadyRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const initializationAttempts = useRef<Record<string, number>>({});

  // Configure audio session for production
  // const configureAudioSession = async () => {
  //   try {
  //     await setAudioModeAsync({
  //       playsInSilentMode: true,
  //       shouldPlayInBackground: false,
  //       interruptionMode: 'duckOthers',
  //     });
  //     console.log('✅ Audio session configured');
  //     return true;
  //   } catch (error) {
  //     console.error('❌ Audio session config failed:', error);
  //     return false;
  //   }
  // };

  // Volume listener for production
  useEffect(() => {
    if (!TTS?.addVolumeListener) {
      console.warn('⚠️ TTS.addVolumeListener not available');
      return;
    }

    try {
      const subscription = TTS.addVolumeListener((volume: number) => {
        // Volume monitoring for debugging in production
        if (__DEV__) {
          console.log('🔊 TTS Volume:', volume);
        }
      });

      return () => {
        try {
          subscription?.remove?.();
        } catch (e) {
          console.warn('Failed to remove volume listener:', e);
        }
      };
    } catch (error) {
      console.error('Failed to add volume listener:', error);
    }
  }, []);

  const getTTSDirectory = useCallback(async () => {
    try {
      const dir = new Directory(Paths.document, 'piper-models');

      if (!dir.exists) {
        await dir.create({ intermediates: true });
        console.log('✅ Created TTS directory:', dir.uri);
      }

      return dir;
    } catch (error) {
      console.error('❌ Failed to create TTS directory:', error);
      throw new Error('Failed to create model directory');
    }
  }, []);

  const verifyModelFiles = async (
    modelDir: Directory,
    model: PiperModel
  ): Promise<boolean> => {
    try {
      const modelFile = new File(modelDir, model.modelFile);
      const tokensFile = new File(modelDir, 'tokens.txt');
      const dataDir = new Directory(modelDir, 'espeak-ng-data');

      const modelExists = modelFile.exists;
      const tokensExist = tokensFile.exists;
      const dataDirExists = dataDir.exists;

      console.log('📁 Model verification:', {
        model: modelExists,
        tokens: tokensExist,
        dataDir: dataDirExists,
      });

      return modelExists && tokensExist && dataDirExists;
    } catch (error) {
      console.error('❌ Model verification failed:', error);
      return false;
    }
  };

  const downloadAndExtractModel = useCallback(
    async (model: PiperModel) => {
      const baseDir = await getTTSDirectory();
      const modelDir = new Directory(baseDir, model.folderName);

      // Check if model already exists and is valid
      if (modelDir.exists) {
        const isValid = await verifyModelFiles(modelDir, model);
        if (isValid) {
          console.log('✅ Model already exists and is valid');
          return modelDir.uri;
        } else {
          console.log('⚠️ Existing model invalid, re-downloading...');
          await modelDir.delete();
        }
      }

      setIsDownloading(true);
      setError(null);
      const zipFile = new File(baseDir, `${model.id}.zip`);

      try {
        console.log('⬇️ Downloading model:', model.url);

        const downloader = createDownloadResumable(
          model.url,
          zipFile.uri,
          {},
          (progress) => {
            const pct =
              progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
            setDownloadProgress((prev) => ({ ...prev, [model.id]: pct }));

            if (__DEV__) {
              console.log(`📥 Download progress: ${(pct * 100).toFixed(1)}%`);
            }
          }
        );

        const result = await downloader.downloadAsync();

        if (!result) {
          throw new Error('Download failed - no result');
        }

        console.log('✅ Download complete, extracting...');

        // Extract with error handling
        await unzip(zipFile.uri, baseDir.uri);
        console.log('✅ Extraction complete');

        // Clean up zip file
        await zipFile.delete();

        // Verify extracted files
        const isValid = await verifyModelFiles(modelDir, model);
        if (!isValid) {
          throw new Error('Extracted model files are incomplete');
        }

        return modelDir.uri;
      } catch (error) {
        console.error('❌ Download/Extract error:', error);
        setError(`Failed to download model: ${error}`);

        // Clean up on failure
        try {
          if (zipFile.exists) await zipFile.delete();
          if (modelDir.exists) await modelDir.delete();
        } catch (cleanupError) {
          console.warn('Failed to cleanup:', cleanupError);
        }

        throw error;
      } finally {
        setIsDownloading(false);
      }
    },
    [getTTSDirectory]
  );

  const initializeTTS = useCallback(
    async (modelId: string, forceReInit = false) => {
      // Prevent concurrent initializations
      if (isInitializing) {
        console.log('⏳ Already initializing, skipping...');
        return;
      }

      // Check if already initialized
      if (!forceReInit && currentModelId === modelId && isReadyRef.current) {
        console.log('✅ Model already initialized');
        return;
      }

      // Limit retry attempts
      const attempts = initializationAttempts.current[modelId] || 0;
      if (attempts >= 3) {
        setError('Maximum initialization attempts reached');
        return;
      }

      try {
        setIsInitializing(true);
        setError(null);
        initializationAttempts.current[modelId] = attempts + 1;

        console.log('🎤 Configuring audio session...');
        // const audioConfigured = await configureAudioSession();
        // if (!audioConfigured) {
        //   throw new Error('Failed to configure audio session');
        // }

        const model = PIPER_MODELS.find((m) => m.id === modelId);
        if (!model) {
          throw new Error(`Model not found: ${modelId}`);
        }

        console.log('📦 Preparing model:', model.id);
        const folderUri = await downloadAndExtractModel(model);

        // Remove file:// prefix for native code
        const rawPath = folderUri.replace(/^file:\/\//, '');

        const config = {
          modelPath: `${rawPath}/${model.modelFile}`,
          tokensPath: `${rawPath}/tokens.txt`,
          dataDirPath: `${rawPath}/espeak-ng-data`,
          numThreads: Platform.select({ ios: 2, android: 4, default: 2 }),
        };

        console.log('🚀 Initializing TTS with config:', {
          modelPath: config.modelPath.substring(0, 50) + '...',
          platform: Platform.OS,
        });

        await TTS.initialize(JSON.stringify(config));

        isReadyRef.current = true;
        setCurrentModelId(modelId);
        initializationAttempts.current[modelId] = 0; // Reset on success

        console.log('✅ TTS initialized successfully');
      } catch (error) {
        console.error('❌ TTS Init Error:', error);
        isReadyRef.current = false;
        setError(`Initialization failed: ${error}`);
        throw error;
      } finally {
        setIsInitializing(false);
      }
    },
    [isInitializing, currentModelId, downloadAndExtractModel]
  );

  const speak = useCallback(
    async (text: string, speed = 0.75) => {
      if (!isReadyRef.current) {
        console.warn('⚠️ TTS not ready');
        setError('TTS not initialized');
        return;
      }

      if (isInitializing) {
        console.warn('⚠️ TTS still initializing');
        return;
      }

      if (isSpeakingRef.current) {
        console.warn('⚠️ Already speaking');
        return;
      }

      if (!text || text.trim().length === 0) {
        console.warn('⚠️ Empty text provided');
        return;
      }

      try {
        isSpeakingRef.current = true;
        setError(null);

        console.log(
          `🗣️ Speaking: "${text.substring(0, 30)}..." at ${speed}x speed`
        );

        await TTS.generateAndPlay(text.trim(), 0, speed);

        console.log('✅ Speech completed');
      } catch (error) {
        console.error('❌ TTS playback error:', error);
        setError(`Speech failed: ${error}`);
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
    error,
    isReady: isReadyRef.current,
  };
}
