import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtStrategy } from '../strategies/jwt.strategy';

@Injectable()
export class JwtAuthGuard extends (require('@nestjs/passport').AuthGuard('jwt')) {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
