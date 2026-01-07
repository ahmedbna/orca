// hooks/usePiperTTS.ts

import { Platform } from 'react-native';
import { useState, useCallback, useRef } from 'react';
import { Directory, File, Paths } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';
import { unzip } from 'react-native-zip-archive';
import { setAudioModeAsync } from 'expo-audio';
import { Doc, Id } from '@/convex/_generated/dataModel';
import TTS from 'react-native-sherpa-onnx-offline-tts';

export function usePiperTTS({ models }: { models: Array<Doc<'piperModels'>> }) {
  const isReadyRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isConfiguringSessionRef = useRef(false);
  const initializationAttempts = useRef<Record<string, number>>({});
  const currentModelRef = useRef<Doc<'piperModels'> | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [currentModelId, setCurrentModelId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [downloadProgress, setDownloadProgress] = useState<
    Record<string, number>
  >({});

  const configureTTSAudioSession = async () => {
    if (isConfiguringSessionRef.current) return;

    try {
      isConfiguringSessionRef.current = true;

      // 🔥 FIX: More aggressive audio session configuration
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers', // This will duck other audio when TTS plays
        shouldRouteThroughEarpiece: false,
      });
    } catch (err) {
      console.warn('⚠️ TTS audio session config error:', err);
    } finally {
      isConfiguringSessionRef.current = false;
    }
  };

  const getTTSDirectory = useCallback(async () => {
    const dir = new Directory(Paths.document, 'piper-models');
    if (!dir.exists) {
      await dir.create({ intermediates: true });
    }
    return dir;
  }, []);

  const verifyModelFiles = async (
    modelDir: Directory,
    model: Doc<'piperModels'>
  ) => {
    try {
      return (
        new File(modelDir, model.modelFile).exists &&
        new File(modelDir, 'tokens.txt').exists &&
        new Directory(modelDir, 'espeak-ng-data').exists
      );
    } catch {
      return false;
    }
  };

  const downloadAndExtractModel = useCallback(
    async (model: Doc<'piperModels'>) => {
      const baseDir = await getTTSDirectory();
      const modelDir = new Directory(baseDir, model.folderName);

      if (modelDir.exists) {
        const valid = await verifyModelFiles(modelDir, model);
        if (valid) {
          setDownloadProgress((p) => ({ ...p, [model.modelId]: 1 }));
          return modelDir.uri;
        }
        await modelDir.delete();
      }

      setIsDownloading(true);
      setError(null);

      const zipFile = new File(baseDir, `${model.modelId}.zip`);

      try {
        const downloader = createDownloadResumable(
          model.url,
          zipFile.uri,
          {},
          (progress) => {
            setDownloadProgress((p) => ({
              ...p,
              [model.modelId]:
                progress.totalBytesWritten / progress.totalBytesExpectedToWrite,
            }));
          }
        );

        await downloader.downloadAsync();
        await unzip(zipFile.uri, baseDir.uri);
        await zipFile.delete();

        if (!(await verifyModelFiles(modelDir, model))) {
          throw new Error('Model files incomplete');
        }

        setDownloadProgress((p) => ({ ...p, [model.modelId]: 1 }));
        return modelDir.uri;
      } finally {
        setIsDownloading(false);
      }
    },
    [getTTSDirectory]
  );

  const removeModel = useCallback(
    async (modelId: string) => {
      try {
        const model = models.find((m) => m.modelId === modelId);
        if (!model) throw new Error(`Model not found: ${modelId}`);
        const baseDir = await getTTSDirectory();
        const modelDir = new Directory(baseDir, model.folderName);
        if (modelDir.exists) {
          await modelDir.delete();
          console.log('✅ Model removed:', modelId);
        }
        // Clear progress for this specific model

        setDownloadProgress((prev) => {
          const updated = { ...prev };
          delete updated[modelId];
          return updated;
        });
        // If this was the current model, clear it
        if (currentModelId === modelId) {
          isReadyRef.current = false;
          currentModelRef.current = null;
          setCurrentModelId(null);
        }
        return true;
      } catch (err) {
        setError(`Failed to remove model: ${err}`);
        return false;
      }
    },
    [models, currentModelId, getTTSDirectory]
  );

  const getDownloadedModels = useCallback(async () => {
    try {
      const baseDir = await getTTSDirectory();
      const downloaded: string[] = [];
      for (const model of models) {
        const modelDir = new Directory(baseDir, model.folderName);
        if (modelDir.exists) {
          const isValid = await verifyModelFiles(modelDir, model);
          if (isValid) {
            downloaded.push(model.modelId);
            // Set progress to 100% for verified models
            setDownloadProgress((prev) => ({ ...prev, [model.modelId]: 1 }));
          }
        }
      }
      return downloaded;
    } catch {
      return [];
    }
  }, [models, getTTSDirectory]);

  const initializeTTS = useCallback(
    async (piperId: Id<'piperModels'>, forceReInit = false) => {
      if (isInitializing) return;

      if (
        !forceReInit &&
        currentModelRef.current?._id === piperId &&
        isReadyRef.current
      ) {
        return;
      }

      const model = models.find((m) => m._id === piperId);
      if (!model) throw new Error('Model not found');

      const attempts = initializationAttempts.current[model.modelId] || 0;
      if (attempts >= 3) {
        setError('Maximum initialization attempts reached');
        return;
      }

      try {
        setIsInitializing(true);
        initializationAttempts.current[model.modelId] = attempts + 1;

        // 🔥 FIX: Configure audio session FIRST
        await configureTTSAudioSession();

        const folderUri = await downloadAndExtractModel(model);
        const rawPath = folderUri.replace(/^file:\/\//, '');

        await TTS.initialize(
          JSON.stringify({
            modelPath: `${rawPath}/${model.modelFile}`,
            tokensPath: `${rawPath}/tokens.txt`,
            dataDirPath: `${rawPath}/espeak-ng-data`,
            numThreads: Platform.OS === 'android' ? 4 : 2,
          })
        );

        isReadyRef.current = true;
        currentModelRef.current = model;
        setCurrentModelId(model.modelId);
        initializationAttempts.current[model.modelId] = 0;
      } catch (err) {
        isReadyRef.current = false;
        currentModelRef.current = null;
        setError(String(err));
        throw err;
      } finally {
        setIsInitializing(false);
      }
    },
    [models, downloadAndExtractModel]
  );

  const speak = useCallback(
    async (text: string, speed = 0.75) => {
      if (!isReadyRef.current || isSpeakingRef.current || isInitializing)
        return;
      if (!text.trim()) return;

      try {
        isSpeakingRef.current = true;

        // 🔥 FIX: Reconfigure audio session right before speaking
        // This ensures TTS has full control even if background music was playing
        await configureTTSAudioSession();

        await TTS.generateAndPlay(text.trim(), 0, speed);

        console.log('✅ TTS playback completed');
      } catch (err) {
        console.error('🔊 TTS speak error:', err);
        setError(String(err));
      } finally {
        isSpeakingRef.current = false;
      }
    },
    [isInitializing]
  );

  return {
    allModels: models,
    initializeTTS,
    speak,
    currentModel: currentModelRef.current,
    currentModelId,
    isDownloading,
    isInitializing,
    downloadProgress,
    getDownloadedModels,
    removeModel,
    error,
    isReady: isReadyRef.current,
  };
}
