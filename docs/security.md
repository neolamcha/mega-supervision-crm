# Sécurité — Mega Supervision

## Vue d'Ensemble

La sécurité de Mega Supervision repose sur une approche **défense en profondeur** couvrant l'authentification, la transmission, le stockage, l'accès aux données et la détection d'anomalies. Chaque couche de l'application implémente des contrôles de sécurité spécifiques.

---

## 1. Authentification

### 1.1 JWT (JSON Web Tokens)

Le système utilise des tokens JWT pour l'authentification sans état (stateless).

```
┌──────────────────────────────────────────────────────┐
│                  JWT ACCESS TOKEN                      │
├──────────────────────────────────────────────────────┤
│                                                        │
│  Header:                                               │
│  {                                                     │
│    "alg": "RS256",          ← Algorithme asymétrique  │
│    "typ": "JWT"                                        │
│  }                                                     │
│                                                        │
│  Payload:                                              │
│  {                                                     │
│    "sub": "a1b2c3d4-...",   ← User ID (UUID)          │
│    "role": "delegue",       ← Rôle utilisateur        │
│    "email": "j@ex.com",                               │
│    "iat": 1700000000,       ← Émis à                  │
│    "exp": 1700086400        ← Expire dans 24h         │
│  }                                                     │
│                                                        │
│  Signature: RS256(base64(header).base64(payload))      │
│                                                        │
└──────────────────────────────────────────────────────┘
```

**Configuration:**
| Paramètre | Valeur | Justification |
|:----------|:-------|:--------------|
| Algorithme | RS256 | Signature asymétrique (plus sûr que HS256) |
| Access Token | 24h | Permet une session journalière sans reconnexion |
| Refresh Token | 7 jours | Rotation automatique à chaque utilisation |
| Taille clé | 2048 bits | Standard industriel minimum |

### 1.2 Refresh Token Flow

```
Génération:
1. Utilisateur s'authentifie (login + password)
2. Backend vérifie les identifiants
3. Génère access_token (24h) + refresh_token (7j)
4. Hash le refresh_token (SHA-256) et le stocke en DB
5. Retourne les deux tokens au client

Rotation:
1. Client présente refresh_token expiré/valide
2. Backend vérifie: existe en DB ? non révoqué ? non expiré ?
3. SI OK: Génère NOUVEAU refresh_token, révoque l'ancien
4. SI volé: l'ancien devient invalide

Révocation:
1. Logout → refresh_token.estRevoke = true
2. Changement mot de passe → tous les refresh tokens de l'utilisateur sont révoqués
3. Désactivation compte → tous les tokens révoqués
```

### 1.3 Implémentation JWT

```typescript
// src/auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_PUBLIC_KEY'),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.userService.findById(payload.sub);
    if (!user || !user.estActif) {
      throw new UnauthorizedException('Compte désactivé ou inexistant');
    }
    return user;
  }
}

// src/auth/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private requiredRoles: string[]) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return this.requiredRoles.includes(user.role);
  }
}
```

### 1.4 Endpoints d'Authentification

| Endpoint | Protection | Rate Limit |
|:---------|:-----------|:-----------|
| `POST /auth/login` | Public | 5 tentatives/min par IP |
| `POST /auth/refresh` | Public | 10 req/min |
| `POST /auth/change-password` | Authentifié | 3 req/min |
| `POST /auth/logout` | Authentifié | 10 req/min |

---

## 2. Hachage des Mots de Passe

### 2.1 Algorithme: bcrypt

```typescript
// src/auth/services/password.service.ts
@Injectable()
export class PasswordService {
  private readonly SALT_ROUNDS = 10;

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

**Pourquoi bcrypt ?**
- **Salt automatique** intégré (prévient les rainbow tables)
- **Adaptatif** — le facteur de coût peut être augmenté avec la puissance de calcul
- **Lent par conception** — 10 rounds ≈ 100ms, ralentit les attaques par force brute
- **Résistant aux GPU** — difficile à paralléliser sur GPU

### 2.2 Politique de Mot de Passe

```typescript
// Validation dans src/common/decorators/password.validator.ts
const passwordSchema = {
  minLength: 8,
  maxLength: 128,
  uppercase: true,
  lowercase: true,
  digits: true,
  noCommonPasswords: true,
};

