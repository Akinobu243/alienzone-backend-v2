import { ItemsService } from './items.service';
import { SetDailyRewardDto } from './dto/daily-rewards.dto';
export declare class ItemsController {
    private readonly itemsService;
    constructor(itemsService: ItemsService);
    createItem(name: string, description: string, image: string): Promise<void>;
    editItem(id: number, name: string, description: string, image: string): Promise<void>;
    deleteItem(id: number): Promise<void>;
    getAllItems(page?: number, limit?: number): Promise<(import("@prisma/client/runtime").GetResult<{
        id: number;
        name: string;
        description: string;
        image: string;
    }, unknown, never> & {})[]>;
    setDailyRewards(rewards: SetDailyRewardDto[]): Promise<void>;
}
