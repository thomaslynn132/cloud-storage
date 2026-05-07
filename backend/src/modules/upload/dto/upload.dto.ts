import { IsString, IsNumber, IsOptional } from 'class-validator';

export class InitUploadDto {
  @IsString()
  fileName: string;

  @IsNumber()
  fileSize: number;

  @IsString()
  fileHash: string;

  @IsOptional()
  @IsNumber()
  duration?: number; // in seconds, for media files

  @IsOptional()
  isPermanent?: boolean;
}

export class CompleteUploadDto {
  @IsString()
  uploadId: string;

  @IsString()
  storageKey: string;

  @IsOptional()
  @IsNumber()
  duration?: number; // actual duration after processing
}
