import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // POST /orders - crear orden
  @Post()
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.id, dto);
  }

  // GET /orders/admin - todos los pedidos (admin)
  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('admin')
  findAllAdmin() {
    return this.ordersService.findAllForAdmin();
  }

  // GET /orders - historial del usuario autenticado
  @Get()
  findAll(@Req() req: any) {
    return this.ordersService.findAllByUser(req.user.id);
  }

  // GET /orders/:id - detalle de una orden (solo la propia)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.ordersService.findOneByUser(id, req.user.id);
  }
}
