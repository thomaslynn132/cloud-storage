import { Controller, Post, Body, Get, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { PaymentService } from '../services/payment.service';
import { CreatePaymentDto, UpdatePaymentStatusDto } from '../dto/payment.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment request with proof attachment' })
  @ApiResponse({ status: 201, description: 'Payment request created' })
  @Post('request')
  @UseInterceptors(
    FileInterceptor('paymentProof', {
      storage: diskStorage({
        destination: './uploads/payment-proofs',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        pricingType: { type: 'string', enum: ['STORAGE_GB', 'RETENTION_DAYS'] },
        units: { type: 'number' },
        amount: { type: 'number' },
        retentionDays: { type: 'number' },
        storageBytes: { type: 'string' },
        transactionRef: { type: 'string' },
        paymentProof: { type: 'string', format: 'binary' },
      },
    },
  })
  async createPayment(@Request() req, @Body() dto: CreatePaymentDto, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      dto.paymentProof = file.path;
    }
    return this.paymentService.createPaymentRequest(req.user.userId, dto);
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

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available pricing rules' })
  @ApiResponse({ status: 200, description: 'Returns pricing rules' })
  @Get('pricing-rules')
  async getPricingRules() {
    return this.paymentService.getPricingRules();
  }
}
