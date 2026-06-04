import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SectionHeader } from "@/components/SectionHeader";
import { SettingRow } from "@/components/SettingRow";
import { useOneTouch } from "@/context/OneTouchContext";
import { useColors } from "@/hooks/useColors";

const RINGTONES = [
  { name: "Default", uri: null },
  { name: "Classic Ring", uri: "classic" },
  { name: "Digital Pulse", uri: "digital" },
  { name: "Soft Chime", uri: "chime" },
  { name: "Deep Bass", uri: "bass" },
  { name: "Retro Dial", uri: "retro" },
];

const VOLUME_STEPS = [20, 40, 60, 80, 100];

export default function SettingsScreen() {
  const colors = useColors();
  const { settings, updateSettings } = useOneTouch();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [ringtoneModal, setRingtoneModal] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const handleLocationToggle = async (val: boolean) => {
    if (val && Platform.OS !== "web") {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required to use this feature.");
        return;
      }
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateSettings({ locationEnabled: val });
  };

  const handleVolumeStep = (step: number) => {
    Haptics.selectionAsync();
    updateSettings({ volumeLevel: step });
  };

  const handleRingtoneSelect = (r: typeof RINGTONES[0]) => {
    Haptics.selectionAsync();
    updateSettings({ ringtoneUri: r.uri, ringtoneName: r.name });
    setRingtoneModal(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topInset + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Gesture */}
        <SectionHeader title="Gesture Trigger" />
        <SettingRow
          icon="finger-print-outline"
          title="Triple-tap Edge Gesture"
          subtitle="Triple-tap the left edge of your screen"
          value={settings.gestureEnabled}
          onToggle={(v) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            updateSettings({ gestureEnabled: v });
          }}
          accent="#A855F7"
        />

        {/* Appearance */}
        <SectionHeader title="Appearance" />
        <SettingRow
          icon="moon-outline"
          title="Change Dark Mode"
          subtitle="Switches theme when OneTouch activates"
          value={settings.darkModeEnabled}
          onToggle={(v) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            updateSettings({ darkModeEnabled: v });
          }}
        />
        {settings.darkModeEnabled && (
          <View style={[styles.subOption, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.modeBtn,
                {
                  backgroundColor: settings.darkMode ? colors.primary : "transparent",
                  borderColor: settings.darkMode ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                updateSettings({ darkMode: true });
              }}
            >
              <Ionicons name="moon" size={16} color={settings.darkMode ? "#fff" : colors.mutedForeground} />
              <Text style={[styles.modeBtnText, { color: settings.darkMode ? "#fff" : colors.mutedForeground }]}>
                Dark
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeBtn,
                {
                  backgroundColor: !settings.darkMode ? colors.primary : "transparent",
                  borderColor: !settings.darkMode ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                updateSettings({ darkMode: false });
              }}
            >
              <Ionicons name="sunny" size={16} color={!settings.darkMode ? "#fff" : colors.mutedForeground} />
              <Text style={[styles.modeBtnText, { color: !settings.darkMode ? "#fff" : colors.mutedForeground }]}>
                Light
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Volume */}
        <SectionHeader title="Volume" />
        <SettingRow
          icon="volume-high-outline"
          title="Control Volume"
          subtitle="Adjusts media volume when active"
          value={settings.volumeEnabled}
          onToggle={(v) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            updateSettings({ volumeEnabled: v });
          }}
        />
        {settings.volumeEnabled && (
          <View style={[styles.subOption, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Target Volume Level</Text>
            <View style={styles.volumeSteps}>
              {VOLUME_STEPS.map((step) => (
                <TouchableOpacity
                  key={step}
                  style={[
                    styles.volStep,
                    {
                      backgroundColor: settings.volumeLevel === step ? colors.primary : colors.card,
                      borderColor: settings.volumeLevel === step ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleVolumeStep(step)}
                >
                  <Text
                    style={[
                      styles.volStepText,
                      { color: settings.volumeLevel === step ? "#fff" : colors.mutedForeground },
                    ]}
                  >
                    {step}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Ringtone */}
        <SectionHeader title="Ringtone" />
        <SettingRow
          icon="musical-notes-outline"
          title="Change Ringtone"
          subtitle="Switches ringtone when OneTouch activates"
          value={settings.ringtoneEnabled}
          onToggle={(v) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            updateSettings({ ringtoneEnabled: v });
          }}
          accent="#F59E0B"
        />
        {settings.ringtoneEnabled && (
          <SettingRow
            icon="musical-note-outline"
            title="Selected Ringtone"
            subtitle={settings.ringtoneName}
            onPress={() => setRingtoneModal(true)}
            showChevron
            accent="#F59E0B"
          />
        )}

        {/* Location */}
        <SectionHeader title="Location" />
        <SettingRow
          icon="location-outline"
          title="Location Access"
          subtitle="Show current location in status card"
          value={settings.locationEnabled}
          onToggle={handleLocationToggle}
          accent="#22C55E"
        />

        {/* Info */}
        <SectionHeader title="How It Works" />
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <View style={[styles.infoBullet, { backgroundColor: colors.primary }]} />
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              Triple-tap the left edge of your screen to show/hide the overlay
            </Text>
          </View>
          <View style={styles.infoRow}>
            <View style={[styles.infoBullet, { backgroundColor: "#22C55E" }]} />
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              Tap the overlay button to activate OneTouch — applies all your configured settings
            </Text>
          </View>
          <View style={styles.infoRow}>
            <View style={[styles.infoBullet, { backgroundColor: "#EF4444" }]} />
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              Tap again while active to deactivate and restore previous settings
            </Text>
          </View>
          <View style={styles.infoRow}>
            <View style={[styles.infoBullet, { backgroundColor: "#A855F7" }]} />
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              You can also drag the overlay icon anywhere on screen
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Ringtone Modal */}
      <Modal
        visible={ringtoneModal}
        transparent
        animationType="slide"
        onRequestClose={() => setRingtoneModal(false)}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          activeOpacity={1}
          onPress={() => setRingtoneModal(false)}
        />
        <View
          style={[
            styles.modalSheet,
            {
              backgroundColor: colors.card,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Select Ringtone</Text>
          {RINGTONES.map((r) => (
            <TouchableOpacity
              key={r.name}
              style={[
                styles.ringtoneItem,
                {
                  backgroundColor:
                    settings.ringtoneName === r.name ? colors.primary + "18" : "transparent",
                  borderColor:
                    settings.ringtoneName === r.name ? colors.primary + "60" : "transparent",
                },
              ]}
              onPress={() => handleRingtoneSelect(r)}
            >
              <Ionicons
                name={settings.ringtoneName === r.name ? "radio-button-on" : "radio-button-off"}
                size={20}
                color={settings.ringtoneName === r.name ? colors.primary : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.ringtoneText,
                  {
                    color:
                      settings.ringtoneName === r.name ? colors.primary : colors.foreground,
                  },
                ]}
              >
                {r.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  subOption: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  modeBtnText: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  volumeSteps: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  volStep: {
    flex: 1,
    minWidth: 50,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
  },
  volStepText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  infoBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    flexShrink: 0,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 19,
    fontFamily: "Inter_400Regular",
  },
  modalOverlay: {
    flex: 1,
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 14,
    paddingHorizontal: 20,
    gap: 4,
  },
  modalHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    fontFamily: "Inter_700Bold",
  },
  ringtoneItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 4,
  },
  ringtoneText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
