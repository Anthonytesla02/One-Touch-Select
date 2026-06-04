import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Appearance,
  Platform,
  useColorScheme,
} from "react-native";

export interface OneTouchSettings {
  darkMode: boolean;
  darkModeEnabled: boolean;
  volumeLevel: number;
  volumeEnabled: boolean;
  ringtoneUri: string | null;
  ringtoneName: string;
  ringtoneEnabled: boolean;
  locationEnabled: boolean;
  gestureEnabled: boolean;
  isActive: boolean;
}

export interface PreState {
  darkMode: string | "light" | "dark" | null;
  volumeLevel: number;
  ringtoneUri: string | null;
}

interface OneTouchContextType {
  settings: OneTouchSettings;
  updateSettings: (partial: Partial<OneTouchSettings>) => void;
  overlayVisible: boolean;
  showOverlay: () => void;
  hideOverlay: () => void;
  activateOneTouch: () => Promise<void>;
  deactivateOneTouch: () => Promise<void>;
  isProcessing: boolean;
  preState: PreState | null;
}

const defaultSettings: OneTouchSettings = {
  darkMode: true,
  darkModeEnabled: true,
  volumeLevel: 80,
  volumeEnabled: true,
  ringtoneUri: null,
  ringtoneName: "Default",
  ringtoneEnabled: false,
  locationEnabled: false,
  gestureEnabled: true,
  isActive: false,
};

const STORAGE_KEY = "@onetouch_settings";
const PRE_STATE_KEY = "@onetouch_prestate";

const OneTouchContext = createContext<OneTouchContextType | null>(null);

export function OneTouchProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<OneTouchSettings>(defaultSettings);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preState, setPreState] = useState<PreState | null>(null);
  const colorScheme = useColorScheme();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<OneTouchSettings>;
        setSettings((prev) => ({ ...prev, ...saved, isActive: false }));
      }
    } catch {}
  };

  const saveSettings = async (s: OneTouchSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {}
  };

  const updateSettings = useCallback((partial: Partial<OneTouchSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  const showOverlay = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOverlayVisible(true);
  }, []);

  const hideOverlay = useCallback(() => {
    setOverlayVisible(false);
  }, []);

  const capturePreState = useCallback(async (): Promise<PreState> => {
    const state: PreState = {
      darkMode: colorScheme ?? "light",
      volumeLevel: 50,
      ringtoneUri: null,
    };
    try {
      await AsyncStorage.setItem(PRE_STATE_KEY, JSON.stringify(state));
    } catch {}
    setPreState(state);
    return state;
  }, [colorScheme]);

  const activateOneTouch = useCallback(async () => {
    setIsProcessing(true);
    try {
      await capturePreState();

      if (settings.darkModeEnabled && Platform.OS !== "web") {
        Appearance.setColorScheme(settings.darkMode ? "dark" : "light");
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      updateSettings({ isActive: true });
    } finally {
      setIsProcessing(false);
      setOverlayVisible(false);
    }
  }, [settings, capturePreState, updateSettings]);

  const deactivateOneTouch = useCallback(async () => {
    setIsProcessing(true);
    try {
      const saved = preState;

      if (saved && Platform.OS !== "web") {
        Appearance.setColorScheme(
          saved.darkMode === "dark" ? "dark" : "light"
        );
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      updateSettings({ isActive: false });
      setPreState(null);
    } finally {
      setIsProcessing(false);
      setOverlayVisible(false);
    }
  }, [preState, updateSettings]);

  return (
    <OneTouchContext.Provider
      value={{
        settings,
        updateSettings,
        overlayVisible,
        showOverlay,
        hideOverlay,
        activateOneTouch,
        deactivateOneTouch,
        isProcessing,
        preState,
      }}
    >
      {children}
    </OneTouchContext.Provider>
  );
}

export function useOneTouch() {
  const ctx = useContext(OneTouchContext);
  if (!ctx) throw new Error("useOneTouch must be used within OneTouchProvider");
  return ctx;
}
