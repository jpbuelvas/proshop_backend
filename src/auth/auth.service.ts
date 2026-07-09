import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

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
    let user = await this.userRepo.findOne({
      where: { provider: profile.provider, providerId: profile.providerId },
    });
    if (!user) {
      user = await this.userRepo.findOne({ where: { email: profile.email } });
    }
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

  async register(dto: RegisterDto): Promise<{ token: string; user: Omit<User, 'passwordHash'> }> {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('El email ya esta registrado');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    let user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      provider: 'local',
      role: 'user',
    });
    user = await this.userRepo.save(user);

    const token = this.generateJwt(user);
    const { passwordHash: _, ...safeUser } = user;
    return { token, user: safeUser };
  }

  async login(dto: LoginDto): Promise<{ token: string; user: Omit<User, 'passwordHash'> }> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciales invalidas');
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales invalidas');

    const token = this.generateJwt(user);
    const { passwordHash: _, ...safeUser } = user;
    return { token, user: safeUser };
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