// Règles
REGEX_UPPERCASE = /[A-Z]/     // Au moins 1 majuscule
REGEX_LOWERCASE = /[a-z]/     // Au moins 1 minuscule
REGEX_DIGIT = /[0-9]/         // Au moins 1 chiffre
MIN_LENGTH = 8                // Minimum 8 caractères
```

### 2.3 Stockage

| Donnée | Méthode | Visible en DB |
|:-------|:--------|:--------------|
| Mot de passe | bcrypt hash | Hash uniquement (jamais en clair) |
| Refresh token | SHA-256 hash | Hash uniquement |
| JWT | Pas stocké | Non stocké (validation par signature) |

---

## 3. Sécurité des API

### 3.1 Rate Limiting

```typescript
// src/common/guards/rate-limit.guard.ts
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly windowMs = 60 * 1000; // 1 minute
  private readonly maxRequests = 100;
  private requests = new Map<string, { count: number; resetTime: number }>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const now = Date.now();

    const record = this.requests.get(ip);
    if (!record || now > record.resetTime) {
      this.requests.set(ip, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (record.count >= this.maxRequests) {
      throw new TooManyRequestsException('Trop de requêtes. Réessayez dans 60 secondes.');
    }

    record.count++;
    return true;
  }
}
```

**Limites par module:**
| Module | Limite | Fenêtre |
|:-------|:-------|:--------|
| API globale | 100 req | 1 minute |
| Login (par IP) | 5 req | 1 minute |
| Login (par login) | 10 req | 15 minutes |
| Changement mot de passe | 3 req | 1 minute |
| Génération PDF | 10 req | 1 minute |
| GPS events | 60 req | 1 minute (par délégué) |

### 3.2 Headers de Sécurité (Helmet)

```typescript
// src/main.ts (app bootstrap)
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://*.tile.openstreetmap.org"],
        connectSrc: ["'self'", "https://mega-supervision.com"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'none'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "same-origin" },
  }));

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'https://mega-supervision.com',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 3600,
  });
}
```

**Headers appliqués:**
| Header | Valeur | Protection |
|:-------|:-------|:-----------|
| `X-Frame-Options` | `SAMEORIGIN` | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `X-XSS-Protection` | `1; mode=block` | XSS (navigateurs anciens) |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | HSTS (1 an) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Fuite d'URL |
| `Content-Security-Policy` | (voir ci-dessus) | XSS, injection |
| `Permissions-Policy` | `geolocation=(self), camera=(self)` | API permissions |

### 3.3 Validation des Entrées

```typescript
// src/prospects/dto/create-prospect.dto.ts
import { IsString, IsOptional, IsIn, MinLength, MaxLength } from 'class-validator';

export class CreateProspectDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  nom: string;

  @IsString()
  @IsIn(['pharmacie', 'hopital', 'clinique', 'cabinet', 'laboratoire', 'autre'])
  type: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  adresse?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ville?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\+?[0-9\s\-]{6,20})$/, {
    message: 'Format de téléphone invalide',
  })
  telephone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
```

**Validation appliquée:**
- **Whitelist** — les propriétés non définies dans le DTO sont automatiquement supprimées
- **Transformation** — conversion de types automatique (string → number, etc.)
- **Validation** — règles métier, formats, limites
- **Sanitization** — pas de HTML/JS dans les champs texte (via `sanitize-html`)

### 3.4 Guards et Autorisation

```typescript
// Exemple d'utilisation avec décorateur
@Controller('users')
export class UsersController {
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard('directeur'))
  @UseInterceptors(AuditInterceptor('LIST_USERS'))
  async findAll(@Query() query: ListUsersDto) {
    return this.usersService.findAll(query);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard('directeur'))
  @UseInterceptors(AuditInterceptor('UPDATE_USER'))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe({ whitelist: true })) dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto);
  }
}
```

**Chaîne de Guards:**
```
Requête → JwtAuthGuard → RolesGuard → RateLimitGuard → Controller
    1. Vérifier token JWT valide et non expiré
    2. Vérifier rôle autorisé
    3. Vérifier taux de requêtes
    4. Exécuter la méthode
