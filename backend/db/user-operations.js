import pool from "./connection.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";

// User validation schemas
const UserRegistrationSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

const UserLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

class UserOperations {
  static async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  static generateJWT(userId, email) {
    const secret = process.env.JWT_SECRET;
    return jwt.sign({ userId, email }, secret, { expiresIn: "1h" });
  }

  static verifyJWT(token) {
    const secret = process.env.JWT_SECRET;
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      console.error("JWT verification error:", error);
      return null;
    }
  }

  // Register a new user
  static async registerUser({ email, password, firstName, lastName }) {
    // Validate input
    UserRegistrationSchema.parse({ email, password, firstName, lastName });

    const client = await pool.connect();
    try {
      // Check if user already exists
      const existingUser = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error("User with this email already exists");
      }

      // Hash password
      const passwordHash = await this.hashPassword(password);

      // Insert new user
      const result = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, first_name, last_name, created_at`,
        [email, passwordHash, firstName || null, lastName || null]
      );

      const user = result.rows[0];

      // Generate JWT token
      const token = this.generateJWT(user.id, user.email);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          createdAt: user.created_at,
        },
        token,
      };
    } finally {
      client.release();
    }
  }

  // Login user
  static async loginUser({ email, password }) {
    // Validate input
    UserLoginSchema.parse({ email, password });

    const client = await pool.connect();
    try {
      // Find user by email
      const result = await client.query(
        `SELECT id, email, password_hash, first_name, last_name, created_at
         FROM users WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        throw new Error("Invalid email or password");
      }

      const user = result.rows[0];

      // Verify password
      const isValidPassword = await this.comparePassword(
        password,
        user.password_hash
      );
      if (!isValidPassword) {
        throw new Error("Invalid email or password");
      }

      // Generate JWT token
      const token = this.generateJWT(user.id, user.email);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          createdAt: user.created_at,
        },
        token,
      };
    } finally {
      client.release();
    }
  }

  // Get user by ID
  static async getUserById(userId) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, email, first_name, last_name, created_at
         FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        createdAt: user.created_at,
      };
    } finally {
      client.release();
    }
  }
}

export default UserOperations;
