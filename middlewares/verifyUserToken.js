import jwt from "jsonwebtoken";

const verifyUserToken = async (req, res, next) => {
  const { accessToken } = req.cookies;
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      // the decoded payload is attached to the req.user property. This allows the information stored in the JWT payload (e.g., user ID, email, role, etc.) to be accessed by other route handlers
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: "Unauthorized" });
    }
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
};

export default verifyUserToken;
