import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./category.validation.js";

const createSlug = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const getPublicCategories = async () => {
  return prisma.category.findMany({
    where: {
      isActive: true,
    },
    include: {
      _count: {
        select: {
          gearItems: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
};

const getAllCategories = async () => {
  return prisma.category.findMany({
    include: {
      _count: {
        select: {
          gearItems: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const createCategory = async (input: CreateCategoryInput) => {
  const slug = createSlug(input.name);

  if (!slug) {
    throw new ApiError(400, "Invalid category name");
  }

  const existingCategory = await prisma.category.findFirst({
    where: {
      OR: [
        {
          name: {
            equals: input.name,
            mode: "insensitive",
          },
        },
        {
          slug,
        },
      ],
    },
  });

  if (existingCategory) {
    throw new ApiError(409, "Category already exists", [
      {
        field: "name",
        message: "A category with this name already exists",
      },
    ]);
  }

  return prisma.category.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
    },
  });
};

const updateCategory = async (
  categoryId: string,
  input: UpdateCategoryInput,
) => {
  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  let slug: string | undefined;

  if (input.name) {
    slug = createSlug(input.name);

    const duplicateCategory = await prisma.category.findFirst({
      where: {
        id: {
          not: categoryId,
        },
        OR: [
          {
            name: {
              equals: input.name,
              mode: "insensitive",
            },
          },
          {
            slug,
          },
        ],
      },
    });

    if (duplicateCategory) {
      throw new ApiError(409, "Category already exists", [
        {
          field: "name",
          message: "Another category uses this name",
        },
      ]);
    }
  }

  return prisma.category.update({
    where: {
      id: categoryId,
    },
    data: {
      ...input,
      ...(slug ? { slug } : {}),
    },
  });
};

const deleteCategory = async (categoryId: string) => {
  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return prisma.category.update({
    where: {
      id: categoryId,
    },
    data: {
      isActive: false,
    },
  });
};

export const categoryService = {
  getPublicCategories,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};