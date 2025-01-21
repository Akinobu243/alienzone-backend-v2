import { RaidsService } from './raids.service';
import { CreateRaidDTO, EditRaidDTO, LaunchRaidDTO } from './dto/raids.dto';
export declare class RaidsController {
    private raidsService;
    constructor(raidsService: RaidsService);
    getRaidsList(): Promise<({
        rewards: (import("@prisma/client/runtime").GetResult<{
            id: number;
            type: import(".prisma/client").RewardType;
            amount: number;
            createdAt: Date;
            updatedAt: Date;
        }, unknown, never> & {})[];
    } & import("@prisma/client/runtime").GetResult<{
        id: number;
        title: string;
        description: string;
        duration: number;
        icon: string;
        image: string;
        createdAt: Date;
        updatedAt: Date;
    }, unknown, never> & {})[]>;
    createRaid(createRaidDTO: CreateRaidDTO, req: any): Promise<void>;
    editRaid(editRaidDto: EditRaidDTO, req: any): Promise<void>;
    launchRaid(launchRaidDTO: LaunchRaidDTO, req: any): Promise<import("@prisma/client/runtime").GetResult<{
        id: number;
        raidId: number;
        userId: number;
        inProgress: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, unknown, never> & {}>;
    getRaidHistory(req: any): Promise<({
        aliens: (import("@prisma/client/runtime").GetResult<{
            id: number;
            name: string;
            element: string;
            image: string;
            strengthPoints: number;
            userId: number;
            inRaid: boolean;
            createdAt: Date;
            updatedAt: Date;
        }, unknown, never> & {})[];
    } & import("@prisma/client/runtime").GetResult<{
        id: number;
        raidId: number;
        userId: number;
        inProgress: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, unknown, never> & {})[]>;
}
