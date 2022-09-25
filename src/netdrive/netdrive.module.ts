import { Inject, Module, OnModuleInit } from '@nestjs/common';
import RCloneService from './rclone.service.js';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import winston from 'winston';

/**
 * NetDrive modules leverage rclone {@link https://rclone.org/} to mount OneDrive to a local folder.
 * The folder in OneDrive to mount and the mount point is configured in the Config.
 */
@Module({
  providers: [RCloneService],
  exports: [RCloneService],
})
export default class NetDriveModule implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: winston.Logger,
    private readonly rcloneService: RCloneService,
  ) {
    this.logger = this.logger.child({ module: 'netdrive' });
  }

  async onModuleInit() {
    if (!(await this.rcloneService.checkHealth())) {
      this.logger.error('rclone is not healthy');
      process.exit(-1);
    }
    this.logger.info('rclone is healthy');
  }
}
