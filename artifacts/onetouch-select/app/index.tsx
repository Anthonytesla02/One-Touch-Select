import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FloatingOverlay } from "@/components/FloatingOverlay";
import { SectionHeader } from "@/components/SectionHeader";
import { StatusCard } from "@/components/StatusCard";
import { useOneTouch } from "@/context/OneTouchContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const { settings, showOverlay, overlayVisible, hideOverlay } = useOneTouch();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.4)).current;

  const [locationName, setLocationName] = useState<string>("–");

  useEffect(() => {
    startIdlePulse();
    fetchLocation();
  }, []);

  const startIdlePulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1.3, duration: 1400, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0, duration: 1400, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.4, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();
  };

  const fetchLocation = async () => {
    if (!settings.locationEnabled) return;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const rev = await Location.reverseGeocodeAsync(loc.coords);
      if (rev.length > 0) {
        setLocationName(rev[0].city ?? rev[0].subregion ?? "Unknown");
      }
    } catch {}
  };

  const handleManualTrigger = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (overlayVisible) {
      hideOverlay();
    } else {
      showOverlay();
    }
  };

  const isActive = settings.isActive;

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.statusBar}
        backgroundColor={colors.background}
        translucent={false}
      />

      <FloatingOverlay />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topInset + 16, paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.appName, { color: colors.foreground }]}>OneTouch</Text>
            <Text style={[styles.appSub, { color: colors.primary }]}>Select</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            style={[styles.settingsBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.75}
          >
            <Ionicons name="settings-outline" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isActive ? "#22C55E18" : colors.muted,
              borderColor: isActive ? "#22C55E60" : colors.border,
            },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: isActive ? "#22C55E" : colors.mutedForeground }]} />
          <Text style={[styles.statusText, { color: isActive ? "#22C55E" : colors.mutedForeground }]}>
            {isActive ? "OneTouch Active" : "OneTouch Standby"}
          </Text>
        </View>

        {/* Main trigger button */}
        <View style={styles.triggerWrap}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                borderColor: isActive ? "#EF444440" : colors.primary + "40",
                transform: [{ scale: pulseScale }],
                opacity: pulseOpacity,
              },
            ]}
          />
          <TouchableOpacity
            style={[
              styles.triggerBtn,
              {
                backgroundColor: isActive ? "#EF4444" : colors.primary,
                shadowColor: isActive ? "#EF4444" : colors.primary,
              },
            ]}
            onPress={handleManualTrigger}
            activeOpacity={0.85}
          >
            <Ionicons name={overlayVisible ? "close" : "flash"} size={42} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.triggerLabel, { color: colors.mutedForeground }]}>
            {overlayVisible ? "Tap to dismiss overlay" : "Tap to show overlay"}
          </Text>
          <Text style={[styles.triggerHint, { color: colors.mutedForeground }]}>
            Triple-tap left edge to trigger anywhere
          </Text>
        </View>

        {/* Config summary */}
        <SectionHeader title="Current Config" />
        <StatusCard
          icon="moon-outline"
          title="Dark Mode"
          value={settings.darkModeEnabled ? (settings.darkMode ? "On when active" : "Off when active") : "Not configured"}
          enabled={settings.darkModeEnabled}
        />
        <StatusCard
          icon="volume-high-outline"
          title="Volume"
          value={settings.volumeEnabled ? `${settings.volumeLevel}% when active` : "Not configured"}
          enabled={settings.volumeEnabled}
        />
        <StatusCard
          icon="musical-notes-outline"
          title="Ringtone"
          value={settings.ringtoneEnabled ? settings.ringtoneName : "Not configured"}
          enabled={settings.ringtoneEnabled}
          accent="#F59E0B"
        />
        <StatusCard
          icon="location-outline"
          title="Location"
          value={settings.locationEnabled ? locationName : "Disabled"}
          enabled={settings.locationEnabled}
          accent="#22C55E"
        />

        <SectionHeader title="Gesture" />
        <StatusCard
          icon="finger-print-outline"
          title="Triple-tap Edge"
          value={settings.gestureEnabled ? "Enabled — tap left edge ×3" : "Disabled"}
          enabled={settings.gestureEnabled}
          accent="#A855F7"
        />
      </ScrollView>

      {/* Bottom FAB */}
      <View
        style={[
          styles.fab,
          {
            bottom: insets.bottom + (Platform.OS === "web" ? 34 : 16),
            backgroundColor: isActive ? "#EF4444" : colors.primary,
            shadowColor: isActive ? "#EF4444" : colors.primary,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.fabInner}
          onPress={handleManualTrigger}
          activeOpacity={0.85}
        >
          <Ionicons name="flash" size={22} color="#fff" />
          <Text style={styles.fabText}>{overlayVisible ? "Dismiss" : "Show Overlay"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    fontFamily: "Inter_700Bold",
  },
  appSub: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: "Inter_600SemiBold",
    marginTop: -2,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 8,
    marginBottom: 32,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    fontFamily: "Inter_600SemiBold",
  },
  triggerWrap: {
    alignItems: "center",
    marginBottom: 36,
    gap: 12,
  },
  pulseRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    top: "50%",
    left: "50%",
    marginLeft: -70,
    marginTop: -70,
  },
  triggerBtn: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  triggerLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
    fontFamily: "Inter_600SemiBold",
  },
  triggerHint: {
    fontSize: 12,
    fontWeight: "400",
    fontFamily: "Inter_400Regular",
  },
  fab: {
    position: "absolute",
    right: 20,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  fabInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  fabText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});
