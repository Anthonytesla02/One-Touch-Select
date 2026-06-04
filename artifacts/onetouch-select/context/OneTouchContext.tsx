import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Appearance, Platform, useColorScheme } from "react-native";

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
  colorScheme: "light" | "dark";
  volumeLevel: number;
}

export interface ActivationResult {
  darkMode: "applied" | "apk_required" | "skipped";
  volume: "applied" | "apk_required" | "skipped";
  ringtone: "applied" | "apk_required" | "skipped";
  location: "applied" | "skipped";
}

interface OneTouchContextType {
  settings: OneTouchSettings;
  updateSettings: (partial: Partial<OneTouchSettings>) => void;
  overlayVisible: boolean;
  showOverlay: () => void;
  hideOverlay: () => void;
  activateOneTouch: () => Promise<ActivationResult>;
  deactivateOneTouch: () => Promise<void>;
  isProcessing: boolean;
  preState: PreState | null;
  lastResult: ActivationResult | null;
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

const STORAGE_KEY = "@onetouch_settings_v2";

const OneTouchContext = createContext<OneTouchContextType | null>(null);

export function OneTouchProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<OneTouchSettings>(defaultSettings);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preState, setPreState] = useState<PreState | null>(null);
  const [lastResult, setLastResult] = useState<ActivationResult | null>(null);
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

  const activateOneTouch = useCallback(async (): Promise<ActivationResult> => {
    setIsProcessing(true);
    const result: ActivationResult = {
      darkMode: "skipped",
      volume: "skipped",
      ringtone: "skipped",
      location: "skipped",
    };

    try {
      // Capture pre-state before making changes
      const captured: PreState = {
        colorScheme: colorScheme ?? "light",
        volumeLevel: settings.volumeLevel,
      };
      setPreState(captured);

      // Dark mode — works in Expo Go (in-app) and in APK (system-wide)
      if (settings.darkModeEnabled && Platform.OS !== "web") {
        Appearance.setColorScheme(settings.darkMode ? "dark" : "light");
        result.darkMode = "applied";
      } else if (settings.darkModeEnabled) {
        result.darkMode = "skipped";
      }

      // Volume — requires native build (AudioManager)
      if (settings.volumeEnabled) {
        result.volume = "apk_required";
      }

      // Ringtone — requires native build (RingtoneManager + WRITE_SETTINGS)
      if (settings.ringtoneEnabled) {
        result.ringtone = "apk_required";
      }

      // Location — just a display feature, always available
      if (settings.locationEnabled) {
        result.location = "applied";
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLastResult(result);
      updateSettings({ isActive: true });
      return result;
    } finally {
      setIsProcessing(false);
      setOverlayVisible(false);
    }
  }, [settings, colorScheme, updateSettings]);

  const deactivateOneTouch = useCallback(async () => {
    setIsProcessing(true);
    try {
      if (preState && Platform.OS !== "web") {
        Appearance.setColorScheme(preState.colorScheme);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      updateSettings({ isActive: false });
      setPreState(null);
      setLastResult(null);
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
        lastResult,
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
