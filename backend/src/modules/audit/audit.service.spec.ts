import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from '../../database/entities/audit-log.entity';

describe('AuditService', () => {
  let service: AuditService;
  let repository: Repository<AuditLog>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    repository = module.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an audit log entry', async () => {
      const params = {
        utilisateurId: 'user-1',
        action: 'CREATE',
        entite: 'visit',
        entiteId: 'visit-1',
        details: { test: true },
        adresseIP: '127.0.0.1',
      };

      mockRepository.create.mockReturnValue(params);
      mockRepository.save.mockResolvedValue({ id: 'audit-1', ...params });

      const result = await service.create(params);

      expect(mockRepository.create).toHaveBeenCalledWith({
        utilisateurId: params.utilisateurId,
        action: params.action,
        entite: params.entite,
        entiteId: params.entiteId,
        details: params.details,
        adresseIP: params.adresseIP,
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.id).toBe('audit-1');
    });

    it('should create audit log with minimal params', async () => {
      const params = {
        action: 'LOGIN',
        entite: 'user',
      };

      mockRepository.create.mockReturnValue(params);
      mockRepository.save.mockResolvedValue({ id: 'audit-2', ...params });

      const result = await service.create(params);

      expect(mockRepository.create).toHaveBeenCalledWith({
        utilisateurId: null,
        action: 'LOGIN',
        entite: 'user',
        entiteId: null,
        details: null,
        adresseIP: null,
      });
      expect(result.id).toBe('audit-2');
    });
  });

  describe('findAll', () => {
    it('should return paginated audit logs', async () => {
      const logs = [{ id: '1', action: 'CREATE', entite: 'visit' }];
      mockRepository.findAndCount.mockResolvedValue([logs, 1]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual(logs);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should apply filters correctly', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({
        userId: 'user-1',
        action: 'CREATE',
        entity: 'visit',
        dateFrom: '2026-01-01',
        dateTo: '2026-06-06',
      });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            utilisateurId: 'user-1',
            action: 'CREATE',
            entite: 'visit',
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return an audit log by id', async () => {
      const log = { id: 'log-1', action: 'UPDATE', entite: 'prospect' };
      mockRepository.findOne.mockResolvedValue(log);

      const result = await service.findById('log-1');

      expect(result).toEqual(log);
    });

    it('should throw NotFoundException when log not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow();
    });
  });
});
