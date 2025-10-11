import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "./connection.js";

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
    return jwt.sign({ userId, email }, secret, { expiresIn: "12h" });
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
    // Check if user exists
    const existing = await db("users").where({ email }).first();
    if (existing) {
      throw new Error("User already exists");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user
    const [user] = await db("users")
      .insert({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
      })
      .returning(["id", "email", "first_name", "last_name", "created_at"]);

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

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
  }

  // Login user
  static async loginUser({ email, password }) {
    // Find user
    const user = await db("users").where({ email }).first();
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      token,
    };
  }

  // Get user by ID
  static async getUserById(userId) {
    const user = await db("users").where({ id: userId }).first();
    if (!user) {
      throw new Error("User doesn't exist");
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      createdAt: user.created_at,
    };
  }
}

export default UserOperations;
