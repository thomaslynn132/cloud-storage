const { Controller, Post, Body, Get, UseGuards } = require('@nestjs/common');
const { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } = require('@nestjs/swagger');
const { JwtAuthGuard } = require('../../auth/guards/jwt-auth.guard');
const { AdminGuard } = require('../../auth/guards/admin.guard');
const { PaymentService } = require('./services/payment.service');
const { FileInterceptor } = require('@nestjs/platform-express');
const { UploadedFile } = require('@nestjs/common');

@ApiTags('payments')
@Controller('payments')
class PaymentController {
  constructor(private paymentService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request subscription (upload payment proof)' })
  @ApiResponse({ status: 201, description: 'Payment request created' })
  @Post('subscribe')
  @UseGuards(FileInterceptor('paymentProof'))
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
  async subscribe(req, @Body() dto, @UploadedFile() file) {
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
  async confirmPayment(@Body() dto) {
    return this.paymentService.updatePaymentStatus(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user payment history' })
  @ApiResponse({ status: 200, description: 'Returns user payments' })
  @Get('history')
  async getPaymentHistory(req) {
    return this.paymentService.getUserPayments(req.user.userId);
  }
}

module.exports = { PaymentController };
