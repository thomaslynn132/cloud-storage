import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class FileValidationService {
  private readonly logger = new Logger(FileValidationService.name);
  
  private readonly BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.vbs', '.js'];
  private readonly BLOCKED_MIME_TYPES = ['application/x-msdownload', 'application/x-executable'];
  private readonly MAX_FILE_SIZE_FREE = 1024 * 1024 * 1024; // 1GB
  private readonly MAX_FILE_SIZE_PAID = 10 * 1024 * 1024 * 1024; // 10GB

  validateFileType(fileName: string, mimeType: string): void {
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    if (this.BLOCKED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(`File type ${ext} is not allowed`);
    }
    
    if (this.BLOCKED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException(`MIME type ${mimeType} is not allowed`);
    }
  }

  validateFileSize(size: number, isPaid: boolean): void {
    const limit = isPaid ? this.MAX_FILE_SIZE_PAID : this.MAX_FILE_SIZE_FREE;
    
    if (size > limit) {
      throw new BadRequestException(`File size exceeds limit of ${limit / (1024 * 1024 * 1024)}GB`);
    }
  }

  isAllowedMimeType(mimeType: string): boolean {
    const ALLOWED_TYPES = [
      'image/', 'video/', 'audio/', 'text/', 'application/pdf',
      'application/zip', 'application/json', 'application/xml'
    ];
    
    return ALLOWED_TYPES.some(type => mimeType.startsWith(type));
  }
}
