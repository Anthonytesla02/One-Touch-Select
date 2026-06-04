import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useOneTouch } from "@/context/OneTouchContext";
import { useColors } from "@/hooks/useColors";

const BUTTON_SIZE = 64;

export function FloatingOverlay() {
  const { overlayVisible, hideOverlay, activateOneTouch, deactivateOneTouch, settings, isProcessing } =
    useOneTouch();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get("window");

  const pos = useRef(new Animated.ValueXY({ x: 12, y: insets.top + 12 })).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const panOffset = useRef({ x: 12, y: insets.top + 12 });

  useEffect(() => {
    if (overlayVisible) {
      Animated.parallel([
        Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 7 }),
      ]).start();
      startPulse();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.5, duration: 200, useNativeDriver: true }),
      ]).start();
      pulseAnim.stopAnimation();
      glowAnim.stopAnimation();
    }
  }, [overlayVisible]);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1200, useNativeDriver: false }),
      ])
    ).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4,
      onPanResponderGrant: () => {
        pos.setOffset({ x: panOffset.current.x, y: panOffset.current.y });
        pos.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gs) => {
        pos.flattenOffset();
        const currentX = panOffset.current.x + gs.dx;
        const currentY = panOffset.current.y + gs.dy;
        const clampedX = Math.max(4, Math.min(width - BUTTON_SIZE - 4, currentX));
        const clampedY = Math.max(insets.top + 4, Math.min(height - BUTTON_SIZE - 80, currentY));
        panOffset.current = { x: clampedX, y: clampedY };
        Animated.spring(pos, {
          toValue: { x: clampedX, y: clampedY },
          useNativeDriver: false,
          tension: 120,
          friction: 8,
        }).start();
      },
    })
  ).current;

  const handlePress = async () => {
    if (isProcessing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (settings.isActive) {
      await deactivateOneTouch();
    } else {
      await activateOneTouch();
    }
  };

  if (!overlayVisible) return null;

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      settings.isActive ? "rgba(239,68,68,0.3)" : "rgba(0,174,239,0.3)",
      settings.isActive ? "rgba(239,68,68,0.7)" : "rgba(0,174,239,0.7)",
    ],
  });

  const iconName = settings.isActive ? "power" : "flash";
  const btnBg = settings.isActive ? "#EF4444" : colors.primary;
  const labelText = settings.isActive ? "Turn Off" : "Activate";

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          left: pos.x,
          top: pos.y,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <Animated.View
        style={[
          styles.glow,
          {
            shadowColor: glowColor as unknown as string,
            backgroundColor: glowColor as unknown as string,
          },
        ]}
      />
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.85}
          style={[
            styles.button,
            {
              backgroundColor: btnBg,
              borderColor: settings.isActive
                ? "rgba(239,68,68,0.4)"
                : "rgba(0,174,239,0.4)",
            },
          ]}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name={iconName} size={26} color="#fff" />
          )}
        </TouchableOpacity>
      </Animated.View>
      <View
        style={[
          styles.label,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text
          style={[styles.labelText, { color: colors.foreground }]}
        >
          {labelText}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 9999,
    alignItems: "center",
  },
  glow: {
    position: "absolute",
    width: BUTTON_SIZE + 20,
    height: BUTTON_SIZE + 20,
    borderRadius: (BUTTON_SIZE + 20) / 2,
    top: -10,
    left: -10,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    shadowOpacity: 1,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
  label: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  labelText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
});
