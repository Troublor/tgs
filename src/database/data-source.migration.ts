import buildDataSource from './data-source.base.js';

const dataSourceForMigration = buildDataSource({
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
});
export default dataSourceForMigration;
