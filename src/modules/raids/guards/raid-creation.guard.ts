import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class RaidCreationGuard implements CanActivate {
  private readonly USERNAME = 'alienzone';
  private readonly PASSWORD = 'raid_creation_2025';

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      throw new UnauthorizedException('Missing Basic Auth credentials');
    }

    // Extract and decode credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString(
      'utf-8',
    );
    const [username, password] = credentials.split(':');

    if (username === this.USERNAME && password === this.PASSWORD) {
      return true;
    }

    throw new UnauthorizedException('Invalid credentials');
  }
}
