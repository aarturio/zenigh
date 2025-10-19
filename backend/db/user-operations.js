import db from "./connection.js";
import AuthUtils from "../utils/auth-utils.js";

class UserOperations {
  // Register a new user
  static async registerUser({ email, password, firstName, lastName }) {
    // Check if user exists
    const existing = await db("users").where({ email }).first();
    if (existing) {
      throw new Error("User already exists");
    }

    // Hash password
    const passwordHash = await AuthUtils.hashPassword(password);

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
    const token = AuthUtils.generateJWT(user.id, user.email);

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
    const isValid = await AuthUtils.comparePassword(
      password,
      user.password_hash
    );
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    // Generate token
    const token = AuthUtils.generateJWT(user.id, user.email);

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
