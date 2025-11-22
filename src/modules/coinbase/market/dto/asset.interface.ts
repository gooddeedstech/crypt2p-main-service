interface AssetPrice {
  symbol: string;
  last: number;      // last traded price
  buy: number;       // price user buys from you (ask)
  sell: number;      // price user sells to you (bid)
  currency: 'USD';
  source: string;
}