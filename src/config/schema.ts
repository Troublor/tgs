import { IsIn, IsInt, IsNotEmpty, ValidateNested } from 'class-validator';
import { Optional } from '@nestjs/common';

export class LogConfig {
  static default() {
    return new LogConfig();
  }

  private constructor() {
    this.level = 'info';
    this.file = './logs/tgs.log';
  }

  @IsIn(['debug', 'info', 'warn', 'error'])
  readonly level: 'debug' | 'info' | 'warn' | 'error';

  @IsNotEmpty()
  readonly file: string;
}

export class HLedgerConfig {
  static default() {
    return new HLedgerConfig();
  }

  private constructor() {
    this.netDriveLedgerFilePath = 'Database/hledger/main.journal';
    this.port = 5000;
    this.baseUrl = 'https://hledger.troublor.xyz';
    this.disable = false;
  }

  @IsNotEmpty()
  readonly netDriveLedgerFilePath: string;

  @IsNotEmpty()
  readonly port: number;

  @IsNotEmpty()
  readonly baseUrl: string;

  readonly disable: boolean;
}

export class DatabaseConfig {
  static default() {
    return new DatabaseConfig();
  }

  private constructor() {
    this.host = 'localhost';
    this.port = 5432;
    this.username = 'tgs';
    this.password = 'tgs';
    this.database = 'tgs';
    this.netDriveBackupFolder = 'Database/tgs-postgres';
    this.backupInterval = 1000 * 3600;
  }

  readonly host: string;

  readonly port: number;

  @IsNotEmpty()
  readonly username: string;

  @Optional()
  readonly password?: string;

  @IsNotEmpty()
  readonly database: string;

  @IsNotEmpty()
  readonly netDriveBackupFolder: string;

  @IsInt()
  readonly backupInterval: number;
}

export class NetDriveConfig {
  static default() {
    return new NetDriveConfig();
  }

  private constructor() {
    this.rcloneConfigPath = '.rclone/rclone.conf';
    this.rcloneRemote = 'OneDrive';
  }

  @IsNotEmpty({ message: 'rclone config path is required' })
  readonly rcloneConfigPath: string;

  @IsNotEmpty()
  readonly rcloneRemote: string;
}

export class TelegramBotConfig {
  static default() {
    return new TelegramBotConfig();
  }

  private constructor() {
    this.token = '';
    this.disable = false;
  }

  @IsNotEmpty()
  readonly token: string;

  readonly disable: boolean;
}

export default class Config {
  static default(): Config {
    return new Config();
  }

  private constructor() {
    this.mode = 'development';
    this.port = 3000;
    this.log = LogConfig.default();
    this.database = DatabaseConfig.default();
    this.netDrive = NetDriveConfig.default();
    this.hledger = HLedgerConfig.default();
    this.telegramBot = TelegramBotConfig.default();
  }

  @IsIn(['production', 'development'])
  readonly mode: 'production' | 'development';

  readonly port: number;

  @ValidateNested()
  readonly log: LogConfig;

  @ValidateNested()
  readonly database: DatabaseConfig;

  @ValidateNested()
  readonly netDrive: NetDriveConfig;

  @ValidateNested()
  readonly hledger: HLedgerConfig;

  @ValidateNested()
  readonly telegramBot: TelegramBotConfig;
}
