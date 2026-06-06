import { AppRegistry, Platform } from 'react-native';
import BackgroundGeolocation from 'react-native-background-geolocation';
import App from './src/App';
import { name as appName } from './app.json';

if (Platform.OS === 'android') {
  const BackgroundTask = async (event: any) => {
    const { handleProximityEntry, handleProximityExit, recordPosition } = await import(
      './src/services/backgroundTracker'
    );

    if (event.name === 'location') {
      await recordPosition();
    }

    if (event.name === 'geofence') {
      const { prospectId } = event.extras || {};
      if (prospectId) {
        if (event.action === 'ENTER') {
          await handleProximityEntry(prospectId);
        } else if (event.action === 'EXIT') {
          await handleProximityExit(prospectId);
        }
      }
    }

    if (event.name === 'heartbeat') {
      const { checkProximity } = await import('./src/services/backgroundTracker');
      await checkProximity();
    }
  };

  BackgroundGeolocation.registerHeadlessTask(BackgroundTask);
}

AppRegistry.registerComponent(appName, () => App);