```

---

## 4. Protection des Données

### 4.1 Chiffrement

| Donnée | Au repos (DB) | En transit (Network) |
|:-------|:--------------|:---------------------|
| Mots de passe | bcrypt hash | TLS 1.2+ |
| Refresh tokens | SHA-256 hash | TLS 1.2+ |
| Coordonnées GPS | Clair (option: AES-256) | TLS 1.2+ |
| Jeton JWT | Non stocké | TLS 1.2+ |
| Fichiers uploadés | Stockage conteneur | TLS 1.2+ |
| Logs d'audit | Clair | TLS 1.2+ |

### 4.2 TLS/SSL

```bash
# Configuration Nginx TLS 1.2+ (minimum)
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

### 4.3 Données Sensibles dans les Logs

```typescript
// src/common/interceptors/logging.interceptor.ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly sensitiveFields = [
    'motDePasse',
    'ancienMotDePasse',
    'nouveauMotDePasse',
    'token',
    'refreshToken',
    'accessToken',
    'jwt',
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const sanitizedBody = this.sanitize(request.body);

    Logger.log(
      `${request.method} ${request.url} - ${JSON.stringify(sanitizedBody)}`,
      'HTTP',
    );

    return next.handle().pipe(
      tap(data => Logger.log(`Response: ${JSON.stringify(this.sanitize(data))}`)),
    );
  }

  private sanitize(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized = { ...obj };
    for (const key of Object.keys(sanitized)) {
      if (this.sensitiveFields.includes(key)) {
        sanitized[key] = '***REDACTED***';
      }
    }
    return sanitized;
  }
}
```

---

## 5. Sécurité Mobile

### 5.1 Android Security

```gradle
// android/app/build.gradle
android {
  signingConfigs {
    release {
      storeFile file("mega-supervision.keystore")
      storePassword System.getenv("KEYSTORE_PASSWORD")
      keyAlias System.getenv("KEY_ALIAS")
      keyPassword System.getenv("KEY_PASSWORD")
    }
  }

  buildTypes {
    release {
      minifyEnabled true
      proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
      signingConfig signingConfigs.release
    }
  }
}
```

**Recommandations:**
- **App signing** via Google Play App Signing
- **ProGuard** pour l'obfuscation du code
- **SSL Pinning** (à activer en production)
- **SecureStore** (React Native Keychain) pour les tokens JWT
- **Pas de logs de production** (`__DEV__` conditionnel)

### 5.2 Stockage Sécurisé

```typescript
// src/services/secure-storage.ts
import * as Keychain from 'react-native-keychain';

export class SecureStorage {
  static async storeToken(key: string, token: string): Promise<void> {
    await Keychain.setGenericPassword(key, token, {
      service: `com.mega-supervision.${key}`,
      accessGroup: 'com.mega-supervision',
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }

  static async getToken(key: string): Promise<string | null> {
    const credentials = await Keychain.getGenericPassword({
      service: `com.mega-supervision.${key}`,
    });
    return credentials ? credentials.password : null;
  }

  static async removeToken(key: string): Promise<void> {
    await Keychain.resetGenericPassword({
      service: `com.mega-supervision.${key}`,
    });
  }
}
```

**Ce qui n'est JAMAIS stocké en clair:**
- ❌ JWT tokens (→ SecureStore/Keychain)
- ❌ Refresh tokens (→ SecureStore/Keychain)
- ❌ Mot de passe (→ jamais stocké, même temporairement)
- ❌ Coordonnées GPS du calibrage (→ SQLite chiffré si possible)

