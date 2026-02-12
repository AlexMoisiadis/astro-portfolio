// app/api/portfolio/route.types.ts
import type { ImmichAsset } from '@/types/immich.types';

export type PortfolioSearchResponse = {
    assets?: ImmichAsset[] | null;
} | {
    assets?: { items?: ImmichAsset[] | null } | null;
};