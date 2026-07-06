import { randomUUID } from "node:crypto";
import {
  Prisma,
  RentalStatus,
} from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type {
  CreateRentalInput,
  RentalQueryInput,
  UpdateRentalStatusInput,
} from "./rental.interface.js";

const ACTIVE_RESERVATION_STATUSES: RentalStatus[] = [
  RentalStatus.PLACED,
  RentalStatus.CONFIRMED,
  RentalStatus.PAID,
  RentalStatus.PICKED_UP,
];

const DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24;

const rentalOrderDetailsInclude = {
  customer: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },

  provider: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },

  items: {
    include: {
      gearItem: {
        select: {
          id: true,
          name: true,
          brand: true,
          images: true,
          isActive: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  },

  payments: {
    select: {
      id: true,
      transactionId: true,
      amount: true,
      currency: true,
      method: true,
      provider: true,
      status: true,
      paidAt: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc" as const,
    },
  },
} as const;

const parseDate = (value: string): Date => {
  return new Date(`${value}T00:00:00.000Z`);
};

const calculateRentalDays = (
  startDate: Date,
  endDate: Date,
): number => {
  return (
    Math.floor(
      (endDate.getTime() - startDate.getTime()) /
        DAY_IN_MILLISECONDS,
    ) + 1
  );
};

const createOrderNumber = (): string => {
  const timestamp = Date.now();

  const randomPart = randomUUID()
    .replaceAll("-", "")
    .slice(0, 8)
    .toUpperCase();

  return `GU-${timestamp}-${randomPart}`;
};

const isTransactionConflict = (
  error: unknown,
): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034"
  );
};

const createRentalTransaction = async (
  customerId: string,
  input: CreateRentalInput,
) => {
  const startDate = parseDate(input.startDate);
  const endDate = parseDate(input.endDate);

  const rentalDays = calculateRentalDays(
    startDate,
    endDate,
  );

  const gearIds = input.items.map(
    (item) => item.gearItemId,
  );

  return prisma.$transaction(
    async (tx) => {
      const gearItems = await tx.gearItem.findMany({
        where: {
          id: {
            in: gearIds,
          },

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
        },

        include: {
          provider: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },

          category: {
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
        },
      });

      if (gearItems.length !== gearIds.length) {
        const foundGearIds = new Set(
          gearItems.map((gear) => gear.id),
        );

        const missingGearIds = gearIds.filter(
          (id) => !foundGearIds.has(id),
        );

        throw new ApiError(
          404,
          "One or more gear items were not found",
          missingGearIds.map((id) => ({
            field: "items",
            message: `Gear item ${id} does not exist or is unavailable`,
          })),
        );
      }

      const providerIds = new Set(
        gearItems.map((gear) => gear.providerId),
      );

      if (providerIds.size !== 1) {
        throw new ApiError(
          400,
          "All gear items must belong to one provider",
          [
            {
              field: "items",
              message:
                "Multiple providers are not allowed in one rental order",
            },
          ],
        );
      }

      const providerId = gearItems[0]?.providerId;

      if (!providerId) {
        throw new ApiError(
          400,
          "Unable to determine the gear provider",
        );
      }

      const reservedQuantities =
        await tx.rentalOrderItem.groupBy({
          by: ["gearItemId"],

          where: {
            gearItemId: {
              in: gearIds,
            },

            rentalOrder: {
              is: {
                status: {
                  in: ACTIVE_RESERVATION_STATUSES,
                },

                startDate: {
                  lte: endDate,
                },

                endDate: {
                  gte: startDate,
                },
              },
            },
          },

          _sum: {
            quantity: true,
          },
        });

      const reservedQuantityMap = new Map(
        reservedQuantities.map((item) => [
          item.gearItemId,
          item._sum.quantity ?? 0,
        ]),
      );

      const gearMap = new Map(
        gearItems.map((gear) => [gear.id, gear]),
      );

      let subtotal = new Prisma.Decimal(0);

      const orderItems = input.items.map(
        (requestedItem) => {
          const gear = gearMap.get(
            requestedItem.gearItemId,
          );

          if (!gear) {
            throw new ApiError(
              404,
              "Gear item not found",
            );
          }

          const reservedQuantity =
            reservedQuantityMap.get(gear.id) ?? 0;

          const availableQuantity =
            gear.stockQuantity - reservedQuantity;

          if (
            requestedItem.quantity > availableQuantity
          ) {
            throw new ApiError(
              409,
              "Insufficient gear availability",
              [
                {
                  field: "items",
                  message:
                    `${gear.name} has only ` +
                    `${Math.max(availableQuantity, 0)} item(s) ` +
                    "available for the selected dates",
                },
              ],
            );
          }

          const lineTotal = gear.pricePerDay
            .mul(requestedItem.quantity)
            .mul(rentalDays);

          subtotal = subtotal.add(lineTotal);

          return {
            gearItemId: gear.id,
            gearNameSnapshot: gear.name,
            pricePerDay: gear.pricePerDay,
            quantity: requestedItem.quantity,
            rentalDays,
            lineTotal,
          };
        },
      );

      const totalAmount = subtotal;

      return tx.rentalOrder.create({
        data: {
          orderNumber: createOrderNumber(),
          customerId,
          providerId,
          startDate,
          endDate,
          rentalDays,
          subtotal,
          totalAmount,
          notes: input.notes,
          status: RentalStatus.PLACED,

          items: {
            create: orderItems,
          },
        },

        include: rentalOrderDetailsInclude,
      });
    },
    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    },
  );
};

