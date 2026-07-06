import type { OpenAPIV3 } from "openapi-types";
import { env } from "../config/env.js";

type Schema =
  | OpenAPIV3.SchemaObject
  | OpenAPIV3.ReferenceObject;

const jsonRequest = (
  schema: Schema,
): OpenAPIV3.RequestBodyObject => ({
  required: true,
  content: {
    "application/json": {
      schema,
    },
  },
});

const formRequest = (
  schema: Schema,
): OpenAPIV3.RequestBodyObject => ({
  required: true,
  content: {
    "application/x-www-form-urlencoded": {
      schema,
    },
  },
});

const successResponse = (
  description: string,
  dataSchema?: Schema,
): OpenAPIV3.ResponseObject => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["success", "message"],
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
            example: description,
          },
          ...(dataSchema
            ? {
                data: dataSchema,
              }
            : {}),
        },
      },
    },
  },
});

const standardErrors: OpenAPIV3.ResponsesObject = {
  "400": {
    $ref: "#/components/responses/BadRequest",
  },
  "401": {
    $ref: "#/components/responses/Unauthorized",
  },
  "403": {
    $ref: "#/components/responses/Forbidden",
  },
  "404": {
    $ref: "#/components/responses/NotFound",
  },
  "409": {
    $ref: "#/components/responses/Conflict",
  },
  "500": {
    $ref: "#/components/responses/InternalServerError",
  },
};

const bearerSecurity: OpenAPIV3.SecurityRequirementObject[] = [
  {
    bearerAuth: [],
  },
];

const uuidParameter = (
  name: string,
  description: string,
): OpenAPIV3.ParameterObject => ({
  name,
  in: "path",
  required: true,
  description,
  schema: {
    type: "string",
    format: "uuid",
  },
});

const paginationParameters: OpenAPIV3.ParameterObject[] = [
  {
    name: "page",
    in: "query",
    schema: {
      type: "integer",
      minimum: 1,
      default: 1,
    },
  },
  {
    name: "limit",
    in: "query",
    schema: {
      type: "integer",
      minimum: 1,
      maximum: 100,
      default: 10,
    },
  },
  {
    name: "sortOrder",
    in: "query",
    schema: {
      type: "string",
      enum: ["asc", "desc"],
      default: "desc",
    },
  },
];

const sslCallbackSchema: OpenAPIV3.SchemaObject = {
  type: "object",
  required: ["tran_id"],
  properties: {
    tran_id: {
      type: "string",
    },
    val_id: {
      type: "string",
    },
    status: {
      type: "string",
    },
    amount: {
      type: "string",
    },
    currency: {
      type: "string",
    },
    card_type: {
      type: "string",
    },
    bank_tran_id: {
      type: "string",
    },
  },
  additionalProperties: true,
};

