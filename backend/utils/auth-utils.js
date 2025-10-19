import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

class AuthUtils {
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
}

export default AuthUtils;
