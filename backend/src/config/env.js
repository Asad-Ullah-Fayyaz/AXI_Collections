/**
 * Central environment validation & configuration.
 * The application FAILS FAST at startup if required secrets are missing.
 * Never fall back to hardcoded secrets.
 */

const requiredInProduction = ["JWT_SECRET", "MONGODB_URI"];

function validateEnv() {
  const errors = [];

  if (!process.env.JWT_SECRET) {
    errors.push(
      "JWT_SECRET is missing. Generate one with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"",
    );
  } else if (process.env.JWT_SECRET.length < 32) {
    errors.push(
      "JWT_SECRET must be at least 32 characters long. Use a strong random value.",
    );
  }

  // Guard against known compromised/default secrets
  const forbidden = [
    "axi_collection_super_secret_jwt_key_2026_production",
    "secret",
    "changeme",
  ];
  if (forbidden.some((s) => process.env.JWT_SECRET === s)) {
    errors.push(
      "JWT_SECRET matches a known default/compromised value. Generate a fresh random secret.",
    );
  }

  if (process.env.NODE_ENV === "production") {
    for (const key of requiredInProduction) {
      if (!process.env[key]) errors.push(`${key} is required in production.`);
    }
    if (!process.env.FRONTEND_URL) {
      errors.push(
        "FRONTEND_URL is required in production for CORS and emails.",
      );
    }
  }

  if (errors.length > 0) {
    console.error("====================================================");
    console.error(" [CONFIG ERROR] Invalid or missing environment setup:");
    errors.forEach((e) => console.error(`   - ${e}`));
    console.error("====================================================");
    process.exit(1);
  }
}

const config = {
  get nodeEnv() {
    return process.env.NODE_ENV || "development";
  },
  get isProduction() {
    return (process.env.NODE_ENV || "development") === "production";
  },
  get isDevelopment() {
    return (process.env.NODE_ENV || "development") !== "production";
  },
  get jwtSecret() {
    return process.env.JWT_SECRET;
  },
  get jwtExpire() {
    return process.env.JWT_EXPIRE || "7d";
  },
  get frontendUrl() {
    return process.env.FRONTEND_URL || "http://localhost:5173";
  },
  get mongoUri() {
    return (
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/axi_collection"
    );
  },
  get allowedOrigins() {
    const origins = ["http://localhost:5173", "http://127.0.0.1:5173"];
    if (process.env.FRONTEND_URL) origins.push(process.env.FRONTEND_URL);
    if (process.env.EXTRA_ALLOWED_ORIGINS) {
      origins.push(
        ...process.env.EXTRA_ALLOWED_ORIGINS.split(",")
          .map((o) => o.trim())
          .filter(Boolean),
      );
    }
    return origins;
  },
};

module.exports = { validateEnv, config };
