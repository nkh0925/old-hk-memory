import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsContextType {
  isAiModeEnabled: boolean;
  toggleAiMode: (value: boolean) => Promise<void>;
  isModalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = '@old_hk_ai_mode';

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAiModeEnabled, setIsAiModeEnabled] = useState<boolean>(false);
  const [isModalVisible, setModalVisible] = useState<boolean>(false);

  // Load persisted state on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedMode !== null) {
          setIsAiModeEnabled(JSON.parse(savedMode));
        }
      } catch (error) {
        console.error('Failed to load AI settings:', error);
      }
    };
    loadSettings();
  }, []);

  const toggleAiMode = async (value: boolean) => {
    try {
      setIsAiModeEnabled(value);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save AI settings:', error);
    }
  };

  return (
    <SettingsContext.Provider 
      value={{ 
        isAiModeEnabled, 
        toggleAiMode, 
        isModalVisible, 
        setModalVisible 
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};