import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStorefrontConfigDto } from './dto/update-storefront-config.dto';

const STOREFRONT_CONFIG_ID = 'default';

@Injectable()
export class StorefrontService {
  constructor(private readonly prisma: PrismaService) {}

  getConfig() {
    return this.prisma.storefrontConfig.upsert({
      where: {
        id: STOREFRONT_CONFIG_ID,
      },
      update: {},
      create: {
        id: STOREFRONT_CONFIG_ID,
      },
    });
  }

  updateConfig(data: UpdateStorefrontConfigDto) {
    const heroEyebrow = data.heroEyebrow?.trim();
    const heroTitle = data.heroTitle?.trim();
    const heroSubtitle = data.heroSubtitle?.trim();
    const heroImageUrl =
      data.heroImageUrl !== undefined
        ? data.heroImageUrl.trim() || null
        : undefined;
    const heroTargetCategorySlug =
      data.heroTargetCategorySlug !== undefined
        ? data.heroTargetCategorySlug.trim() || null
        : undefined;

    const updateData: Prisma.StorefrontConfigUpdateInput = {
      ...(heroEyebrow !== undefined ? { heroEyebrow } : {}),
      ...(heroTitle !== undefined ? { heroTitle } : {}),
      ...(heroSubtitle !== undefined ? { heroSubtitle } : {}),
      ...(heroImageUrl !== undefined ? { heroImageUrl } : {}),
      ...(heroTargetCategorySlug !== undefined
        ? { heroTargetCategorySlug }
        : {}),
    };

    const createData: Prisma.StorefrontConfigCreateInput = {
      id: STOREFRONT_CONFIG_ID,
      ...(heroEyebrow !== undefined ? { heroEyebrow } : {}),
      ...(heroTitle !== undefined ? { heroTitle } : {}),
      ...(heroSubtitle !== undefined ? { heroSubtitle } : {}),
      ...(heroImageUrl !== undefined ? { heroImageUrl } : {}),
      ...(heroTargetCategorySlug !== undefined
        ? { heroTargetCategorySlug }
        : {}),
    };

    return this.prisma.storefrontConfig.upsert({
      where: {
        id: STOREFRONT_CONFIG_ID,
      },
      update: updateData,
      create: createData,
    });
  }
}
