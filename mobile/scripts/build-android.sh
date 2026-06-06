#!/bin/bash
set -e

echo "=== Mega Supervision - Build Android APK ==="

# Check Android SDK
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
    echo "❌ ANDROID_HOME ou ANDROID_SDK_ROOT non défini"
    echo "   Installez Android Studio et définissez ANDROID_HOME"
    exit 1
fi

cd "$(dirname "$0")/.."

echo "📦 Installation des dépendances..."
npm install

echo "🏗️  Build Android..."
cd android
./gradlew assembleRelease

echo "📋 Copie de l'APK..."
cp app/build/outputs/apk/release/app-release.apk ../backend/uploads/apk/MegaSupervision-v1.0.0.apk

echo ""
echo "✅ APK généré avec succès !"
echo "   Emplacement : backend/uploads/apk/MegaSupervision-v1.0.0.apk"
echo ""
echo "📱 Téléchargeable depuis : http://localhost:3000/api/v1/mobile/apk"
