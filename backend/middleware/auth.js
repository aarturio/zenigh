import UserOperations from "../db/user-operations.js";
import AuthUtils from "../utils/auth-utils.js";

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    // Verify token
    const decoded = AuthUtils.verifyJWT(token);
    if (!decoded) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    // Get user details and attach to request
    const user = await UserOperations.getUserById(decoded.userId);
    if (!user) {
      return res.status(403).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
};
