import { useState, useCallback } from 'react';
import { Directory, File, Paths } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';
import { unzip } from 'react-native-zip-archive';
import TTS from 'react-native-sherpa-onnx-offline-tts';

// types/tts.ts
export interface PiperModel {
  id: string;
  label: string;
  language: string;
  url: string; // URL to a .zip or .tar.gz containing the model files
  folderName: string; // The folder name inside the archive
  modelFile: string; // e.g., 'en_US-amy-low.onnx'
}

export const PIPER_MODELS: PiperModel[] = [
  // --- ENGLISH ---
  {
    id: 'en-US-Amy',
    label: 'English (US) - Amy',
    language: 'en-US',
    url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-en_US-amy-low.tar.bz2',
    folderName: 'vits-piper-en_US-amy-low',
    modelFile: 'en_US-amy-low.onnx',
  },
  {
    id: 'en-GB-Alan',
    label: 'English (UK) - Alan',
    language: 'en-GB',
    url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-en_GB-alan-low.tar.bz2',
    folderName: 'vits-piper-en_GB-alan-low',
    modelFile: 'en_GB-alan-low.onnx',
  },
  // --- FRENCH ---
  {
    id: 'fr-FR-Siwis',
    label: 'French - Siwis',
    language: 'fr-FR',
    url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-fr_FR-siwis-low.tar.bz2',
    folderName: 'vits-piper-fr_FR-siwis-low',
    modelFile: 'fr_FR-siwis-low.onnx',
  },
  // --- GERMAN ---
  {
    id: 'de-DE-Thorsten',
    label: 'German - Thorsten',
    language: 'de-DE',
    url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-de_DE-thorsten-low.tar.bz2',
    folderName: 'vits-piper-de_DE-thorsten-low',
    modelFile: 'de_DE-thorsten-low.onnx',
  },
  // --- SPANISH ---
  {
    id: 'es-ES-Carlfm',
    label: 'Spanish - Carlfm',
    language: 'es-ES',
    url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-es_ES-carlfm-x_low.tar.bz2',
    folderName: 'vits-piper-es_ES-carlfm-x_low',
    modelFile: 'es_ES-carlfm-x_low.onnx',
  },
  {
    id: 'es-MX-Aldo',
    label: 'Spanish (Mexico) - Aldo',
    language: 'es-MX',
    url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-es_MX-aldo-x_low.tar.bz2',
    folderName: 'vits-piper-es_MX-aldo-x_low',
    modelFile: 'es_MX-aldo-x_low.onnx',
  },
  // --- ITALIAN ---
  {
    id: 'it-IT-Riccardo',
    label: 'Italian - Riccardo',
    language: 'it-IT',
    url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-it_IT-riccardo-x_low.tar.bz2',
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

  const getTTSDirectory = useCallback(async () => {
    const documentDirectory = Paths.document;
    const directory = new Directory(documentDirectory, 'piper-models');
    if (!directory.exists) {
      directory.create({ idempotent: true, intermediates: true });
    }
    return directory;
  }, []);

  const downloadAndExtractModel = useCallback(
    async (model: PiperModel) => {
      const directory = await getTTSDirectory();
      const modelFolder = new Directory(directory, model.folderName);

      // 1. Check if model already exists
      if (modelFolder.exists) {
        return modelFolder.uri;
      }

      setIsDownloading(true);
      const zipFile = new File(directory, `${model.id}.tar.bz2`);

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

        // 2. Extract the archive
        // Note: react-native-zip-archive handles .zip.
        // For .tar.bz2, ensure your backend provides .zip or use a compatible extractor.
        await unzip(zipFile.uri, directory.uri);

        // Clean up the archive file
        await zipFile.delete();

        return modelFolder.uri;
      } catch (error) {
        console.error('TTS Download Error:', error);
        throw error;
      } finally {
        setIsDownloading(false);
      }
    },
    [getTTSDirectory]
  );

  const initializeTTS = useCallback(
    async (modelId: string) => {
      const model = PIPER_MODELS.find((m) => m.id === modelId);
      if (!model) return;

      try {
        setIsInitializing(true);
        const folderUri = await downloadAndExtractModel(model);

        // Sherpa-ONNX configuration
        const config = {
          modelPath: `${folderUri}/${model.modelFile}`,
          tokensPath: `${folderUri}/tokens.txt`,
          dataDirPath: `${folderUri}/espeak-ng-data`,
          numThreads: 4,
        };

        await TTS.initialize(JSON.stringify(config));
        setCurrentModelId(modelId);
      } catch (error) {
        console.error('TTS Init Error:', error);
      } finally {
        setIsInitializing(false);
      }
    },
    [downloadAndExtractModel]
  );

  const speak = useCallback(
    async (text: string, speed: number = 1.0) => {
      if (!currentModelId) return;
      try {
        // sid 0 is the default speaker for Piper
        await TTS.generateAndPlay(text, 0, speed);
      } catch (error) {
        console.error('Playback Error:', error);
      }
    },
    [currentModelId]
  );

  return {
    initializeTTS,
    speak,
    isDownloading,
    isInitializing,
    downloadProgress,
    currentModelId,
    availableModels: PIPER_MODELS,
  };
}
