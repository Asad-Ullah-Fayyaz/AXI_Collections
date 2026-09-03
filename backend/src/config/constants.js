/**
 * Shared business configuration — single source of truth.
 * The backend is authoritative; the frontend fetches these values for display only.
 */

module.exports = {
  SHIPPING: {
    FREE_SHIPPING_THRESHOLD: 20000, // PKR — free shipping over this subtotal
    STANDARD_SHIPPING_COST: 350, // PKR — flat rate below the threshold
  },

  ORDER: {
    VALID_STATUSES: [
      "Pending",
      "Confirmed",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ],
    // Allowed forward transitions (Cancellation handled separately)
    VALID_TRANSITIONS: {
      Pending: ["Confirmed", "Cancelled"],
      Confirmed: ["Processing", "Cancelled"],
      Processing: ["Shipped", "Cancelled"],
      Shipped: ["Delivered"], // Delivered orders cannot be cancelled
      Delivered: [], // Terminal state
      Cancelled: [], // Terminal state
    },
    MAX_QTY_PER_ITEM: 20,
  },

  PAGINATION: {
    DEFAULT_LIMIT: 12,
    MAX_LIMIT: 50,
    MAX_PAGE: 10000,
  },

  SEARCH: {
    MAX_LENGTH: 100,
  },
};
