import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { BushaAPIService } from './busha-api.service';


@Controller()
export class BushaAPIMessageController {
  constructor(private readonly busha: BushaAPIService) {}

  @MessagePattern({ cmd: 'busha.pairs' })
  listPairs() {
    return this.busha.listBuyPairs();
  }

  @MessagePattern({ cmd: 'busha.price' })
  getPrice(symbol: string) {
    return this.busha.getPrice(symbol);
  }
}