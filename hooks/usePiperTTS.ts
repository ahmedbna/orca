// hooks/usePiperTTS.ts

import { Platform } from 'react-native';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Directory, File, Paths } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';
import { unzip } from 'react-native-zip-archive';
import { setAudioModeAsync } from 'expo-audio';
import { Doc } from '@/convex/_generated/dataModel';
import TTS from 'react-native-sherpa-onnx-offline-tts';

export function usePiperTTS({ models }: { models: Array<Doc<'piperModels'>> }) {
  const isReadyRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const initializationAttempts = useRef<Record<string, number>>({});

  const [isDownloading, setIsDownloading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [currentModelId, setCurrentModelId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    if (!TTS?.addVolumeListener) return;

    try {
      const subscription = TTS.addVolumeListener(() => {});
      return () => subscription?.remove?.();
    } catch {
      // ignore
    }
  }, []);

  const getTTSDirectory = useCallback(async () => {
    const dir = new Directory(Paths.document, 'piper-models');

    if (!dir.exists) {
      await dir.create({ intermediates: true });
      console.log('✅ Created Piper models directory:', dir.uri);
    }

    return dir;
  }, []);

  const verifyModelFiles = async (
    modelDir: Directory,
    model: Doc<'piperModels'>
  ): Promise<boolean> => {
    try {
      const modelFile = new File(modelDir, model.modelFile);
      const tokensFile = new File(modelDir, 'tokens.txt');
      const dataDir = new Directory(modelDir, 'espeak-ng-data');

      return modelFile.exists && tokensFile.exists && dataDir.exists;
    } catch {
      return false;
    }
  };

  const downloadAndExtractModel = useCallback(
    async (model: Doc<'piperModels'>) => {
      const baseDir = await getTTSDirectory();
      const modelDir = new Directory(baseDir, model.folderName);

      if (modelDir.exists) {
        const isValid = await verifyModelFiles(modelDir, model);
        if (isValid) {
          console.log('✅ Model already exists:', model.modelId);
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
            const pct =
              progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
            setDownloadProgress((prev) => ({
              ...prev,
              [model.modelId]: pct,
            }));
          }
        );

        await downloader.downloadAsync();
        await unzip(zipFile.uri, baseDir.uri);
        await zipFile.delete();

        const valid = await verifyModelFiles(modelDir, model);
        if (!valid) throw new Error('Model files incomplete');

        return modelDir.uri;
      } catch (err) {
        setError(`Failed to download model: ${err}`);
        if (zipFile.exists) await zipFile.delete();
        if (modelDir.exists) await modelDir.delete();
        throw err;
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

        // Clear progress for this model
        setDownloadProgress((prev) => {
          const updated = { ...prev };
          delete updated[modelId];
          return updated;
        });

        // If this was the current model, clear it
        if (currentModelId === modelId) {
          isReadyRef.current = false;
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
          }
        }
      }

      return downloaded;
    } catch {
      return [];
    }
  }, [models, getTTSDirectory]);

  const initializeTTS = useCallback(
    async (modelId: string, forceReInit = false) => {
      if (isInitializing) return;
      if (!forceReInit && currentModelId === modelId && isReadyRef.current)
        return;

      const attempts = initializationAttempts.current[modelId] || 0;
      if (attempts >= 3) {
        setError('Maximum initialization attempts reached');
        return;
      }

      try {
        setIsInitializing(true);
        setError(null);
        initializationAttempts.current[modelId] = attempts + 1;

        const model = models.find((m) => m.modelId === modelId);
        if (!model) throw new Error(`Model not found: ${modelId}`);

        const folderUri = await downloadAndExtractModel(model);
        const rawPath = folderUri.replace(/^file:\/\//, '');

        const config = {
          modelPath: `${rawPath}/${model.modelFile}`,
          tokensPath: `${rawPath}/tokens.txt`,
          dataDirPath: `${rawPath}/espeak-ng-data`,
          numThreads: Platform.select({ ios: 2, android: 4, default: 2 }),
        };

        await TTS.initialize(JSON.stringify(config));

        isReadyRef.current = true;
        setCurrentModelId(modelId);
        initializationAttempts.current[modelId] = 0;
      } catch (err) {
        isReadyRef.current = false;
        setError(`Initialization failed: ${err}`);
        throw err;
      } finally {
        setIsInitializing(false);
      }
    },
    [isInitializing, currentModelId, downloadAndExtractModel, models]
  );

  const speak = useCallback(
    async (text: string, speed = 0.75) => {
      if (!isReadyRef.current || isInitializing || isSpeakingRef.current)
        return;
      if (!text.trim()) return;

      try {
        isSpeakingRef.current = true;
        setError(null);

        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
          shouldPlayInBackground: false,
          interruptionMode: 'duckOthers',
          shouldRouteThroughEarpiece: false,
        });

        await new Promise((r) => setTimeout(r, 100));
        await TTS.generateAndPlay(text.trim(), 0, speed);
      } catch (err) {
        setError(`Speech failed: ${err}`);
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
    removeModel,
    getDownloadedModels,
    currentModelId,
    isDownloading,
    isInitializing,
    downloadProgress,
    error,
    isReady: isReadyRef.current,
  };
}
