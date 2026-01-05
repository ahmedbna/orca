// hooks/usePiperTTS.ts

import { Platform } from 'react-native';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Directory, File, Paths } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';
import { unzip } from 'react-native-zip-archive';
import { setAudioModeAsync } from 'expo-audio';
import TTS from 'react-native-sherpa-onnx-offline-tts';

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface PiperModel {
  modelId: string;
  voice: string;
  language: string;
  code: string;
  locale: string;
  url: string;
  folderName: string;
  modelFile: string;
}

/* -------------------------------------------------------------------------- */
/*                                 Model List                                 */
/* -------------------------------------------------------------------------- */

export const PIPER_MODELS: PiperModel[] = [
  {
    modelId: 'en-US-Amy',
    voice: 'Amy',
    language: 'English (US)',
    code: 'en',
    locale: 'en-US',
    url: 'https://github.com/ahmedbna/piper/releases/download/v1/vits-piper-en_US-amy-low.zip',
    folderName: 'vits-piper-en_US-amy-low',
    modelFile: 'en_US-amy-low.onnx',
  },
  {
    modelId: 'fr-FR-Siwis',
    voice: 'Siwis',
    language: 'French',
    code: 'fr',
    locale: 'fr-FR',
    url: 'https://github.com/ahmedbna/piper/releases/download/v1/vits-piper-fr_FR-siwis-low.zip',
    folderName: 'vits-piper-fr_FR-siwis-low',
    modelFile: 'fr_FR-siwis-low.onnx',
  },
  {
    modelId: 'de-DE-Thorsten',
    voice: 'Thorsten',
    language: 'German',
    code: 'de',
    locale: 'de-DE',
    url: 'https://github.com/ahmedbna/piper/releases/download/v1/vits-piper-de_DE-thorsten-low.zip',
    folderName: 'vits-piper-de_DE-thorsten-low',
    modelFile: 'de_DE-thorsten-low.onnx',
  },
  {
    modelId: 'es-ES-Carlfm',
    voice: 'Carlfm',
    language: 'Spanish',
    code: 'es',
    locale: 'es-ES',
    url: 'https://github.com/ahmedbna/piper/releases/download/v1/vits-piper-es_ES-carlfm-x_low.zip',
    folderName: 'vits-piper-es_ES-carlfm-x_low',
    modelFile: 'es_ES-carlfm-x_low.onnx',
  },
  {
    modelId: 'it-IT-Riccardo',
    voice: 'Riccardo',
    language: 'Italian',
    code: 'it',
    locale: 'it-IT',
    url: 'https://github.com/ahmedbna/piper/releases/download/v1/vits-piper-it_IT-riccardo-x_low.zip',
    folderName: 'vits-piper-it_IT-riccardo-x_low',
    modelFile: 'it_IT-riccardo-x_low.onnx',
  },
];

/* -------------------------------------------------------------------------- */
/*                                   Hook                                     */
/* -------------------------------------------------------------------------- */

export function usePiperTTS() {
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

  /* ------------------------------------------------------------------------ */
  /*                     Prevent native volume listener warning               */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!TTS?.addVolumeListener) return;

    try {
      const subscription = TTS.addVolumeListener(() => {});
      return () => subscription?.remove?.();
    } catch {
      // ignore
    }
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                              File Helpers                                */
  /* ------------------------------------------------------------------------ */

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
    model: PiperModel
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

  /* ------------------------------------------------------------------------ */
  /*                          Download + Extract Model                         */
  /* ------------------------------------------------------------------------ */

  const downloadAndExtractModel = useCallback(
    async (model: PiperModel) => {
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

  /* ------------------------------------------------------------------------ */
  /*                              Initialize TTS                              */
  /* ------------------------------------------------------------------------ */

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

        const model = PIPER_MODELS.find((m) => m.modelId === modelId);
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
    [isInitializing, currentModelId, downloadAndExtractModel]
  );

  /* ------------------------------------------------------------------------ */
  /*                                   Speak                                  */
  /* ------------------------------------------------------------------------ */

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

  /* ------------------------------------------------------------------------ */
  /*                                   API                                    */
  /* ------------------------------------------------------------------------ */

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
