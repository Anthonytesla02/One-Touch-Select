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
}

export function StatusCard({ icon, title, value, enabled, accent }: StatusCardProps) {
  const colors = useColors();
  const iconColor = enabled ? (accent ?? colors.primary) : colors.mutedForeground;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: enabled ? (accent ?? colors.primary) + "40" : colors.border,
          borderWidth: enabled ? 1.5 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: iconColor + "18" },
        ]}
      >
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.mutedForeground }]}>{title}</Text>
        <Text style={[styles.value, { color: enabled ? colors.foreground : colors.mutedForeground }]}>
          {value}
        </Text>
      </View>
      <View
        style={[
          styles.dot,
          { backgroundColor: enabled ? "#22C55E" : colors.mutedForeground + "60" },
        ]}
      />
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
