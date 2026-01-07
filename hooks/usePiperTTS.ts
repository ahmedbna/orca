// hooks/usePiperTTS.ts

import { Platform } from 'react-native';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Directory, File, Paths } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';
import { unzip } from 'react-native-zip-archive';
import { setAudioModeAsync } from 'expo-audio';
import { Doc, Id } from '@/convex/_generated/dataModel';
import TTS from 'react-native-sherpa-onnx-offline-tts';

export function usePiperTTS({ models }: { models: Array<Doc<'piperModels'>> }) {
  const isReadyRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const currentModelRef = useRef<Doc<'piperModels'> | null>(null);
  const initializationAttempts = useRef<Record<string, number>>({});

  const [isDownloading, setIsDownloading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [currentModelId, setCurrentModelId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<
    Record<string, number>
  >({});

  // Configure audio session for TTS on mount and whenever we need to speak
  const configureTTSAudioSession = useCallback(async () => {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers',
        shouldRouteThroughEarpiece: false,
      });
      console.log('✅ TTS audio session configured');
    } catch (err) {
      console.warn('⚠️ TTS audio session config error:', err);
    }
  }, []);

  // Configure audio session when component mounts
  useEffect(() => {
    configureTTSAudioSession();
  }, [configureTTSAudioSession]);

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

        setDownloadProgress((prev) => {
          const updated = { ...prev };
          delete updated[modelId];
          return updated;
        });

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
      if (isInitializing) {
        console.log('⏳ Already initializing, skipping...');
        return;
      }

      if (
        !forceReInit &&
        currentModelRef.current?._id === piperId &&
        isReadyRef.current
      ) {
        console.log('✅ Model already initialized and ready');
        return;
      }

      const model = models.find((m) => m._id === piperId);
      if (!model) {
        console.error('❌ Model not found');
        throw new Error('Model not found');
      }

      const attempts = initializationAttempts.current[model.modelId] || 0;
      if (attempts >= 3) {
        const errMsg = 'Maximum initialization attempts reached';
        setError(errMsg);
        console.error('❌', errMsg);
        return;
      }

      try {
        setIsInitializing(true);
        setError(null);
        initializationAttempts.current[model.modelId] = attempts + 1;

        console.log(`🎤 Initializing TTS for model: ${model.voice}`);

        // Configure audio session BEFORE initializing TTS
        await configureTTSAudioSession();

        const folderUri = await downloadAndExtractModel(model);
        const rawPath = folderUri.replace(/^file:\/\//, '');

        console.log(`📁 Model path: ${rawPath}`);

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

        console.log(`✅ TTS initialized successfully for: ${model.voice}`);
      } catch (err) {
        isReadyRef.current = false;
        currentModelRef.current = null;
        const errMsg = String(err);
        setError(errMsg);
        console.error('❌ TTS initialization error:', err);
        throw err;
      } finally {
        setIsInitializing(false);
      }
    },
    [models, downloadAndExtractModel, configureTTSAudioSession]
  );

  const speak = useCallback(
    async (text: string, speed = 0.75) => {
      if (!isReadyRef.current) {
        console.warn('⚠️ TTS not ready');
        return;
      }

      if (isSpeakingRef.current) {
        console.warn('⚠️ Already speaking');
        return;
      }

      if (isInitializing) {
        console.warn('⚠️ Still initializing');
        return;
      }

      if (!text.trim()) {
        console.warn('⚠️ Empty text');
        return;
      }

      try {
        isSpeakingRef.current = true;

        // Small delay to ensure any background audio is fully stopped
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Reconfigure audio session right before speaking
        // This ensures TTS has priority even if background music tried to play
        await configureTTSAudioSession();

        console.log(
          `🔊 Speaking: "${text.substring(0, 50)}..." at speed ${speed}`
        );

        await TTS.generateAndPlay(text.trim(), 0, speed);

        console.log('✅ TTS playback completed');
      } catch (err) {
        console.error('❌ TTS speak error:', err);
        setError(String(err));
      } finally {
        isSpeakingRef.current = false;
      }
    },
    [isInitializing, configureTTSAudioSession]
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
