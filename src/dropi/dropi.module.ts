import { Module } from '@nestjs/common';
import { DropiService } from './dropi.service';

@Module({
  providers: [DropiService],
  exports: [DropiService],
})
export class DropiModule {}
