import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './store/authStore';
import { VisitProvider } from './store/visitStore';
import { ProspectProvider } from './store/prospectStore';
import AppNavigator from './navigation/AppNavigator';
import OfflineBanner from './components/OfflineBanner';
import { getDatabase } from './services/database';
import { startTracking } from './services/location';
import { startBackgroundTracking } from './services/backgroundTracker';
import { addConnectivityListener, startPeriodicSync } from './services/sync';
import { COLORS } from './utils/constants';

function AppInitializer({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await getDatabase();
        await startBackgroundTracking();
        const trackingStarted = await startTracking();
        if (!trackingStarted) {
          console.warn('GPS tracking could not be started - check permissions');
        }
      } catch (error) {
        console.warn('App initialization error:', error);
      }
    }

    init();

    const removeConnectivity = addConnectivityListener((isConnected) => {
      setIsOffline(!isConnected);
    });

    let stopSync: (() => void) | undefined;
    startPeriodicSync(300000).then((stop) => {
      stopSync = stop;
    });

    return () => {
      removeConnectivity();
      if (stopSync) stopSync();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      <OfflineBanner isVisible={isOffline} />
      {children}
      <Toast />
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProspectProvider>
        <VisitProvider>
          <AppInitializer>
            <AppNavigator />
          </AppInitializer>
        </VisitProvider>
      </ProspectProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