export const swaggerDocument: OpenAPIV3.Document = {
  openapi: "3.0.3",

  info: {
    title: "GearUp Rental API",
    version: "1.0.0",
    description:
      "Backend API for renting sports and outdoor equipment. Supports Customer, Provider and Admin roles with JWT authentication and SSLCommerz payments.",
    contact: {
      name: "Masud Rana",
    },
  },

  servers: [
    {
      url: env.BASE_URL,
      description: "Deployed API",
    },
    {
      url: "http://localhost:5000",
      description: "Local development API",
    },
  ],

  tags: [
    {
      name: "Health",
      description: "API health check",
    },
    {
      name: "Authentication",
      description: "Registration, login and current-user endpoints",
    },
    {
      name: "Categories",
      description: "Public and admin category operations",
    },
    {
      name: "Gear",
      description: "Public gear browsing",
    },
    {
      name: "Provider Gear",
      description: "Provider inventory management",
    },
    {
      name: "Rentals",
      description: "Customer rental operations",
    },
    {
      name: "Provider Orders",
      description: "Provider rental-order management",
    },
    {
      name: "Payments",
      description: "SSLCommerz payments and payment history",
    },
    {
      name: "Reviews",
      description: "Customer and public review operations",
    },
    {
      name: "Admin",
      description: "Administrative platform management",
    },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Enter only the JWT access token. Swagger adds the Bearer prefix automatically.",
      },
    },

    schemas: {
      ErrorDetail: {
        type: "object",
        properties: {
          field: {
            type: "string",
          },
          path: {
            type: "string",
          },
          message: {
            type: "string",
          },
        },
        required: ["message"],
      },

      ErrorResponse: {
        type: "object",
        required: [
          "success",
          "message",
          "errorDetails",
        ],
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          message: {
            type: "string",
            example: "Validation failed",
          },
          errorDetails: {
            type: "array",
            items: {
              $ref: "#/components/schemas/ErrorDetail",
            },
          },
        },
      },

      PaginationMeta: {
        type: "object",
        properties: {
          page: {
            type: "integer",
            example: 1,
          },
          limit: {
            type: "integer",
            example: 10,
          },
          total: {
            type: "integer",
            example: 1,
          },
          totalPages: {
            type: "integer",
            example: 1,
          },
        },
      },

      User: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
          },
          name: {
            type: "string",
            example: "Masud Rana",
          },
          email: {
            type: "string",
            format: "email",
          },
          phone: {
            type: "string",
            nullable: true,
          },
          address: {
            type: "string",
            nullable: true,
          },
          profileImage: {
            type: "string",
            nullable: true,
          },
          role: {
            type: "string",
            enum: [
              "CUSTOMER",
              "PROVIDER",
              "ADMIN",
            ],
          },
          status: {
            type: "string",
            enum: ["ACTIVE", "SUSPENDED"],
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
          },
        },
      },

      RegisterRequest: {
        type: "object",
        required: [
          "name",
          "email",
          "password",
          "role",
        ],
        properties: {
          name: {
            type: "string",
            example: "Masud Rana",
          },
          email: {
            type: "string",
            format: "email",
            example: "customer@example.com",
          },
          password: {
            type: "string",
            format: "password",
            minLength: 8,
            example: "Customer123",
          },
          phone: {
            type: "string",
            example: "01700000000",
          },
          address: {
            type: "string",
            example: "Chattogram, Bangladesh",
          },
          role: {
            type: "string",
            enum: ["CUSTOMER", "PROVIDER"],
          },
        },
      },

      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "customer@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "Customer123",
          },
        },
      },

      AuthResult: {
        type: "object",
        properties: {
          user: {
            $ref: "#/components/schemas/User",
          },
          accessToken: {
            type: "string",
          },
        },
      },

      Category: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
          },
          name: {
            type: "string",
            example: "Camping",
          },
          slug: {
            type: "string",
            example: "camping",
          },
          description: {
            type: "string",
            nullable: true,
          },
          isActive: {
            type: "boolean",
          },
        },
      },

      CategoryRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: {
            type: "string",
            example: "Adventure Sports",
          },
          description: {
            type: "string",
            example:
              "Equipment for outdoor adventure sports",
          },
        },
      },

      GearItem: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
          },
          name: {
            type: "string",
            example: "Coleman Sundome Camping Tent",
          },
          description: {
            type: "string",
          },
          brand: {
            type: "string",
            example: "Coleman",
          },
          pricePerDay: {
            type: "string",
            example: "850.00",
          },
          stockQuantity: {
            type: "integer",
            example: 5,
          },
          specifications: {
            type: "object",
            additionalProperties: true,
          },
          images: {
            type: "array",
            items: {
              type: "string",
              format: "uri",
            },
          },
          isActive: {
            type: "boolean",
          },
          providerId: {
            type: "string",
            format: "uuid",
          },
          categoryId: {
            type: "string",
            format: "uuid",
          },
        },
      },

      CreateGearRequest: {
        type: "object",
        required: [
          "name",
          "description",
          "brand",
          "pricePerDay",
          "stockQuantity",
          "categoryId",
        ],
        properties: {
          name: {
            type: "string",
            example: "Coleman Sundome Camping Tent",
          },
          description: {
            type: "string",
            example:
              "Four-person waterproof camping tent suitable for outdoor trips.",
          },
          brand: {
            type: "string",
            example: "Coleman",
          },
          pricePerDay: {
            type: "number",
            example: 850,
          },
          stockQuantity: {
            type: "integer",
            minimum: 1,
            example: 5,
          },
          categoryId: {
            type: "string",
            format: "uuid",
          },
          images: {
            type: "array",
            items: {
              type: "string",
              format: "uri",
            },
          },
          specifications: {
            type: "object",
            additionalProperties: true,
            example: {
              capacity: "4 persons",
              waterproof: true,
            },
          },
        },
      },

      RentalOrderItem: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
          },
          gearItemId: {
            type: "string",
            format: "uuid",
          },
          gearNameSnapshot: {
            type: "string",
          },
          pricePerDay: {
            type: "string",
          },
          quantity: {
            type: "integer",
          },
          rentalDays: {
            type: "integer",
          },
          lineTotal: {
            type: "string",
          },
        },
      },

      RentalOrder: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
          },
          orderNumber: {
            type: "string",
          },
          status: {
            type: "string",
            enum: [
              "PLACED",
              "CONFIRMED",
              "PAID",
              "PICKED_UP",
              "RETURNED",
              "CANCELLED",
            ],
          },
          startDate: {
            type: "string",
            format: "date-time",
          },
          endDate: {
            type: "string",
            format: "date-time",
          },
          rentalDays: {
            type: "integer",
          },
          subtotal: {
            type: "string",
          },
          totalAmount: {
            type: "string",
          },
          notes: {
            type: "string",
            nullable: true,
          },
          items: {
            type: "array",
            items: {
              $ref: "#/components/schemas/RentalOrderItem",
            },
          },
        },
      },

      CreateRentalRequest: {
        type: "object",
        required: [
          "startDate",
          "endDate",
          "items",
        ],
        properties: {
          startDate: {
            type: "string",
            format: "date",
            example: "2026-07-20",
          },
          endDate: {
            type: "string",
            format: "date",
            example: "2026-07-23",
          },
          notes: {
            type: "string",
          },
          items: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["gearItemId", "quantity"],
              properties: {
                gearItemId: {
                  type: "string",
                  format: "uuid",
                },
                quantity: {
                  type: "integer",
                  minimum: 1,
                },
              },
            },
          },
        },
      },

      Payment: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
          },
          transactionId: {
            type: "string",
          },
          amount: {
            type: "string",
          },
          currency: {
            type: "string",
            example: "BDT",
          },
          provider: {
            type: "string",
            enum: ["SSLCOMMERZ", "STRIPE"],
          },
          status: {
            type: "string",
            enum: [
              "PENDING",
              "COMPLETED",
              "FAILED",
              "CANCELLED",
            ],
          },
          paidAt: {
            type: "string",
            format: "date-time",
            nullable: true,
          },
        },
      },

      PaymentSession: {
        type: "object",
        properties: {
          paymentId: {
            type: "string",
            format: "uuid",
          },
          transactionId: {
            type: "string",
          },
          amount: {
            type: "string",
          },
          currency: {
            type: "string",
          },
          sessionKey: {
            type: "string",
          },
          gatewayUrl: {
            type: "string",
            format: "uri",
          },
        },
      },

      Review: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
          },
          rating: {
            type: "integer",
            minimum: 1,
            maximum: 5,
          },
          comment: {
            type: "string",
            nullable: true,
          },
          customerId: {
            type: "string",
            format: "uuid",
          },
          gearItemId: {
            type: "string",
            format: "uuid",
          },
          rentalOrderId: {
            type: "string",
            format: "uuid",
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
        },
      },

      CreateReviewRequest: {
        type: "object",
        required: [
          "rentalOrderId",
          "gearItemId",
          "rating",
        ],
        properties: {
          rentalOrderId: {
            type: "string",
            format: "uuid",
          },
          gearItemId: {
            type: "string",
            format: "uuid",
          },
          rating: {
            type: "integer",
            minimum: 1,
            maximum: 5,
            example: 5,
          },
          comment: {
            type: "string",
            example:
              "The equipment was clean and in excellent condition.",
          },
        },
      },
    },

    responses: {
      BadRequest: {
        description: "Invalid request or validation error",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },

      Unauthorized: {
        description: "Authentication is required",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },

      Forbidden: {
        description:
          "The authenticated user does not have permission",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },

      NotFound: {
        description: "Requested resource was not found",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },

      Conflict: {
        description:
          "Request conflicts with the current resource state",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },

      InternalServerError: {
        description: "Unexpected server error",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
    },
  },

  paths: {
    "/api/v1/health": {
      get: {
        tags: ["Health"],
        summary: "Check API health",
        responses: {
          "200": successResponse(
            "GearUp API is running",
            {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  example: "healthy",
                },
                timestamp: {
                  type: "string",
                  format: "date-time",
                },
              },
            },
          ),
        },
      },
    },

    "/api/v1/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a customer or provider",
        requestBody: jsonRequest({
          $ref: "#/components/schemas/RegisterRequest",
        }),
        responses: {
          "201": successResponse(
            "User registered successfully",
            {
              $ref: "#/components/schemas/AuthResult",
            },
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Log in and receive a JWT",
        requestBody: jsonRequest({
          $ref: "#/components/schemas/LoginRequest",
        }),
        responses: {
          "200": successResponse(
            "Login successful",
            {
              $ref: "#/components/schemas/AuthResult",
            },
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get the authenticated user",
        security: bearerSecurity,
        responses: {
          "200": successResponse(
            "Current user retrieved successfully",
            {
              $ref: "#/components/schemas/User",
            },
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/categories": {
      get: {
        tags: ["Categories"],
        summary: "Get active categories",
        responses: {
          "200": successResponse(
            "Categories retrieved successfully",
            {
              type: "array",
              items: {
                $ref: "#/components/schemas/Category",
              },
            },
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/gear": {
      get: {
        tags: ["Gear"],
        summary:
          "Browse and filter active gear listings",
        parameters: [
          {
            name: "search",
            in: "query",
            schema: {
              type: "string",
            },
          },
          {
            name: "category",
            in: "query",
            description:
              "Category UUID, name or slug",
            schema: {
              type: "string",
            },
          },
          {
            name: "brand",
            in: "query",
            schema: {
              type: "string",
            },
          },
          {
            name: "minPrice",
            in: "query",
            schema: {
              type: "number",
              minimum: 0,
            },
          },
          {
            name: "maxPrice",
            in: "query",
            schema: {
              type: "number",
              minimum: 0,
            },
          },
          {
            name: "available",
            in: "query",
            schema: {
              type: "boolean",
            },
          },
          {
            name: "sortBy",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "createdAt",
                "name",
                "pricePerDay",
              ],
            },
          },
          ...paginationParameters,
        ],
        responses: {
          "200": successResponse(
            "Gear items retrieved successfully",
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/gear/{id}": {
      get: {
        tags: ["Gear"],
        summary: "Get gear details",
        parameters: [
          uuidParameter("id", "Gear item ID"),
        ],
        responses: {
          "200": successResponse(
            "Gear details retrieved successfully",
            {
              $ref: "#/components/schemas/GearItem",
            },
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/provider/gear": {
      get: {
        tags: ["Provider Gear"],
        summary: "Get the provider's inventory",
        security: bearerSecurity,
        responses: {
          "200": successResponse(
            "Provider gear retrieved successfully",
          ),
          ...standardErrors,
        },
      },

      post: {
        tags: ["Provider Gear"],
        summary: "Add gear to provider inventory",
        security: bearerSecurity,
        requestBody: jsonRequest({
          $ref: "#/components/schemas/CreateGearRequest",
        }),
        responses: {
          "201": successResponse(
            "Gear item created successfully",
            {
              $ref: "#/components/schemas/GearItem",
            },
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/provider/gear/{id}": {
      patch: {
        tags: ["Provider Gear"],
        summary: "Update owned gear",
        security: bearerSecurity,
        parameters: [
          uuidParameter("id", "Gear item ID"),
        ],
        requestBody: jsonRequest({
          allOf: [
            {
              $ref: "#/components/schemas/CreateGearRequest",
            },
          ],
        }),
        responses: {
          "200": successResponse(
            "Gear item updated successfully",
          ),
          ...standardErrors,
        },
      },

      delete: {
        tags: ["Provider Gear"],
        summary: "Deactivate owned gear",
        security: bearerSecurity,
        parameters: [
          uuidParameter("id", "Gear item ID"),
        ],
        responses: {
          "200": successResponse(
            "Gear item deactivated successfully",
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/rentals": {
      post: {
        tags: ["Rentals"],
        summary: "Create a rental order",
        security: bearerSecurity,
        requestBody: jsonRequest({
          $ref: "#/components/schemas/CreateRentalRequest",
        }),
        responses: {
          "201": successResponse(
            "Rental order created successfully",
            {
              $ref: "#/components/schemas/RentalOrder",
            },
          ),
          ...standardErrors,
        },
      },

      get: {
        tags: ["Rentals"],
        summary: "Get customer rental history",
        security: bearerSecurity,
        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "PLACED",
                "CONFIRMED",
                "PAID",
                "PICKED_UP",
                "RETURNED",
                "CANCELLED",
              ],
            },
          },
          ...paginationParameters,
        ],
        responses: {
          "200": successResponse(
            "Customer rental orders retrieved successfully",
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/rentals/{id}": {
      get: {
        tags: ["Rentals"],
        summary: "Get a customer rental by ID",
        security: bearerSecurity,
        parameters: [
          uuidParameter("id", "Rental order ID"),
        ],
        responses: {
          "200": successResponse(
            "Rental order retrieved successfully",
            {
              $ref: "#/components/schemas/RentalOrder",
            },
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/rentals/{id}/cancel": {
      patch: {
        tags: ["Rentals"],
        summary: "Cancel a placed or confirmed rental",
        security: bearerSecurity,
        parameters: [
          uuidParameter("id", "Rental order ID"),
        ],
        responses: {
          "200": successResponse(
            "Rental order cancelled successfully",
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/provider/orders": {
      get: {
        tags: ["Provider Orders"],
        summary: "Get provider incoming orders",
        security: bearerSecurity,
        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "PLACED",
                "CONFIRMED",
                "PAID",
                "PICKED_UP",
                "RETURNED",
                "CANCELLED",
              ],
            },
          },
          ...paginationParameters,
        ],
        responses: {
          "200": successResponse(
            "Provider rental orders retrieved successfully",
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/provider/orders/{id}": {
      get: {
        tags: ["Provider Orders"],
        summary: "Get a provider order by ID",
        security: bearerSecurity,
        parameters: [
          uuidParameter("id", "Rental order ID"),
        ],
        responses: {
          "200": successResponse(
            "Provider rental order retrieved successfully",
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/provider/orders/{id}/status": {
      patch: {
        tags: ["Provider Orders"],
        summary: "Update rental-order status",
        description:
          "Allowed transitions: PLACED → CONFIRMED, PAID → PICKED_UP, PICKED_UP → RETURNED.",
        security: bearerSecurity,
        parameters: [
          uuidParameter("id", "Rental order ID"),
        ],
        requestBody: jsonRequest({
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: [
                "CONFIRMED",
                "PICKED_UP",
                "RETURNED",
              ],
            },
          },
        }),
        responses: {
          "200": successResponse(
            "Rental order status updated successfully",
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/payments/{rentalId}/initiate": {
      post: {
        tags: ["Payments"],
        summary:
          "Create an SSLCommerz payment session",
        security: bearerSecurity,
        parameters: [
          uuidParameter(
            "rentalId",
            "Confirmed rental-order ID",
          ),
        ],
        responses: {
          "201": successResponse(
            "SSLCommerz payment session created successfully",
            {
              $ref: "#/components/schemas/PaymentSession",
            },
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/payments": {
      get: {
        tags: ["Payments"],
        summary: "Get customer payment history",
        security: bearerSecurity,
        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "PENDING",
                "COMPLETED",
                "FAILED",
                "CANCELLED",
              ],
            },
          },
          ...paginationParameters,
        ],
        responses: {
          "200": successResponse(
            "Payment history retrieved successfully",
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/payments/{id}": {
      get: {
        tags: ["Payments"],
        summary: "Get customer payment details",
        security: bearerSecurity,
        parameters: [
          uuidParameter("id", "Payment ID"),
        ],
        responses: {
          "200": successResponse(
            "Payment details retrieved successfully",
            {
              $ref: "#/components/schemas/Payment",
            },
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/payments/success": {
      post: {
        tags: ["Payments"],
        summary: "SSLCommerz success callback",
        description:
          "Used by SSLCommerz. The backend validates the transaction before marking it completed.",
        requestBody: formRequest(
          sslCallbackSchema,
        ),
        responses: {
          "200": successResponse(
            "Payment verified successfully",
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/payments/ipn": {
      post: {
        tags: ["Payments"],
        summary: "SSLCommerz IPN endpoint",
        requestBody: formRequest(
          sslCallbackSchema,
        ),
        responses: {
          "200": successResponse(
            "SSLCommerz IPN processed successfully",
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/payments/fail": {
      post: {
        tags: ["Payments"],
        summary: "SSLCommerz failure callback",
        requestBody: formRequest(
          sslCallbackSchema,
        ),
        responses: {
          "200": successResponse(
            "Payment marked as failed",
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/payments/cancel": {
      post: {
        tags: ["Payments"],
        summary: "SSLCommerz cancellation callback",
        requestBody: formRequest(
          sslCallbackSchema,
        ),
        responses: {
          "200": successResponse(
            "Payment marked as cancelled",
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/reviews": {
      post: {
        tags: ["Reviews"],
        summary:
          "Review gear from a returned rental",
        security: bearerSecurity,
        requestBody: jsonRequest({
          $ref: "#/components/schemas/CreateReviewRequest",
        }),
        responses: {
          "201": successResponse(
            "Review created successfully",
            {
              $ref: "#/components/schemas/Review",
            },
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/reviews/gear/{gearId}": {
      get: {
        tags: ["Reviews"],
        summary: "Get public reviews for a gear item",
        parameters: [
          uuidParameter("gearId", "Gear item ID"),
          ...paginationParameters,
        ],
        responses: {
          "200": successResponse(
            "Gear reviews retrieved successfully",
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/reviews/{id}": {
      patch: {
        tags: ["Reviews"],
        summary: "Update an owned review",
        security: bearerSecurity,
        parameters: [
          uuidParameter("id", "Review ID"),
        ],
        requestBody: jsonRequest({
          type: "object",
          properties: {
            rating: {
              type: "integer",
              minimum: 1,
              maximum: 5,
            },
            comment: {
              type: "string",
            },
          },
        }),
        responses: {
          "200": successResponse(
            "Review updated successfully",
          ),
          ...standardErrors,
        },
      },

      delete: {
        tags: ["Reviews"],
        summary:
          "Delete an owned review or moderate as admin",
        security: bearerSecurity,
        parameters: [
          uuidParameter("id", "Review ID"),
        ],
        responses: {
          "200": successResponse(
            "Review deleted successfully",
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/admin/categories": {
      get: {
        tags: ["Categories"],
        summary: "Get all categories as admin",
        security: bearerSecurity,
        responses: {
          "200": successResponse(
            "All categories retrieved successfully",
          ),
          ...standardErrors,
        },
      },

      post: {
        tags: ["Categories"],
        summary: "Create a category",
        security: bearerSecurity,
        requestBody: jsonRequest({
          $ref: "#/components/schemas/CategoryRequest",
        }),
        responses: {
          "201": successResponse(
            "Category created successfully",
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/admin/categories/{id}": {
      patch: {
        tags: ["Categories"],
        summary: "Update a category",
        security: bearerSecurity,
        parameters: [
          uuidParameter("id", "Category ID"),
        ],
        requestBody: jsonRequest({
          type: "object",
          properties: {
            name: {
              type: "string",
            },
            description: {
              type: "string",
            },
            isActive: {
              type: "boolean",
            },
          },
        }),
        responses: {
          "200": successResponse(
            "Category updated successfully",
          ),
          ...standardErrors,
        },
      },

      delete: {
        tags: ["Categories"],
        summary: "Deactivate a category",
        security: bearerSecurity,
        parameters: [
          uuidParameter("id", "Category ID"),
        ],
        responses: {
          "200": successResponse(
            "Category deactivated successfully",
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "Get all platform users",
        security: bearerSecurity,
        parameters: [
          {
            name: "search",
            in: "query",
            schema: {
              type: "string",
            },
          },
          {
            name: "role",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "CUSTOMER",
                "PROVIDER",
                "ADMIN",
              ],
            },
          },
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: ["ACTIVE", "SUSPENDED"],
            },
          },
          ...paginationParameters,
        ],
        responses: {
          "200": successResponse(
            "Users retrieved successfully",
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/admin/users/{id}/status": {
      patch: {
        tags: ["Admin"],
        summary: "Suspend or activate a user",
        security: bearerSecurity,
        parameters: [
          uuidParameter("id", "User ID"),
        ],
        requestBody: jsonRequest({
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: ["ACTIVE", "SUSPENDED"],
            },
          },
        }),
        responses: {
          "200": successResponse(
            "User status updated successfully",
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/admin/gear": {
      get: {
        tags: ["Admin"],
        summary: "Get all gear listings",
        security: bearerSecurity,
        parameters: [
          {
            name: "search",
            in: "query",
            schema: {
              type: "string",
            },
          },
          {
            name: "isActive",
            in: "query",
            schema: {
              type: "boolean",
            },
          },
          ...paginationParameters,
        ],
        responses: {
          "200": successResponse(
            "Gear listings retrieved successfully",
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/admin/gear/{id}/status": {
      patch: {
        tags: ["Admin"],
        summary: "Enable or disable a gear listing",
        security: bearerSecurity,
        parameters: [
          uuidParameter("id", "Gear item ID"),
        ],
        requestBody: jsonRequest({
          type: "object",
          required: ["isActive"],
          properties: {
            isActive: {
              type: "boolean",
            },
          },
        }),
        responses: {
          "200": successResponse(
            "Gear status updated successfully",
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/admin/rentals": {
      get: {
        tags: ["Admin"],
        summary: "Get all rental orders",
        security: bearerSecurity,
        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "PLACED",
                "CONFIRMED",
                "PAID",
                "PICKED_UP",
                "RETURNED",
                "CANCELLED",
              ],
            },
          },
          ...paginationParameters,
        ],
        responses: {
          "200": successResponse(
            "Rental orders retrieved successfully",
          ),
          ...standardErrors,
        },
      },
    },

    "/api/v1/admin/payments": {
      get: {
        tags: ["Admin"],
        summary: "Get all payment transactions",
        security: bearerSecurity,
        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "PENDING",
                "COMPLETED",
                "FAILED",
                "CANCELLED",
              ],
            },
          },
          ...paginationParameters,
        ],
        responses: {
          "200": successResponse(
            "Payments retrieved successfully",
          ),
          ...standardErrors,
        },
      },
    },
  },
};