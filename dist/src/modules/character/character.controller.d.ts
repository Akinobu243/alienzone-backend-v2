import { CharacterService } from './character.service';
export declare class CharacterController {
    private characterService;
    constructor(characterService: CharacterService);
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
    rewardCharacter(req: any): Promise<void>;
    getUserCharacters(req: any): Promise<Promise<import("@prisma/client/runtime").GetResult<{
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
