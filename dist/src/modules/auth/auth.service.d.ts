import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthResponseDTO, AuthUserDTO, RegisterUserDTO } from './dto/auth.dto';
export declare class AuthService {
    private userService;
    private prisma;
    private jwtService;
    constructor(userService: UserService, prisma: PrismaService, jwtService: JwtService);
    authenticate(authUser: AuthUserDTO, admin?: boolean, registerUser?: RegisterUserDTO): Promise<AuthResponseDTO>;
    private isValidWalletAddress;
}
