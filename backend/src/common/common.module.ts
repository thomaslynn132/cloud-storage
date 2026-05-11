import { Global, Module } from '@nestjs/common';
import { PermissionGuard } from './guards/permission.guard';

@Global()
@Module({
  providers: [PermissionGuard],
  exports: [PermissionGuard],
})
export class CommonModule {}
