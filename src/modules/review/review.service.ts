import {
  Prisma,
  RentalStatus,
  UserRole,
} from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type {
  CreateReviewInput,
  ReviewQueryInput,
  UpdateReviewInput,
} from "./review.interface.js";

const reviewInclude = {
  customer: {
    select: {
      id: true,
      name: true,
      profileImage: true,
    },
  },

  gearItem: {
    select: {
      id: true,
      name: true,
      brand: true,
      images: true,
    },
  },

  rentalOrder: {
    select: {
      id: true,
      orderNumber: true,
      returnedAt: true,
    },
  },
} as const;

const createReview = async (
  customerId: string,
  input: CreateReviewInput,
) => {
  const rental = await prisma.rentalOrder.findFirst({
    where: {
      id: input.rentalOrderId,
      customerId,
      status: RentalStatus.RETURNED,

      items: {
        some: {
          gearItemId: input.gearItemId,
        },
      },
    },

    select: {
      id: true,
      status: true,
      returnedAt: true,
    },
  });

  if (!rental) {
    throw new ApiError(
      403,
      "Review is not allowed",
      [
        {
          message:
            "You can review only gear from your returned rental orders",
        },
      ],
    );
  }

  const existingReview = await prisma.review.findUnique({
    where: {
      rentalOrderId_gearItemId: {
        rentalOrderId: input.rentalOrderId,
        gearItemId: input.gearItemId,
      },
    },
  });

  if (existingReview) {
    throw new ApiError(
      409,
      "Review already submitted",
      [
        {
          message:
            "You have already reviewed this gear for this rental",
        },
      ],
    );
  }

  return prisma.review.create({
    data: {
      customerId,
      rentalOrderId: input.rentalOrderId,
      gearItemId: input.gearItemId,
      rating: input.rating,
      comment: input.comment,
    },

    include: reviewInclude,
  });
};

const getGearReviews = async (
  gearId: string,
  query: ReviewQueryInput,
) => {
  const gear = await prisma.gearItem.findFirst({
    where: {
      id: gearId,
      isActive: true,
    },

    select: {
      id: true,
    },
  });

  if (!gear) {
    throw new ApiError(404, "Gear item not found");
  }

  const { page, limit, sortOrder } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.ReviewWhereInput = {
    gearItemId: gearId,
  };

  const [reviews, total, ratingSummary] =
    await prisma.$transaction([
      prisma.review.findMany({
        where,

        include: {
          customer: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },

        orderBy: {
          createdAt: sortOrder,
        },

        skip,
        take: limit,
      }),

      prisma.review.count({
        where,
      }),

      prisma.review.aggregate({
        where,

        _avg: {
          rating: true,
        },

        _count: {
          rating: true,
        },
      }),
    ]);

  return {
    items: reviews,

    summary: {
      averageRating:
        ratingSummary._avg.rating ?? 0,

      totalReviews:
        ratingSummary._count.rating,
    },

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateReview = async (
  customerId: string,
  reviewId: string,
  input: UpdateReviewInput,
) => {
  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      customerId,
    },
  });

  if (!review) {
    throw new ApiError(
      404,
      "Review not found",
      [
        {
          message:
            "The review does not exist or does not belong to you",
        },
      ],
    );
  }

  return prisma.review.update({
    where: {
      id: reviewId,
    },

    data: input,

    include: reviewInclude,
  });
};

const deleteReview = async (
  authenticatedUserId: string,
  authenticatedRole: UserRole,
  reviewId: string,
) => {
  const review = await prisma.review.findUnique({
    where: {
      id: reviewId,
    },
  });

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  const isOwner =
    review.customerId === authenticatedUserId;

  const isAdmin =
    authenticatedRole === UserRole.ADMIN;

  if (!isOwner && !isAdmin) {
    throw new ApiError(
      403,
      "You cannot delete this review",
    );
  }

  await prisma.review.delete({
    where: {
      id: reviewId,
    },
  });

  return {
    id: reviewId,
  };
};

export const reviewService = {
  createReview,
  getGearReviews,
  updateReview,
  deleteReview,
};