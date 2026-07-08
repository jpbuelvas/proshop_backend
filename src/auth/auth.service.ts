import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';

interface SocialProfile {
  provider: 'google' | 'facebook' | 'local';
  providerId: string;
  email: string;
  name: string;
  avatar?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async findOrCreateUser(profile: SocialProfile): Promise<User> {
    // 1. Buscar por provider + providerId
    let user = await this.userRepo.findOne({
      where: { provider: profile.provider, providerId: profile.providerId },
    });

    // 2. Si no existe, buscar por email (puede que ya se registró con otro provider)
    if (!user) {
      user = await this.userRepo.findOne({ where: { email: profile.email } });
    }

    // 3. Si sigue sin existir, crear nuevo usuario
    if (!user) {
      user = this.userRepo.create({
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        provider: profile.provider,
        providerId: profile.providerId,
        role: 'user',
      });
      user = await this.userRepo.save(user);
    }

    return user;
  }

  generateJwt(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async getProfile(userId: number): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}
