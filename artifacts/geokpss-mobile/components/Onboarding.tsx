import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { QuizSlide } from '@/components/onboarding/QuizSlide';
import { ReviewSlide } from '@/components/onboarding/ReviewSlide';
import { ONBOARDING_STEPS } from '@/components/onboarding/theme';
import { WelcomeSlide } from '@/components/onboarding/WelcomeSlide';
import { useAppTheme } from '@/context/ThemeContext';

// v3: the redesigned flow should be shown once to installs that skipped it.
const STORAGE_KEY = 'geokpss-onboarded-v3';

const HAPTICS_ENABLED = Platform.OS !== 'web';

function tapFeedback() {
  if (!HAPTICS_ENABLED) return;
  void Haptics.selectionAsync().catch(() => {});
}

/**
 * First-launch onboarding: a three-page pager that introduces the map, the map
 * quiz and the spaced-repetition schedule, then hands over to the map tab.
 */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const { isDark } = useAppTheme();
  const [visible, setVisible] = useState(false);
  const [page, setPage] = useState(0);
  const pageRef = useRef(0);
  const pagerRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (active && saved !== '1') setVisible(true);
      })
      .catch(() => {
        if (active) setVisible(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const finish = useCallback(() => {
    setVisible(false);
    void AsyncStorage.setItem(STORAGE_KEY, '1');
    if (HAPTICS_ENABLED) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, []);

  const goTo = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(ONBOARDING_STEPS - 1, index));
      pagerRef.current?.scrollTo({ x: next * width, animated: true });
      pageRef.current = next;
      setPage(next);
      tapFeedback();
    },
    [width],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / width);
      if (next === pageRef.current) return;
      pageRef.current = next;
      setPage(next);
      tapFeedback();
    },
    [width],
  );

  return (
    <>
      {children}
      <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" onRequestClose={finish}>
        <View style={styles.pagerRoot}>
          <ScrollView
            ref={pagerRef}
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={32}
            style={styles.pager}
          >
            <View style={[styles.page, { width, height }]}>
              <WelcomeSlide onNext={() => goTo(1)} onSkip={finish} />
            </View>
            <View style={[styles.page, { width, height }]}>
              <QuizSlide onBack={() => goTo(0)} onSkip={finish} onNext={() => goTo(2)} />
            </View>
            <View style={[styles.page, { width, height }]}>
              <ReviewSlide onBack={() => goTo(1)} onFinish={finish} />
            </View>
          </ScrollView>
          {visible ? <StatusBar style={page === 0 || isDark ? 'light' : 'dark'} animated /> : null}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pagerRoot: { flex: 1, backgroundColor: '#04191A' },
  pager: { flex: 1 },
  page: { overflow: 'hidden' },
});
