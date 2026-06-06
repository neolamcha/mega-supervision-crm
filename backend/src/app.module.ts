import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProspectsModule } from './modules/prospects/prospects.module';
import { GpsModule } from './modules/gps/gps.module';
import { VisitsModule } from './modules/visits/visits.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { AuditModule } from './modules/audit/audit.module';
import { CalibrationModule } from './modules/calibration/calibration.module';
import { MobileModule } from './modules/mobile/mobile.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: parseInt(config.get('DB_PORT', '5432')),
        username: config.get('DB_USERNAME', 'mega_admin'),
        password: config.get('DB_PASSWORD', 'MegaSupervision2026'),
        database: config.get('DB_NAME', 'mega_supervision'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: config.get('APP_ENV') === 'development',
        logging: config.get('APP_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: parseInt(config.get('THROTTLE_TTL', '60000')),
            limit: parseInt(config.get('THROTTLE_LIMIT', '100')),
          },
        ],
      }),
      inject: [ConfigService],
    }),

    CacheModule.register({
      isGlobal: true,
      ttl: 300,
    }),

    ScheduleModule.forRoot(),

    AuthModule,
    UsersModule,
    ProspectsModule,
    GpsModule,
    VisitsModule,
    AnalyticsModule,
    PdfModule,
    AuditModule,
    CalibrationModule,
    MobileModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  controllers: [AppController],
})
export class AppModule {}
