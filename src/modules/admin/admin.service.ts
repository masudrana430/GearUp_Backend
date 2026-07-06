import {
  PaymentStatus,
  Prisma,
  RentalStatus,
  UserRole,
  UserStatus,
} from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type {
  AdminGearQuery,
  AdminPaymentQuery,
  AdminRentalQuery,
  AdminUserQuery,
} from "./admin.interface.js";

const getUsers = async (query: AdminUserQuery) => {
  const {
    search,
    role,
    status,
    page,
    limit,
    sortOrder,
  } = query;

  const where: Prisma.UserWhereInput = {};

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        email: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        phone: {
          contains: search,
        },
      },
    ];
  }

  if (role) {
    where.role = role as UserRole;
  }

  if (status) {
    where.status = status as UserStatus;
  }

  const skip = (page - 1) * limit;

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,

      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        profileImage: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,

        _count: {
          select: {
            gearItems: true,
            customerOrders: true,
            providerOrders: true,
            reviews: true,
          },
        },
      },

      orderBy: {
        createdAt: sortOrder,
      },

      skip,
      take: limit,
    }),

    prisma.user.count({
      where,
    }),
  ]);

  return {
    items: users,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateUserStatus = async (
  adminId: string,
  userId: string,
  status: "ACTIVE" | "SUSPENDED",
) => {
  if (adminId === userId) {
    throw new ApiError(
      400,
      "You cannot change your own account status",
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role === UserRole.ADMIN) {
    throw new ApiError(
      403,
      "Another admin account cannot be suspended",
    );
  }

  return prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      status: status as UserStatus,
    },

    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });
};

const getGear = async (query: AdminGearQuery) => {
  const {
    search,
    isActive,
    page,
    limit,
    sortOrder,
  } = query;

  const where: Prisma.GearItemWhereInput = {};

  if (search) {
    where.OR = [
      {
        name: {
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
      {
        provider: {
          is: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      },
    ];
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const skip = (page - 1) * limit;

  const [gearItems, total] =
    await prisma.$transaction([
      prisma.gearItem.findMany({
        where,

        include: {
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
              email: true,
              status: true,
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
          createdAt: sortOrder,
        },

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

const updateGearStatus = async (
  gearId: string,
  isActive: boolean,
) => {
  const gear = await prisma.gearItem.findUnique({
    where: {
      id: gearId,
    },
  });

  if (!gear) {
    throw new ApiError(404, "Gear item not found");
  }

  return prisma.gearItem.update({
    where: {
      id: gearId,
    },

    data: {
      isActive,
    },

    include: {
      category: true,

      provider: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

const getRentals = async (
  query: AdminRentalQuery,
) => {
  const {
    status,
    page,
    limit,
    sortOrder,
  } = query;

  const where: Prisma.RentalOrderWhereInput = {
    ...(status
      ? {
          status: status as RentalStatus,
        }
      : {}),
  };

  const skip = (page - 1) * limit;

  const [rentals, total] =
    await prisma.$transaction([
      prisma.rentalOrder.findMany({
        where,

        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          provider: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          items: true,

          payments: {
            select: {
              id: true,
              transactionId: true,
              amount: true,
              status: true,
              provider: true,
              paidAt: true,
            },
          },
        },

        orderBy: {
          createdAt: sortOrder,
        },

        skip,
        take: limit,
      }),

      prisma.rentalOrder.count({
        where,
      }),
    ]);

  return {
    items: rentals,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getPayments = async (
  query: AdminPaymentQuery,
) => {
  const {
    status,
    page,
    limit,
    sortOrder,
  } = query;

  const where: Prisma.PaymentWhereInput = {
    ...(status
      ? {
          status: status as PaymentStatus,
        }
      : {}),
  };

  const skip = (page - 1) * limit;

  const [payments, total] =
    await prisma.$transaction([
      prisma.payment.findMany({
        where,

        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          rentalOrder: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              totalAmount: true,
            },
          },
        },

        orderBy: {
          createdAt: sortOrder,
        },

        skip,
        take: limit,
      }),

      prisma.payment.count({
        where,
      }),
    ]);

  return {
    items: payments,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const adminService = {
  getUsers,
  updateUserStatus,
  getGear,
  updateGearStatus,
  getRentals,
  getPayments,
};