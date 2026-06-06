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
import { authApi } from '../services/api';
import { useAuth } from '../store/authStore';
import { COLORS } from '../utils/constants';

export default function ChangePasswordScreen() {
  const { user, setUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validate = useCallback((): string | null => {
    if (!currentPassword) return 'Veuillez saisir votre mot de passe actuel';
    if (!newPassword) return 'Veuillez saisir un nouveau mot de passe';
    if (newPassword.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères';
    if (newPassword !== confirmPassword) return 'Les mots de passe ne correspondent pas';
    if (newPassword === currentPassword) return 'Le nouveau mot de passe doit être différent de l\'actuel';
    return null;
  }, [currentPassword, newPassword, confirmPassword]);

  const handleChangePassword = useCallback(async () => {
    const error = validate();
    if (error) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: error });
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.changePassword({
        motDePasseActuel: currentPassword,
        nouveauMotDePasse: newPassword,
        confirmation: confirmPassword,
      });

      if (response.success) {
        if (user) {
          setUser({ ...user, premierConnexion: false });
        }
        Toast.show({
          type: 'success',
          text1: 'Succès',
          text2: 'Mot de passe modifié avec succès',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: response.message || 'Impossible de modifier le mot de passe',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: err?.response?.data?.message || 'Erreur de connexion au serveur',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPassword, newPassword, user, setUser, validate]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <View style={styles.iconCircle}>
            <Icon name="key-change" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Changement de mot de passe</Text>
          <Text style={styles.subtitle}>
            Pour des raisons de sécurité, veuillez changer votre mot de passe immédiatement.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Icon name="lock-outline" size={20} color={COLORS.gray500} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe actuel"
              placeholderTextColor={COLORS.gray400}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrent}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
              <Icon name={showCurrent ? 'eye-off' : 'eye'} size={20} color={COLORS.gray500} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock-plus" size={20} color={COLORS.gray500} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nouveau mot de passe"
              placeholderTextColor={COLORS.gray400}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)}>
              <Icon name={showNew ? 'eye-off' : 'eye'} size={20} color={COLORS.gray500} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock-check" size={20} color={COLORS.gray500} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor={COLORS.gray400}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <Icon name={showConfirm ? 'eye-off' : 'eye'} size={20} color={COLORS.gray500} />
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>Le mot de passe doit contenir au moins 8 caractères</Text>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleChangePassword}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Modifier le mot de passe</Text>
            )}
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
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
  hint: {
    fontSize: 12,
    color: COLORS.gray400,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },
});
