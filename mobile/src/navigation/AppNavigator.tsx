import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../store/authStore';
import { COLORS } from '../utils/constants';
import type { RootStackParamList } from '../types';
import LoginScreen from '../screens/LoginScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import TabNavigator from './TabNavigator';
import ProspectDetailScreen from '../screens/ProspectDetailScreen';
import CalibrationScreen from '../screens/CalibrationScreen';
import ActiveVisitScreen from '../screens/ActiveVisitScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated, isLoading, checkAuth, user } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
      }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const needsPasswordChange = user?.premierConnexion && user?.role === 'directeur';

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.white,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
          contentStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : needsPasswordChange ? (
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{
              title: 'Changer le mot de passe',
              headerBackVisible: false,
            }}
          />
        ) : (
          <>
            <Stack.Screen
              name="MainTabs"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ProspectDetail"
              component={ProspectDetailScreen}
              options={{
                title: 'Détail du prospect',
              }}
            />
            <Stack.Screen
              name="Calibration"
              component={CalibrationScreen}
              options={{
                title: 'Calibration GPS',
              }}
            />
            <Stack.Screen
              name="ActiveVisit"
              component={ActiveVisitScreen}
              options={{
                title: 'Visite en cours',
                headerBackVisible: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
