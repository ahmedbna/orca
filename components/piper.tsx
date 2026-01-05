// components/piper.tsx

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { usePiperTTS } from '@/hooks/usePiperTTS';
import { Button } from '@/components/ui/button';

export const Piper = () => {
  const {
    availableModels,
    initializeTTS,
    speak,
    currentModelId,
    isDownloading,
    isInitializing,
    downloadProgress,
  } = usePiperTTS();

  const handlePress = async (modelId: string) => {
    if (currentModelId !== modelId) {
      await initializeTTS(modelId);
    }
  };

  return (
    <View style={{ padding: 20, paddingTop: 200 }}>
      {availableModels.map((model) => {
        const isActive = currentModelId === model.modelId;
        const progress = downloadProgress[model.modelId];

        return (
          <TouchableOpacity
            key={model.modelId}
            disabled={isDownloading || isInitializing}
            onPress={() => handlePress(model.modelId)}
            style={{
              padding: 15,
              backgroundColor: isActive ? '#d1fae5' : '#f0f0f0',
              marginVertical: 6,
              borderRadius: 10,
              opacity: isDownloading || isInitializing ? 0.5 : 1,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600' }}>
              {model.language} — {model.voice}
            </Text>

            <Text style={{ fontSize: 12, opacity: 0.6 }}>{model.locale}</Text>

            {progress != null && progress < 1 && (
              <Text style={{ marginTop: 4 }}>
                Downloading {(progress * 100).toFixed(0)}%
              </Text>
            )}
          </TouchableOpacity>
        );
      })}

      {currentModelId && (
        <Text style={{ marginTop: 16 }}>Current Voice: {currentModelId}</Text>
      )}

      {!isInitializing && currentModelId && (
        <Button
          variant='success'
          onPress={async () => await speak('Lernen macht Spaß!', 0.6)}
          style={{ marginTop: 16 }}
        >
          Speak
        </Button>
      )}
    </View>
  );
};
