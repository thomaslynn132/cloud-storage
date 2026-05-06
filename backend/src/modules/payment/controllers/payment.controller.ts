import { Controller, Post, Body, Get, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { PaymentService } from '../services/payment.service';
import { CreateSubscriptionDto, UpdatePaymentStatusDto } from '../dto/payment.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request subscription (upload payment proof)' })
  @ApiResponse({ status: 201, description: 'Payment request created' })
  @Post('subscribe')
  @UseInterceptors(FileInterceptor('paymentProof'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        plan: { type: 'string', enum: ['basic', 'pro'] },
        amount: { type: 'number' },
        transactionRef: { type: 'string' },
        paymentProof: { type: 'string', format: 'binary' },
      },
    },
  })
  async subscribe(@Request() req, @Body() dto: CreateSubscriptionDto, @UploadedFile() file: Express.Multer.File) {
    // In production, save file to R2 or local storage
    const paymentProof = file ? `data:${file.mimetype};base64,${file.buffer.toString('base64')}` : dto.paymentProof;
    return this.paymentService.requestSubscription(req.user.userId, { ...dto, paymentProof });
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending payment requests (admin only)' })
  @ApiResponse({ status: 200, description: 'Returns pending payments' })
  @Get('pending')
  async getPendingPayments() {
    return this.paymentService.getPendingPayments();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve/reject payment (admin only)' })
  @ApiResponse({ status: 200, description: 'Payment status updated' })
  @Post('confirm')
  async confirmPayment(@Body() dto: UpdatePaymentStatusDto) {
    return this.paymentService.updatePaymentStatus(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user payment history' })
  @ApiResponse({ status: 200, description: 'Returns user payments' })
  @Get('history')
  async getPaymentHistory(@Request() req) {
    return this.paymentService.getUserPayments(req.user.userId);
  }
}
