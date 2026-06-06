import { DataSource, DataSourceOptions } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../entities/user.entity';
import { ProspectType } from '../entities/prospect.entity';

async function seed() {
  const options: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'mega_admin',
    password: process.env.DB_PASSWORD || 'MegaSupervision2026',
    database: process.env.DB_NAME || 'mega_supervision',
    entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
    synchronize: false,
  };

  const dataSource = new DataSource(options);
  await dataSource.initialize();

  console.log('Connexion à la base de données établie');

  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.startTransaction();

    const adminLogin = process.env.ADMIN_LOGIN || 'Dg2026';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Mega2026';

    const existingAdmin = await queryRunner.manager.query(
      'SELECT id FROM "users" WHERE login = $1',
      [adminLogin],
    );

    if (existingAdmin.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      await queryRunner.manager.query(
        'INSERT INTO "users" (nom, prenom, telephone, email, login, mot_de_passe, role, est_actif, premier_connexion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [
          'Administrateur',
          'Système',
          '+221770000000',
          'admin@megasupervision.com',
          adminLogin,
          hashedPassword,
          UserRole.DIRECTEUR,
          true,
          true,
        ],
      );
      console.log('Administrateur par defaut cree');
    } else {
      console.log('Administrateur existe deja');
    }

    const configs = [
      { type: ProspectType.PHARMACIE, rayon: 20, pauseStart: '13:00', pauseEnd: '15:00' },
      { type: ProspectType.DEPOT, rayon: 80, pauseStart: '13:00', pauseEnd: '15:00' },
      { type: ProspectType.CLINIQUE, rayon: 50, pauseStart: '13:00', pauseEnd: '15:00' },
      { type: ProspectType.HOPITAL, rayon: 150, pauseStart: '13:00', pauseEnd: '15:00' },
      { type: ProspectType.AUTRE, rayon: 50, pauseStart: '13:00', pauseEnd: '15:00' },
    ];

    for (const config of configs) {
      const existingConfig = await queryRunner.manager.query(
        'SELECT id FROM "prospect_type_configs" WHERE type = $1',
        [config.type],
      );

      if (existingConfig.length === 0) {
        await queryRunner.manager.query(
          'INSERT INTO "prospect_type_configs" (type, rayon_presence, pause_start, pause_end) VALUES ($1, $2, $3, $4)',
          [config.type, config.rayon, config.pauseStart, config.pauseEnd],
        );
        console.log('Configuration creee pour: ' + config.type + ' (' + config.rayon + 'm)');
      } else {
        console.log('Configuration existe deja pour: ' + config.type);
      }
    }

    await queryRunner.commitTransaction();
    console.log('Seed termine avec succes');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Erreur lors du seed:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
