import { Asset, AssetType } from '../../entities/assets.entity';
import { DataSource } from 'typeorm';


export class AssetSeeder {
  public static async run(dataSource: DataSource) {
    const repo = dataSource.getRepository(Asset);

    const assets: Partial<Asset>[] = [
      {
        code: 'BTC',
        description: 'Bitcoin',
        type: AssetType.COIN,
        decimals: 8,
        networks: [{ name: 'BTC (BTC)', value: 'BTC' }],
        is_active: true,
      },
      {
        code: 'USDT',
        description: 'Tether USD',
        type: AssetType.STABLECOIN,
        decimals: 6,
        networks: [
          { name: 'USDT-BEP20 (BSC)', value: 'BEP20' },
          { name: 'USDT-ERC20 (ETH)', value: 'ERC20' },
          { name: 'USDT-TRC20 (TRX)', value: 'TRC20' },
        ],
        is_active: true,
      },
      {
        code: 'ETH',
        description: 'Ethereum',
        type: AssetType.COIN,
        decimals: 18,
        networks: [
          { name: 'ETH-BASE (Base)', value: 'BASE' },
          { name: 'ETH (ETH)', value: 'ETH' },
        ],
        is_active: true,
      },
      {
        code: 'USDC',
        description: 'USD Coin',
        type: AssetType.STABLECOIN,
        decimals: 6,
        networks: [
          { name: 'USDC-ERC20 (ETH)', value: 'ERC20' },
          { name: 'USDC-TRC20 (TRX)', value: 'TRC20' },
          { name: 'USDC-XLM (XLM)', value: 'XLM' },
        ],
        is_active: true,
      },
      {
        code: 'BNB',
        description: 'Binance Coin',
        type: AssetType.COIN,
        decimals: 18,
        networks: [
          { name: 'BNB-ERC20 (ETH)', value: 'ERC20' },
          { name: 'BNB-ACC (MATIC)', value: 'MATIC' },
          { name: 'BNB-444 (XRP)', value: 'XRP' },
        ],
        is_active: true,
      },
      {
        code: 'LTC',
        description: 'Litecoin',
        type: AssetType.COIN,
        decimals: 8,
        networks: [{ name: 'LTC (LTC)', value: 'LTC' }],
        is_active: true,
      },
      {
        code: 'TRX',
        description: 'Tron',
        type: AssetType.COIN,
        decimals: 6,
        networks: [{ name: 'TRX (TRX)', value: 'TRX' }],
        is_active: true,
      },
      {
        code: 'SOL',
        description: 'Solana',
        type: AssetType.COIN,
        decimals: 9,
        networks: [{ name: 'SOL (SOL)', value: 'SOL' }],
        is_active: true,
      },
    ];

    for (const data of assets) {
      const exists = await repo.findOne({ where: { code: data.code } });
      if (!exists) {
        await repo.save(repo.create(data));
        console.log(`✅ Inserted asset: ${data.code}`);
      } else {
        console.log(`⚠️ Asset already exists: ${data.code}`);
      }
    }

    console.log('🎉 Asset seeding completed!');
  }
}