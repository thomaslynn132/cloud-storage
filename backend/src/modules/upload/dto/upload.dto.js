const { IsString, IsNumber, IsOptional } = require('class-validator');

class InitUploadDto {
  fileName;
  fileSize;
  fileHash;
  isPermanent;
}

class CompleteUploadDto {
  uploadId;
  storageKey;
}

module.exports = { InitUploadDto, CompleteUploadDto };
