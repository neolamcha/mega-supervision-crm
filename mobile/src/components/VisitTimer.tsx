import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/constants';
import { formatDuration } from '../utils/format';

interface Props {
  elapsedSeconds: number;
  isPaused?: boolean;
}

export default function VisitTimer({ elapsedSeconds, isPaused }: Props) {
  const [displaySeconds, setDisplaySeconds] = useState(elapsedSeconds);

  useEffect(() => {
    setDisplaySeconds(elapsedSeconds);
  }, [elapsedSeconds]);

  return (
    <View style={styles.container}>
      {isPaused && (
        <View style={styles.pauseOverlay}>
          <Text style={styles.pauseText}>PAUSE</Text>
        </View>
      )}
      <Text style={[styles.timer, isPaused && styles.timerPaused]}>
        {formatDuration(displaySeconds)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
  },
  timer: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  timerPaused: {
    color: COLORS.gray400,
  },
  pauseOverlay: {
    position: 'absolute',
    top: -8,
    right: -20,
    backgroundColor: COLORS.warning,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 1,
  },
  pauseText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1,
  },
});
