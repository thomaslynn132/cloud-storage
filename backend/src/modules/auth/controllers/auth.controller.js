const { Controller, Post, Body } = require('@nestjs/common');
const { ApiTags, ApiOperation, ApiResponse } = require('@nestjs/swagger');
const { AuthService } = require('./services/auth.service');

@ApiTags('auth')
@Controller('auth')
class AuthController {
  constructor(private authService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 401, description: 'Email already exists' })
  async register(@Body() dto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body('refreshToken') refreshToken) {
    return this.authService.refreshToken(refreshToken);
  }
}

module.exports = { AuthController };
