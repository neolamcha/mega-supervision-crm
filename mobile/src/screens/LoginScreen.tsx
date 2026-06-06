import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../store/authStore';
import { COLORS } from '../utils/constants';

export default function LoginScreen() {
  const { login, isLoading, error, clearError } = useAuth();
  const [loginField, setLoginField] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = useCallback(async () => {
    if (!loginField.trim()) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Veuillez saisir votre identifiant' });
      return;
    }
    if (!password) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Veuillez saisir votre mot de passe' });
      return;
    }

    try {
      await login({ login: loginField.trim(), motDePasse: password });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Échec de la connexion',
        text2: err?.response?.data?.message || 'Vérifiez vos identifiants',
      });
    }
  }, [loginField, password, login]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Icon name="shield-check" size={50} color={COLORS.white} />
          </View>
          <Text style={styles.appName}>Mega Supervision</Text>
          <Text style={styles.subtitle}>Délégués Commerciaux</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Connexion</Text>

          <View style={styles.inputContainer}>
            <Icon name="account" size={20} color={COLORS.gray500} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Identifiant"
              placeholderTextColor={COLORS.gray400}
              value={loginField}
              onChangeText={(text) => { setLoginField(text); clearError(); }}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color={COLORS.gray500} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor={COLORS.gray400}
              value={password}
              onChangeText={(text) => { setPassword(text); clearError(); }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Icon
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={COLORS.gray500}
              />
            </TouchableOpacity>
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.loginButtonText}>Connexion</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray500,
    marginTop: 4,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },
  version: {
    textAlign: 'center',
    color: COLORS.gray400,
    fontSize: 12,
    marginTop: 32,
  },
});
