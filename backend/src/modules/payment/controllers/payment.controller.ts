import { Controller, Post, Body, UseGuards, Request, Headers, RawBody } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaymentService } from './services/payment.service';
import { CreateSubscriptionDto } from './dto/payment.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created' })
  @Post('subscribe')
  async subscribe(@Request() req, @Body() dto: CreateSubscriptionDto) {
    return this.paymentService.createSubscription(req.user.userId, dto.plan);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook' })
  @ApiResponse({ status: 200, description: 'Webhook received' })
  async webhook(@Headers('stripe-signature') signature: string, @RawBody() body: Buffer) {
    return this.paymentService.handleWebhook(signature, body);
  }
}
