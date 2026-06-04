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
// All animations use useNativeDriver: false to avoid native/JS driver conflicts
// when mixing position (top/left not supported natively) with opacity/scale.
const ND = false;

export function FloatingOverlay() {
  const {
    overlayVisible,
    activateOneTouch,
    deactivateOneTouch,
    settings,
    isProcessing,
  } = useOneTouch();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get("window");

  const initX = 12;
  const initY = insets.top + 12;

  const translateX = useRef(new Animated.Value(initX)).current;
  const translateY = useRef(new Animated.Value(initY)).current;
  const panOffset = useRef({ x: initX, y: initY });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const glowLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (overlayVisible) {
      Animated.parallel([
        Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: ND, tension: 120, friction: 8 }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: ND, tension: 120, friction: 7 }),
      ]).start();
      startPulse();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: ND }),
        Animated.timing(scaleAnim, { toValue: 0.5, duration: 200, useNativeDriver: ND }),
      ]).start();
      pulseLoop.current?.stop();
      glowLoop.current?.stop();
      pulseAnim.setValue(1);
    }
  }, [overlayVisible]);

  const startPulse = () => {
    pulseLoop.current?.stop();
    glowLoop.current?.stop();

    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: ND }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: ND }),
      ])
    );
    pulseLoop.current.start();

    glowLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: ND }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1200, useNativeDriver: ND }),
      ])
    );
    glowLoop.current.start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4,
      onPanResponderGrant: () => {
        translateX.setOffset(panOffset.current.x);
        translateY.setOffset(panOffset.current.y);
        translateX.setValue(0);
        translateY.setValue(0);
      },
      onPanResponderMove: Animated.event(
        [null, { dx: translateX, dy: translateY }],
        { useNativeDriver: ND }
      ),
      onPanResponderRelease: (_, gs) => {
        translateX.flattenOffset();
        translateY.flattenOffset();
        const newX = Math.max(4, Math.min(width - BUTTON_SIZE - 4, panOffset.current.x + gs.dx));
        const newY = Math.max(insets.top + 4, Math.min(height - BUTTON_SIZE - 100, panOffset.current.y + gs.dy));
        panOffset.current = { x: newX, y: newY };
        Animated.spring(translateX, { toValue: newX, useNativeDriver: ND, tension: 120, friction: 8 }).start();
        Animated.spring(translateY, { toValue: newY, useNativeDriver: ND, tension: 120, friction: 8 }).start();
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
    outputRange: settings.isActive
      ? ["rgba(239,68,68,0.20)", "rgba(239,68,68,0.55)"]
      : ["rgba(0,174,239,0.20)", "rgba(0,174,239,0.55)"],
  });

  const iconName: "power" | "flash" = settings.isActive ? "power" : "flash";
  const btnBg = settings.isActive ? "#EF4444" : colors.primary;
  const labelText = settings.isActive ? "Turn Off" : "Activate";

  return (
    // Single Animated.View — all animations use ND=false, no conflicts
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateX },
            { translateY },
            { scale: scaleAnim },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Glow ring */}
      <Animated.View
        style={[styles.glow, { backgroundColor: glowColor }]}
        pointerEvents="none"
      />

      {/* Pulse + button */}
      <Animated.View
        style={{ transform: [{ scale: pulseAnim }], alignItems: "center" }}
      >
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
        style={[styles.label, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.labelText, { color: colors.foreground }]}>{labelText}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 9999,
    alignItems: "center",
  },
  glow: {
    position: "absolute",
    width: BUTTON_SIZE + 28,
    height: BUTTON_SIZE + 28,
    borderRadius: (BUTTON_SIZE + 28) / 2,
    top: -14,
    left: -14,
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
    elevation: 4,
  },
  labelText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
});
