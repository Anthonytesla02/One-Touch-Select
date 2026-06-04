import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.text, { color: colors.mutedForeground }]}>{title.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
  },
});
