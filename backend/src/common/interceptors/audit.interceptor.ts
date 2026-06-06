import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Optional,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @Optional()
    @InjectRepository(AuditLog)
    private readonly auditLogRepository?: Repository<AuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const user = request.user;

    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const { route, originalUrl, body, ip } = request;
    const entityName = route?.path?.split('/')[3] || 'unknown';

    return next.handle().pipe(
      tap((responseData) => {
        if (!this.auditLogRepository) return;

        try {
          const auditLog = this.auditLogRepository.create({
            utilisateurId: user?.id || null,
            action: method,
            entite: entityName,
            entiteId: responseData?.data?.id || null,
            details: {
              url: originalUrl,
              body: method !== 'GET' ? body : undefined,
              responseStatus: context.switchToHttp().getResponse().statusCode,
            },
            adresseIP: ip,
          });

          this.auditLogRepository.save(auditLog).catch((err) => {
            console.error('Échec de la journalisation d\'audit:', err.message);
          });
        } catch (err) {
          console.error('Échec de la journalisation d\'audit:', err.message);
        }
      }),
    );
  }
}
