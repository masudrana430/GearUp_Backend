import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type {
  CreateGearInput,
  GearQueryInput,
  UpdateGearInput,
} from "./gear.validation.js";

const gearInclude = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  provider: {
    select: {
      id: true,
      name: true,
    },
  },
  _count: {
    select: {
      reviews: true,
    },
  },
} as const;

const isUuid = (value: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
};

const ensureCategoryExists = async (categoryId: string): Promise<void> => {
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      isActive: true,
    },
  });

  if (!category) {
    throw new ApiError(404, "Active category not found", [
      {
        field: "categoryId",
        message: "The selected category does not exist or is inactive",
      },
    ]);
  }
};

const createGear = async (providerId: string, input: CreateGearInput) => {
  await ensureCategoryExists(input.categoryId);

  return prisma.gearItem.create({
    data: {
      name: input.name,
      description: input.description,
      brand: input.brand,
      pricePerDay: input.pricePerDay,
      stockQuantity: input.stockQuantity,
      categoryId: input.categoryId,
      providerId,
      images: input.images ?? [],

      ...(input.specifications !== undefined
        ? {
            specifications: input.specifications as Prisma.InputJsonValue,
          }
        : {}),
    },
    include: gearInclude,
  });
};

const getPublicGear = async (query: GearQueryInput) => {
  const {
    search,
    category,
    brand,
    minPrice,
    maxPrice,
    available,
    page,
    limit,
    sortBy,
    sortOrder,
  } = query;

  const where: Prisma.GearItemWhereInput = {
    isActive: true,

    category: {
      is: {
        isActive: true,
      },
    },

    provider: {
      is: {
        status: "ACTIVE",
      },
    },
  };

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        brand: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (category) {
    if (isUuid(category)) {
      where.category = {
        is: {
          id: category,
          isActive: true,
        },
      };
    } else {
      where.category = {
        is: {
          isActive: true,
          OR: [
            {
              slug: {
                equals: category,
                mode: "insensitive",
              },
            },
            {
              name: {
                equals: category,
                mode: "insensitive",
              },
            },
          ],
        },
      };
    }
  }

  if (brand) {
    where.brand = {
      contains: brand,
      mode: "insensitive",
    };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.pricePerDay = {
      ...(minPrice !== undefined
        ? {
            gte: minPrice,
          }
        : {}),

      ...(maxPrice !== undefined
        ? {
            lte: maxPrice,
          }
        : {}),
    };
  }

  if (available !== undefined) {
    where.stockQuantity = available
      ? {
          gt: 0,
        }
      : {
          equals: 0,
        };
  }

  const skip = (page - 1) * limit;

  const orderBy: Prisma.GearItemOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  };

  const [gearItems, total] = await prisma.$transaction([
    prisma.gearItem.findMany({
      where,
      include: gearInclude,
      orderBy,
      skip,
      take: limit,
    }),

    prisma.gearItem.count({
      where,
    }),
  ]);

  return {
    items: gearItems,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getGearById = async (gearId: string) => {
  const gear = await prisma.gearItem.findFirst({
    where: {
      id: gearId,
      isActive: true,

      category: {
        isActive: true,
      },

      provider: {
        status: "ACTIVE",
      },
    },
    include: {
      ...gearInclude,
      reviews: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          customer: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!gear) {
    throw new ApiError(404, "Gear item not found");
  }

  return gear;
};

const getProviderGear = async (providerId: string) => {
  return prisma.gearItem.findMany({
    where: {
      providerId,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          reviews: true,
          orderItems: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const updateGear = async (
  providerId: string,
  gearId: string,
  input: UpdateGearInput,
) => {
  const gear = await prisma.gearItem.findFirst({
    where: {
      id: gearId,
      providerId,
    },
  });

  if (!gear) {
    throw new ApiError(404, "Gear item not found", [
      {
        message: "The gear item does not exist or does not belong to you",
      },
    ]);
  }

  if (input.categoryId) {
    await ensureCategoryExists(input.categoryId);
  }

  const { specifications, ...standardFields } = input;

  return prisma.gearItem.update({
    where: {
      id: gearId,
    },
    data: {
      ...standardFields,

      ...(specifications !== undefined
        ? {
            specifications: specifications as Prisma.InputJsonValue,
          }
        : {}),
    },
    include: gearInclude,
  });
};

const deleteGear = async (providerId: string, gearId: string) => {
  const gear = await prisma.gearItem.findFirst({
    where: {
      id: gearId,
      providerId,
    },
  });

  if (!gear) {
    throw new ApiError(404, "Gear item not found", [
      {
        message: "The gear item does not exist or does not belong to you",
      },
    ]);
  }

  return prisma.gearItem.update({
    where: {
      id: gearId,
    },
    data: {
      isActive: false,
    },
    include: gearInclude,
  });
};

export const gearService = {
  createGear,
  getPublicGear,
  getGearById,
  getProviderGear,
  updateGear,
  deleteGear,
};
