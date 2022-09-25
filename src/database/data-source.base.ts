import { DataSource, DataSourceOptions } from 'typeorm';

export const baseDataSourceConfig: DataSourceOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'tgs',
  password: 'tgs',
  database: 'tgs',
};

export default function buildDataSource(opts: Partial<DataSourceOptions>) {
  const options = Object.assign(baseDataSourceConfig, opts);
  return new DataSource(options);
}
