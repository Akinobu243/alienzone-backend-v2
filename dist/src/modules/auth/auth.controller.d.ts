import { AuthService } from './auth.service';
import { AuthResponseDTO, AuthUserDTO } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    authenticate(user: AuthUserDTO, res: any): Promise<AuthResponseDTO>;
}
