import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class CostManagementService {
  private readonly logger = new Logger(CostManagementService.name);
  
  private readonly STORAGE_COST_PER_GB_MONTH = 0.015; // R2 pricing
  private readonly BANDWIDTH_COST_PER_GB = 0.0; // R2 has no egress fees
  private readonly COST_PER_UPLOAD_OPERATION = 0.0004 / 1000; // $0.0004 per 1000
  private readonly COST_PER_DOWNLOAD_OPERATION = 0.0001 / 1000; // $0.0001 per 1000

  constructor(
    private prisma: PrismaService,
  ) {}

  async calculateStorageCost(fileSize: number): Promise<number> {
    const sizeInGB = fileSize / (1024 * 1024 * 1024);
    return sizeInGB * this.STORAGE_COST_PER_GB_MONTH;
  }

  async calculateBandwidthCost(fileSize: number): Promise<number> {
    const sizeInGB = fileSize / (1024 * 1024 * 1024);
    return sizeInGB * this.BANDWIDTH_COST_PER_GB;
  }

  async getProjectedMonthlyCost(): Promise<{
    storage: number;
    operations: number;
    total: number;
  }> {
    const files = await this.prisma.file.findMany({
      where: { isDeleted: false },
    });

    const totalStorage = files.reduce((acc, f) => acc + f.size, 0);
    const totalDownloads = files.reduce((acc, f) => acc + f.downloadCount, 0);
    
    const storageCost = (totalStorage / (1024 * 1024 * 1024)) * this.STORAGE_COST_PER_GB_MONTH;
    const operationsCost = (totalDownloads * this.COST_PER_DOWNLOAD_OPERATION) + 
                          (files.length * this.COST_PER_UPLOAD_OPERATION);

    return {
      storage: storageCost,
      operations: operationsCost,
      total: storageCost + operationsCost,
    };
  }

  async markDuplicateFile(originalFileId: string, duplicateFileId: string): Promise<void> {
    // No additional storage cost for duplicates
    this.logger.log(`Duplicate detected: ${duplicateFileId} references ${originalFileId}`);
  }
}
