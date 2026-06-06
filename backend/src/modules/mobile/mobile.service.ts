import { Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class MobileService {
  private readonly apkDirectory: string;
  private readonly versionInfo = {
    version: '1.0.0',
    buildNumber: 1,
    releaseDate: '2026-06-06',
    minAndroidVersion: '8.0',
    size: '61 MB',
    changelog: [
      'Première version de Mega Supervision',
      'Calibrage GPS des prospects',
      'Détection automatique des visites (rayon 4m)',
      'Mode hors-ligne avec synchronisation automatique',
      'Historique complet des visites et déplacements',
    ],
  };

  constructor() {
    this.apkDirectory =
      process.env.APK_STORAGE_PATH || join(process.cwd(), 'uploads', 'apk');
  }

  getApkPath(): { exists: boolean; path?: string; message?: string } {
    const apkPath = join(this.apkDirectory, 'MegaSupervision-v1.0.0.apk');
    if (!existsSync(apkPath)) {
      return {
        exists: false,
        message:
          'APK non disponible. Générez-la depuis le dossier mobile/ avec : cd mobile && npm run build:android',
      };
    }
    return { exists: true, path: apkPath };
  }

  getVersion() {
    return this.versionInfo;
  }
}
