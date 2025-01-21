import { User } from '@prisma/client';
import { UserService } from './user.service';
export declare class UserController {
    private userService;
    constructor(userService: UserService);
    checkExists(walletAddress: string): Promise<boolean>;
    getAll(page?: string, limit?: string): Promise<{
        data: User[];
        total: number;
        page: number;
        limit: number;
    }>;
}
