import { auth } from "../auth.js";

import db from "./db-connection.js";

async function createDefaultUser() {
  try {
    const defaultEmail = process.env.DEFAULT_USER_EMAIL;
    const defaultPassword = process.env.DEFAULT_USER_PASSWORD;
    const defaultName = process.env.DEFAULT_USER_NAME;

    if (!defaultEmail || !defaultPassword) {
      console.log("No default user credentials provided, skipping...");
      return;
    }

    // Check if user exists
    const existingUser = await db("user")
      .where({ email: defaultEmail })
      .first();

    if (existingUser) {
      console.log(`✓ Default user exists: ${defaultEmail}`);
      return;
    }

    // Create user using Better Auth API
    await auth.api.signUpEmail({
      body: {
        email: defaultEmail,
        name: defaultName,
        password: defaultPassword,
      },
    });

    console.log(`✓ Default user created: ${defaultEmail}`);
  } catch (error) {
    console.error("Failed to create default user:", error);
  }
}

export default createDefaultUser;
