const { IsString, IsNumber, IsOptional } = require('class-validator');

class CreateSubscriptionDto {
  plan;
  amount;
  transactionRef;
  paymentProof;
}

class UpdatePaymentStatusDto {
  paymentId;
  status;
  adminNote;
}

module.exports = { CreateSubscriptionDto, UpdatePaymentStatusDto };
