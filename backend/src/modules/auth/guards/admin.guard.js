const { Injectable, CanActivate } = require('@nestjs/common');

@Injectable()
class AdminGuard {
  canActivate(context) {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return user && user.isAdmin === true;
  }
}

module.exports = { AdminGuard };