**Ce qui peut être stocké en SQLite:**
- ✅ Événements GPS bruts (sans lien direct avec les tokens)
- ✅ Cache des prospects (sans donnée sensible)
- ✅ Préférences utilisateur (thème, langue)

### 5.3 SSL Pinning

```typescript
// Recommandé pour la production
// react-native-ssl-pinning
import { fetch } from 'react-native-ssl-pinning';

const response = await fetch('https://mega-supervision.com/api/v1/gps/event', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(event),
  // SSL Pinning
  sslPinning: {
    certs: ['certificate1', 'certificate2'], // SHA-256 hashes
  },
  // Timeout
  timeoutInterval: 10000,
});
```

---

## 6. Anti-Fraude

### 6.1 Intégrité des Visites

**Règles strictes:**
```
1. IMPOSSIBLE de créer manuellement une visite
   → Pas d'endpoint POST /visits
   → Seul l'algorithme de détection peut créer des visites

2. IMPOSSIBLE de modifier heureArrivee ou heureDepart
   → Champs en lecture seule après création
   → Seule la détection GPS les définit

3. CHAQUE visite nécessite un GpsEvent 'visite_debut'
   → Preuve que le délégué était physiquement sur place

4. CHAQUE fin de visite nécessite un GpsEvent 'visite_fin'
   → Traçabilité complète du début à la fin
```

### 6.2 Validation des Événements GPS

```typescript
// src/gps/services/gps-validator.service.ts
@Injectable()
export class GpsValidatorService {
  private readonly MAX_SPEED_KMH = 300;
  private readonly MAX_POSITION_JUMP_M = 1000;
  private readonly MIN_POSITION_JUMP_TIME_S = 1;

  validateEvent(event: GpsEvent): ValidationResult {
    const errors: string[] = [];

    // 1. Validation des coordonnées
    if (event.latitude < -90 || event.latitude > 90) {
      errors.push('Latitude hors limites');
    }
    if (event.longitude < -180 || event.longitude > 180) {
      errors.push('Longitude hors limites');
    }

    // 2. Validation de la vitesse
    if (event.vitesse > this.MAX_SPEED_KMH) {
      errors.push(`Vitesse excessive: ${event.vitesse} km/h`);
    }

    // 3. Validation de l'horodatage
    const eventTime = new Date(event.horodatage).getTime();
    const now = Date.now();
    if (eventTime > now + 60000) {
      errors.push('Horodatage dans le futur (> 1min)');
    }
    if (eventTime < now - 86400000) {
      errors.push('Horodatage trop ancien (> 24h)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async validatePositionCoherence(
    currentEvent: GpsEvent,
    previousEvent?: GpsEvent,
  ): Promise<CoherenceResult> {
    if (!previousEvent) {
      return { isCoherent: true };
    }

    const timeDiff = (new Date(currentEvent.horodatage).getTime() -
      new Date(previousEvent.horodatage).getTime()) / 1000;

    if (timeDiff <= 0) {
      return { isCoherent: false, reason: 'Horodatage non chronologique' };
    }

    const distance = haversineDistance(
      previousEvent.latitude, previousEvent.longitude,
      currentEvent.latitude, currentEvent.longitude,
    );

    if (timeDiff < this.MIN_POSITION_JUMP_TIME_S && distance > this.MAX_POSITION_JUMP_M) {
      return { isCoherent: false, reason: 'Saut de position impossible' };
    }

    return { isCoherent: true };
  }
}
```

### 6.3 Détection de Patterns Suspects

```typescript
// Détections avancées
ANOMALIES = {
  // Visites sans déplacement
  SAME_POSITION_ALL_DAY: {
    condition: "Tous les points GPS de la journée dans un rayon de 10m",
    action: "Marquer journée comme suspecte",
  },

  // Calibration non physique
  CALIBRATION_FROM_HQ: {
    condition: "Coordonnées de calibration identiques à l'adresse du siège",
    action: "Rejeter calibration, alerte directeur",
  },

  // Visite fantôme
  GHOST_VISIT: {
    condition: "Visite créée sans événement GPS 'visite_debut'",
    action: "Impossible (système empêche) — mais log si contournement",
  },

  // Chevauchement impossible
  OVERLAP_VISIT: {
    condition: "Deux visites simultanées pour le même délégué",
    action: "Impossible (système empêche) — terminer la première",
  },
};
```

