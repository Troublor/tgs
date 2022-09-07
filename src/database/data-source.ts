import { DataSource, DataSourceOptions } from 'typeorm';

export default function buildDataSource(opts: Partial<DataSourceOptions>) {
  const dataSourceConfig: DataSourceOptions = {
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'tgs',
    password: 'tgs',
    database: 'tgs',
  };
  const options = Object.assign(dataSourceConfig, opts);
  return new DataSource(options);
}
