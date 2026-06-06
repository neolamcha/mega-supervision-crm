import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue({ id: 'test-uuid', nom: 'Test' }),
    create: jest.fn().mockResolvedValue({ id: 'test-uuid', nom: 'Test' }),
    update: jest.fn().mockResolvedValue({ id: 'test-uuid', nom: 'Updated' }),
    softDelete: jest.fn().mockResolvedValue(undefined),
    reactivate: jest.fn().mockResolvedValue({ id: 'test-uuid', estActif: true }),
    resetPassword: jest.fn().mockResolvedValue({ temporaryPassword: 'Test1234!' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all users', async () => {
    const result = await controller.findAll();
    expect(result).toEqual([]);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should return a user by id', async () => {
    const result = await controller.findById('test-uuid');
    expect(result).toEqual({ id: 'test-uuid', nom: 'Test' });
    expect(service.findById).toHaveBeenCalledWith('test-uuid');
  });

  it('should create a user', async () => {
    const dto = {
      nom: 'Test',
      prenom: 'User',
      telephone: '+221771234567',
      email: 'test@test.com',
      login: 'testuser',
      motDePasse: 'Password123!',
      role: 'delegue' as any,
    };
    const result = await controller.create(dto);
    expect(result).toEqual({ id: 'test-uuid', nom: 'Test' });
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should update a user', async () => {
    const dto = { nom: 'Updated' };
    const result = await controller.update('test-uuid', dto);
    expect(result).toEqual({ id: 'test-uuid', nom: 'Updated' });
    expect(service.update).toHaveBeenCalledWith('test-uuid', dto);
  });

  it('should soft delete a user', async () => {
    const result = await controller.remove('test-uuid');
    expect(result).toEqual({ message: 'Utilisateur désactivé avec succès' });
    expect(service.softDelete).toHaveBeenCalledWith('test-uuid');
  });

  it('should reactivate a user', async () => {
    const result = await controller.reactivate('test-uuid');
    expect(result).toEqual({ id: 'test-uuid', estActif: true });
    expect(service.reactivate).toHaveBeenCalledWith('test-uuid');
  });

  it('should reset user password', async () => {
    const result = await controller.resetPassword('test-uuid');
    expect(result).toEqual({ temporaryPassword: 'Test1234!' });
    expect(service.resetPassword).toHaveBeenCalledWith('test-uuid');
  });
});
