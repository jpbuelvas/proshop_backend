import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteSettings } from './site-settings.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SiteSettings)
    private readonly settingsRepository: Repository<SiteSettings>,
  ) {}

  async get(): Promise<SiteSettings> {
    let settings = await this.settingsRepository.findOneBy({ id: 1 });
    if (!settings) {
      settings = this.settingsRepository.create({
        id: 1,
        outletDiscountPercent: null,
        freeShippingThreshold: null,
      });
      await this.settingsRepository.save(settings);
    }
    return settings;
  }

  async update(dto: UpdateSettingsDto): Promise<SiteSettings> {
    const settings = await this.get();
    settings.outletDiscountPercent = dto.outletDiscountPercent ?? null;
    settings.freeShippingThreshold = dto.freeShippingThreshold ?? null;
    return this.settingsRepository.save(settings);
  }
}