const createRental = async (
  customerId: string,
  input: CreateRentalInput,
) => {
  const maximumAttempts = 3;

  for (
    let attempt = 1;
    attempt <= maximumAttempts;
    attempt += 1
  ) {
    try {
      return await createRentalTransaction(
        customerId,
        input,
      );
    } catch (error) {
      if (
        isTransactionConflict(error) &&
        attempt < maximumAttempts
      ) {
        continue;
      }

      if (isTransactionConflict(error)) {
        throw new ApiError(
          409,
          "The selected gear availability changed",
          [
            {
              message:
                "Another customer reserved this gear. Please try again.",
            },
          ],
        );
      }

      throw error;
    }
  }

  throw new ApiError(
    409,
    "Unable to create rental order",
  );
};

const getCustomerRentals = async (
  customerId: string,
  query: RentalQueryInput,
) => {
  const {
    status,
    page,
    limit,
    sortOrder,
  } = query;

  const where: Prisma.RentalOrderWhereInput = {
    customerId,

    ...(status
      ? {
          status: status as RentalStatus,
        }
      : {}),
  };

  const skip = (page - 1) * limit;

  const [orders, total] = await prisma.$transaction([
    prisma.rentalOrder.findMany({
      where,

      include: {
        provider: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },

        items: {
          select: {
            id: true,
            gearItemId: true,
            gearNameSnapshot: true,
            pricePerDay: true,
            quantity: true,
            rentalDays: true,
            lineTotal: true,
          },
        },

        payments: {
          select: {
            id: true,
            status: true,
            amount: true,
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
    items: orders,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getCustomerRentalById = async (
  customerId: string,
  rentalId: string,
) => {
  const rental = await prisma.rentalOrder.findFirst({
    where: {
      id: rentalId,
      customerId,
    },

    include: rentalOrderDetailsInclude,
  });

  if (!rental) {
    throw new ApiError(404, "Rental order not found", [
      {
        message:
          "The rental order does not exist or does not belong to you",
      },
    ]);
  }

  return rental;
};

const cancelCustomerRental = async (
  customerId: string,
  rentalId: string,
) => {
  const rental = await prisma.rentalOrder.findFirst({
    where: {
      id: rentalId,
      customerId,
    },
  });

  if (!rental) {
    throw new ApiError(404, "Rental order not found");
  }

  const cancellableStatuses: RentalStatus[] = [
    RentalStatus.PLACED,
    RentalStatus.CONFIRMED,
  ];

  if (!cancellableStatuses.includes(rental.status)) {
    throw new ApiError(
      409,
      "Rental order cannot be cancelled",
      [
        {
          message:
            `An order with status ${rental.status} ` +
            "cannot be cancelled",
        },
      ],
    );
  }

  return prisma.rentalOrder.update({
    where: {
      id: rentalId,
    },

    data: {
      status: RentalStatus.CANCELLED,
      cancelledAt: new Date(),
    },

    include: rentalOrderDetailsInclude,
  });
};

const getProviderOrders = async (
  providerId: string,
  query: RentalQueryInput,
) => {
  const {
    status,
    page,
    limit,
    sortOrder,
  } = query;

  const where: Prisma.RentalOrderWhereInput = {
    providerId,

    ...(status
      ? {
          status: status as RentalStatus,
        }
      : {}),
  };

  const skip = (page - 1) * limit;

  const [orders, total] = await prisma.$transaction([
    prisma.rentalOrder.findMany({
      where,

      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },

        items: {
          select: {
            id: true,
            gearItemId: true,
            gearNameSnapshot: true,
            pricePerDay: true,
            quantity: true,
            rentalDays: true,
            lineTotal: true,
          },
        },

        payments: {
          select: {
            id: true,
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
    items: orders,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getProviderOrderById = async (
  providerId: string,
  rentalId: string,
) => {
  const rental = await prisma.rentalOrder.findFirst({
    where: {
      id: rentalId,
      providerId,
    },

    include: rentalOrderDetailsInclude,
  });

  if (!rental) {
    throw new ApiError(404, "Rental order not found", [
      {
        message:
          "The rental order does not exist or does not belong to you",
      },
    ]);
  }

  return rental;
};

const updateProviderOrderStatus = async (
  providerId: string,
  rentalId: string,
  input: UpdateRentalStatusInput,
) => {
  const rental = await prisma.rentalOrder.findFirst({
    where: {
      id: rentalId,
      providerId,
    },
  });

  if (!rental) {
    throw new ApiError(404, "Rental order not found");
  }

  const allowedTransitions: Partial<
    Record<RentalStatus, RentalStatus[]>
  > = {
    [RentalStatus.PLACED]: [
      RentalStatus.CONFIRMED,
    ],

    [RentalStatus.PAID]: [
      RentalStatus.PICKED_UP,
    ],

    [RentalStatus.PICKED_UP]: [
      RentalStatus.RETURNED,
    ],
  };

  const requestedStatus =
    input.status as RentalStatus;

  const validNextStatuses =
    allowedTransitions[rental.status] ?? [];

  if (!validNextStatuses.includes(requestedStatus)) {
    throw new ApiError(
      409,
      "Invalid rental status transition",
      [
        {
          field: "status",
          message:
            `Order status cannot change from ` +
            `${rental.status} to ${requestedStatus}`,
        },
      ],
    );
  }

  return prisma.rentalOrder.update({
    where: {
      id: rentalId,
    },

    data: {
      status: requestedStatus,

      ...(requestedStatus === RentalStatus.RETURNED
        ? {
            returnedAt: new Date(),
          }
        : {}),
    },

    include: rentalOrderDetailsInclude,
  });
};

export const rentalService = {
  createRental,
  getCustomerRentals,
  getCustomerRentalById,
  cancelCustomerRental,
  getProviderOrders,
  getProviderOrderById,
  updateProviderOrderStatus,
};