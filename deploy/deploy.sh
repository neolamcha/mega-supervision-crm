#!/usr/bin/env bash
set -euo pipefail

echo "╔══════════════════════════════════════════════════════╗"
echo "║   Mega Supervision - Déploiement Automatisé         ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ---- Vérifications ----
command -v node >/dev/null 2>&1 || { echo "❌ Node.js requis"; exit 1; }
command -v npm  >/dev/null 2>&1 || { echo "❌ npm requis"; exit 1; }

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# ---- Fonctions ----

check_railway() {
  if command -v railway >/dev/null 2>&1; then
    RAILWAY_BIN="railway"
  elif command -v railway-cli >/dev/null 2>&1; then
    RAILWAY_BIN="railway-cli"
  else
    echo "📦 Installation de Railway CLI..."
    npm install -g @railway/cli 2>/dev/null || npm install -g railway-cli 2>/dev/null || {
      curl -fsSL https://railway.app/install.sh | sh
    }
    RAILWAY_BIN="railway"
  fi
}

check_vercel() {
  if ! command -v vercel >/dev/null 2>&1; then
    echo "📦 Installation de Vercel CLI..."
    npm install -g vercel
  fi
}

railway_login() {
  echo ""
  echo "╔══════════════════════════════════════════════════════╗"
  echo "║   ÉTAPE 1 : Connexion à Railway                     ║"
  echo "║                                                    ║"
  echo "║   1. Ouvre ce lien sur ton téléphone :              ║"
  echo "║      https://railway.com/activate                   ║"
  echo "║                                                    ║"
  echo "║   2. Connecte-toi avec GitHub (compte neolamcha)    ║"
  echo "║                                                    ║"
  echo "║   3. Copie le code ci-dessous et clique Authorize   ║"
  echo "╚══════════════════════════════════════════════════════╝"
  echo ""
  railway login --browserless
  echo "✅ Connecté à Railway"
}

vercel_login() {
  echo ""
  echo "╔══════════════════════════════════════════════════════╗"
  echo "║   ÉTAPE 2 : Connexion à Vercel                      ║"
  echo "║                                                    ║"
  echo "║   Ouvre ce lien et connecte-toi avec GitHub :       ║"
  echo "║   https://vercel.com/login                          ║"
  echo "║                                                    ║"
  echo "║   Puis colle le token depuis :                      ║"
  echo "║   https://vercel.com/account/tokens                 ║"
  echo "╚══════════════════════════════════════════════════════╝"
  echo ""
  vercel login
}

create_railway_project() {
  echo ""
  echo "🚧 Création du projet Railway..."

  railway project create "mega-supervision" --team ""
  echo "✅ Projet Railway créé"

  # Créer la base de données PostgreSQL
  echo "🗄️  Création de PostgreSQL..."
  railway add postgres
  echo "✅ PostgreSQL ajouté"
}

deploy_backend() {
  echo ""
  echo "🚀 Déploiement du backend..."

  cd "$ROOT_DIR/backend"

  # Variables d'environnement
  railway env set JWT_SECRET="$(openssl rand -base64 32)"
  railway env set JWT_REFRESH_SECRET="$(openssl rand -base64 32)"
  railway env set JWT_EXPIRATION="15m"
  railway env set JWT_REFRESH_EXPIRATION="7d"
  railway env set APP_ENV="production"
  railway env set THROTTLE_TTL="60000"
  railway env set THROTTLE_LIMIT="100"

  # Déployer
  railway up --service backend
  echo "✅ Backend déployé"
}

deploy_frontend() {
  echo ""
  echo "🚀 Déploiement du frontend sur Vercel..."

  cd "$ROOT_DIR/web"

  # Récupérer l'URL du backend
  BACKEND_URL=$(railway status --service backend --json | grep -o '"url":"[^"]*"' | cut -d'"' -f4)

  vercel --prod \
    -e NEXT_PUBLIC_API_URL="$BACKEND_URL/api/v1" \
    -e NEXTAUTH_URL="$BACKEND_URL"
  echo "✅ Frontend déployé"
}

run_seed() {
  echo ""
  echo "🌱 Seed de la base de données..."
  cd "$ROOT_DIR/backend"
  railway run npx ts-node src/database/seeds/seed.ts
  echo "✅ Seed terminé"
}

build_mobile_apk() {
  echo ""
  echo "📱 Build de l'APK mobile..."

  # Mettre à jour l'URL de l'API dans le mobile
  BACKEND_URL=$(railway status --service backend --json | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
  sed -i '' "s|http://10.0.2.2:3000/api/v1|$BACKEND_URL/api/v1|g" "$ROOT_DIR/mobile/src/utils/constants.ts"

  cd "$ROOT_DIR/mobile"
  if command -v npx react-native >/dev/null 2>&1; then
    echo "   Construction de l'APK..."
    cd android && ./gradlew assembleRelease 2>/dev/null && {
      cp app/build/outputs/apk/release/app-release.apk "$ROOT_DIR/backend/uploads/apk/MegaSupervision-v1.0.0.apk"
      echo "✅ APK générée"
    } || {
      echo "⚠️  Build Android SDK non disponible - APK à générer manuellement"
      echo "   Sur Android Studio : ouvrir mobile/android et Build > Build APK"
    }
  else
    echo "⚠️  SDK Android non trouvé. Génère l'APK depuis Android Studio"
  fi
}

show_summary() {
  echo ""
  echo "╔══════════════════════════════════════════════════════╗"
  echo "║   ✅ DÉPLOIEMENT TERMINÉ                            ║"
  echo "╚══════════════════════════════════════════════════════╝"
  echo ""

  BACKEND_URL=$(railway status --service backend --json 2>/dev/null | grep -o '"url":"[^"]*"' | cut -d'"' -f4 || echo "En cours...")
  FRONTEND_URL=$(vercel ls 2>/dev/null | grep "mega-supervision" | awk '{print $2}' || echo "En cours...")

  echo "📊 Tableau de bord : $FRONTEND_URL"
  echo "🔌 API : $BACKEND_URL"
  echo "📱 APK : $BACKEND_URL/api/v1/mobile/apk"
  echo "📖 Documentation API : $BACKEND_URL/api/docs"
  echo ""
  echo "🔑 Identifiants par défaut : Dg2026 / Mega2026"
  echo ""
  echo "📱 Pour les délégués : télécharger l'APK depuis le site"
}

# ---- Menu principal ----
echo ""
echo "Que veux-tu faire ?"
echo "1) Déploiement complet (Railway + Vercel)"
echo "2) Déploiement Railway seulement (backend + DB + frontend)"
echo "3) Déploiement Vercel seulement (frontend)"
echo "4) Générer l'APK mobile"
echo "5) Seed base de données"
echo ""

read -p "Choix [1-5]: " choice

case "$choice" in
  1)
    check_railway
    check_vercel
    railway_login
    vercel_login
    create_railway_project
    deploy_backend
    deploy_frontend
    run_seed
    build_mobile_apk
    show_summary
    ;;
  2)
    check_railway
    railway_login
    create_railway_project
    deploy_backend
    run_seed
    echo "✅ Backend déployé. Pour le frontend, utilise Vercel (option 3)."
    ;;
  3)
    check_vercel
    vercel_login
    deploy_frontend
    ;;
  4)
    build_mobile_apk
    ;;
  5)
    cd "$ROOT_DIR/backend"
    railway run npx ts-node src/database/seeds/seed.ts
    ;;
  *)
    echo "Choix invalide"
    exit 1
    ;;
esac
