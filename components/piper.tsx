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
      {availableModels.map((model) => (
        <TouchableOpacity
          key={model.id}
          disabled={isDownloading || isInitializing}
          onPress={() => handlePress(model.id)}
          style={{
            padding: 15,
            backgroundColor: '#f0f0f0',
            marginVertical: 5,
            opacity: isDownloading || isInitializing ? 0.5 : 1,
          }}
        >
          <Text>{model.label}</Text>

          {downloadProgress[model.id] != null &&
            downloadProgress[model.id] < 1 && (
              <Text>
                Downloading {(downloadProgress[model.id] * 100).toFixed(0)}%
              </Text>
            )}
        </TouchableOpacity>
      ))}

      {currentModelId && <Text>Current Voice: {currentModelId}</Text>}

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
