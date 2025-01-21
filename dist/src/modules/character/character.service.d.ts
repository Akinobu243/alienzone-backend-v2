import { PrismaService } from '../prisma/prisma.service';
export declare class CharacterService {
    private prisma;
    constructor(prisma: PrismaService);
    createCharacter(name: string, level: number, element: string, strengthPoints: number, image: string): Promise<void>;
    editCharacter(id: number, name?: string, level?: number, element?: string, strengthPoints?: number, image?: string): Promise<void>;
    deleteCharacter(id: number): Promise<void>;
    getAllCharacters(): Promise<(import("@prisma/client/runtime").GetResult<{
        id: number;
        name: string;
        element: string;
        strengthPoints: number;
        level: number;
        image: string;
        createdAt: Date;
        updatedAt: Date;
    }, unknown, never> & {})[]>;
    rewardCharacter(walletAddress: string): Promise<void>;
    getUserCharacters(walletAddress: string): Promise<Promise<import("@prisma/client/runtime").GetResult<{
        id: number;
        name: string;
        element: string;
        strengthPoints: number;
        level: number;
        image: string;
        createdAt: Date;
        updatedAt: Date;
    }, unknown, never> & {}>[]>;
}
