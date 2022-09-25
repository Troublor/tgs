import { Inject, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import BackupService from './backup.service.js';
import NetDriveModule from '../netdrive/netdrive.module.js';
import { DataSource } from 'typeorm';
import User from './entities/User.entity.js';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import winston from 'winston';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [NetDriveModule, TypeOrmModule.forFeature([User])],
  providers: [BackupService],
})
export default class DatabaseModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: winston.Logger,
    private readonly backupService: BackupService,
    private readonly dataSource: DataSource,
  ) {
    this.logger = this.logger.child({ module: 'database' });
  }

  async onModuleInit() {
    if (!(await this.checkHealth())) {
      this.logger.error('Database is not healthy');
      process.exit(1);
    }

    this.backupService.start();
  }

  onModuleDestroy() {
    this.backupService.stop();
  }

  private async checkHealth(): Promise<boolean> {
    const user = await this.dataSource.getRepository(User).find();
    return user.length > 0;
  }
}
