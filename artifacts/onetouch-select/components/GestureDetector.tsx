import React, { useEffect, useRef } from "react";
import { Dimensions, PanResponder, StyleSheet, View } from "react-native";

import { useOneTouch } from "@/context/OneTouchContext";

const EDGE_WIDTH = 24;
const TRIPLE_TAP_THRESHOLD = 450;
const { height } = Dimensions.get("window");

export function GestureDetector({ children }: { children: React.ReactNode }) {
  const { settings, showOverlay, overlayVisible, hideOverlay } = useOneTouch();
  const tapTimestamps = useRef<number[]>([]);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const handleEdgeTap = () => {
    if (!settings.gestureEnabled) return;
    const now = Date.now();
    tapTimestamps.current = [
      ...tapTimestamps.current.filter((t) => now - t < TRIPLE_TAP_THRESHOLD),
      now,
    ];

    if (tapTimestamps.current.length >= 3) {
      tapTimestamps.current = [];
      if (overlayVisible) {
        hideOverlay();
      } else {
        showOverlay();
        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => {
          hideOverlay();
        }, 8000);
      }
    }
  };

  const edgePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => {
        return e.nativeEvent.locationX <= EDGE_WIDTH;
      },
      onPanResponderGrant: handleEdgeTap,
      onPanResponderRelease: () => {},
    })
  ).current;

  return (
    <View style={styles.root}>
      {children}
      <View
        style={styles.edgeZone}
        {...edgePanResponder.panHandlers}
        pointerEvents="box-only"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  edgeZone: {
    position: "absolute",
    left: 0,
    top: 0,
    width: EDGE_WIDTH,
    height: height,
    zIndex: 8888,
  },
});
