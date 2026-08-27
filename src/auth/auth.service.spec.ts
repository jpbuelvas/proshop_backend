import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../users/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    userRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('signed-jwt') } },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('rechaza un email ya registrado', async () => {
      userRepo.findOne.mockResolvedValue({ id: 1, email: 'a@a.com' });

      await expect(
        service.register({ name: 'A', email: 'a@a.com', password: 'secret1' }),
      ).rejects.toThrow(ConflictException);
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('hashea la contraseña antes de guardar y nunca la devuelve en la respuesta', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockImplementation((data) => data);
      userRepo.save.mockImplementation((u) => Promise.resolve({ id: 1, ...u }));

      const result = await service.register({
        name: 'A',
        email: 'a@a.com',
        password: 'secret1',
      });

      const savedArg = userRepo.save.mock.calls[0][0];
      expect(savedArg.passwordHash).not.toBe('secret1');
      expect(await bcrypt.compare('secret1', savedArg.passwordHash)).toBe(true);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.token).toBe('signed-jwt');
    });
  });

  describe('login', () => {
    it('rechaza si el usuario no existe', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'x@x.com', password: 'secret1' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rechaza una contraseña incorrecta', async () => {
      const passwordHash = await bcrypt.hash('correct-pass', 10);
      userRepo.findOne.mockResolvedValue({ id: 1, email: 'x@x.com', passwordHash });

      await expect(
        service.login({ email: 'x@x.com', password: 'wrong-pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('acepta credenciales válidas y devuelve un token sin passwordHash', async () => {
      const passwordHash = await bcrypt.hash('correct-pass', 10);
      userRepo.findOne.mockResolvedValue({
        id: 1,
        email: 'x@x.com',
        passwordHash,
        role: 'user',
      });

      const result = await service.login({ email: 'x@x.com', password: 'correct-pass' });

      expect(result.token).toBe('signed-jwt');
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });
});
