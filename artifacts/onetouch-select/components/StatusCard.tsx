import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface StatusCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  enabled: boolean;
  accent?: string;
  apkRequired?: boolean;
}

export function StatusCard({
  icon,
  title,
  value,
  enabled,
  accent,
  apkRequired,
}: StatusCardProps) {
  const colors = useColors();
  const iconColor = enabled
    ? apkRequired
      ? "#F59E0B"
      : (accent ?? colors.primary)
    : colors.mutedForeground;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: enabled
            ? apkRequired
              ? "#F59E0B40"
              : (accent ?? colors.primary) + "40"
            : colors.border,
          borderWidth: enabled ? 1.5 : 1,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconColor + "18" }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.mutedForeground }]}>
          {title}
        </Text>
        <Text
          style={[
            styles.value,
            { color: enabled ? colors.foreground : colors.mutedForeground },
          ]}
        >
          {value}
        </Text>
      </View>
      <View style={styles.rightCol}>
        {apkRequired && enabled ? (
          <View
            style={[styles.apkBadge, { backgroundColor: "#F59E0B20", borderColor: "#F59E0B50" }]}
          >
            <Text style={styles.apkBadgeText}>APK</Text>
          </View>
        ) : (
          <View
            style={[
              styles.dot,
              {
                backgroundColor: enabled
                  ? "#22C55E"
                  : colors.mutedForeground + "60",
              },
            ]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 14,
    fontWeight: "700",
  },
  rightCol: {
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  apkBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  apkBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#F59E0B",
    letterSpacing: 0.5,
  },
});
