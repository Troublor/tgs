import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsPort,
  ValidateNested,
} from 'class-validator';

export class LogConfig {
  static default() {
    return new LogConfig();
  }

  private constructor() {
    this.level = 'info';
    this.file = undefined;
  }

  @IsIn(['debug', 'info', 'warn', 'error'])
  readonly level: 'debug' | 'info' | 'warn' | 'error';

  @IsOptional()
  readonly file?: string;
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
  }

  readonly host: string;

  @IsPort()
  readonly port: number;

  @IsNotEmpty()
  readonly username: string;

  readonly password?: string;

  @IsNotEmpty()
  readonly database: string;
}

export default class Config {
  static default(): Config {
    return new Config();
  }

  private constructor() {
    this.mode = 'development';
    this.log = LogConfig.default();
    this.database = DatabaseConfig.default();
  }

  @IsIn(['production', 'development'])
  readonly mode: 'production' | 'development';

  @ValidateNested()
  readonly log: LogConfig;

  @ValidateNested()
  readonly database: DatabaseConfig;
}