---

## 7. Journalisation d'Audit

### 7.1 Audit Interceptor

```typescript
// src/common/interceptors/audit.interceptor.ts
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly action: string,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const { method, url, ip, body } = request;

    return next.handle().pipe(
      tap((response) => {
        const entityId = response?.id || request.params?.id;

        this.auditService.log({
          utilisateurId: user?.id,
          action: this.action,
          entite: this.getEntityName(url),
          entiteId: entityId,
          details: {
            method,
            url,
            requestBody: this.sanitizeSensitive(body),
            responseSummary: this.summarizeResponse(response),
          },
          coordonneesGPS: request.body?.latitude ? {
            latitude: request.body.latitude,
            longitude: request.body.longitude,
          } : null,
          adresseIP: ip,
        });
      }),
    );
  }

  private getEntityName(url: string): string {
    const parts = url.split('/');
    return parts[3] || 'unknown'; // /api/v1/{entity}/...
  }
}
```

### 7.2 Données Auditées

Toute action modifiant des données est enregistrée dans `audit_logs`:

| Information | Source | Exemple |
|:------------|:-------|:--------|
| `utilisateurId` | JWT | `a1b2c3d4-...` |
| `action` | Interceptor | `CREATE` |
| `entite` | URL | `users` |
| `entiteId` | Response/Params | `b2c3d4e5-...` |
| `details` | Request + Response | `{ nom: "Martin" }` |
| `coordonneesGPS` | Request body | `{ lat: 48.8566, lng: 2.3522 }` |
| `adresseIP` | Request | `192.168.1.1` |
| `createdAt` | Auto | `2025-01-15T12:00:00Z` |

---

## 8. Checklist de Sécurité

### Pré-déploiement
- [ ] Tous les mots de passe par défaut changés
- [ ] JWT_SECRET et JWT_REFRESH_SECRET générés (64+ caractères aléatoires)
- [ ] Clé privée RSA stockée de manière sécurisée
- [ ] SSL/TLS configuré et valide (Let's Encrypt)
- [ ] .env jamais commité (dans .gitignore)
- [ ] CORS restreint aux domaines de production
- [ ] Rate limiting activé
- [ ] Helmet headers vérifiés (curl -I)
- [ ] Logs backend ne contiennent pas de données sensibles
- [ ] PostgreSQL écoute uniquement sur localhost
- [ ] Redis configuré avec mot de passe (si exposé)
- [ ] Backup chiffré

### Quotidien
- [ ] Vérifier les tentatives de connexion échouées (> 100 = attaque)
- [ ] Vérifier les anomalies de visite (visites trop courtes/longues)
- [ ] Vérifier les logs d'audit pour des actions inhabituelles
- [ ] Monitorer le nombre de refresh tokens actifs par utilisateur
- [ ] Vérifier les certificats SSL (expiration)

### Mensuel
- [ ] Rotation des clés JSI (optionnel)
- [ ] Revue des accès utilisateurs (comptes inactifs à désactiver)
- [ ] Mise à jour des dépendances (npm audit, Docker images)
- [ ] Test de restauration de backup
- [ ] Test de pénétration (si applicable)
- [ ] Revue des logs d'anomalies

### Incident de Sécurité
1. **Détection** → Alerte automatique ou manuelle
2. **Isolation** → Désactiver le compte concerné, révoquer les tokens
3. **Analyse** → Consulter audit_logs, identifier l'étendue
4. **Correction** → Corriger la vulnérabilité, restaurer si nécessaire
5. **Notification** → Informer les utilisateurs impactés (si requis)
6. **Post-mortem** → Documenter l'incident et améliorer la prévention
