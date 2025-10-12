#!/usr/bin/env node

/**
 * Database Seeding Script
 * Creates default user account for development
 */

import bcrypt from "bcrypt";
import db from "./connection.js";

async function seedDefaultUser() {
  try {
    // Get default user credentials from environment
    const email = process.env.DEFAULT_USER_EMAIL;
    const password = process.env.DEFAULT_USER_PASSWORD;
    const firstName = process.env.DEFAULT_USER_FIRSTNAME;
    const lastName = process.env.DEFAULT_USER_LASTNAME;

    console.log(`🌱 Seeding default user: ${email}`);

    // Check if user already exists
    const existingUser = await db("users").where({ email }).first();

    if (existingUser) {
      console.log(`✅ User ${email} already exists, skipping...`);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user
    await db("users").insert({
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
    });

    console.log(`✅ Default user created successfully`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    throw error;
  }
}

export default seedDefaultUser;
