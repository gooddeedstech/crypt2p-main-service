import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source'; // adjust to your config path
import { AssetSeeder } from '../database/seeds/asset.seeder';

AppDataSource.initialize()
  .then(async (dataSource: DataSource) => {
    await AssetSeeder.run(dataSource);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });