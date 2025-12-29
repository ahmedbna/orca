import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { usePiperTTS } from '@/hooks/usePiperTTS';

export const Piper = () => {
  const {
    availableModels,
    initializeTTS,
    speak,
    currentModelId,
    isDownloading,
    downloadProgress,
  } = usePiperTTS();

  const handlePress = async (modelId: string) => {
    if (currentModelId !== modelId) {
      await initializeTTS(modelId);
    }
    const phrase =
      modelId === 'en-US' ? 'Learning is fun!' : 'Lernen macht Spaß!';
    speak(phrase);
  };

  return (
    <View style={{ padding: 20 }}>
      {availableModels.map((model) => (
        <TouchableOpacity
          key={model.id}
          onPress={() => handlePress(model.id)}
          style={{ padding: 15, backgroundColor: '#f0f0f0', marginVertical: 5 }}
        >
          <Text>{model.label}</Text>
          {isDownloading && downloadProgress[model.id] < 1 && (
            <Text>
              Downloading: {(downloadProgress[model.id] * 100).toFixed(0)}%
            </Text>
          )}
        </TouchableOpacity>
      ))}
      {currentModelId && <Text>Current Voice: {currentModelId}</Text>}
    </View>
  );
};
