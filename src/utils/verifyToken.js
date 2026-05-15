import { decodeToken, isExpired } from "react-jwt";
import { ROLES } from "../../config.js";

const ALLOWED_ROLES = Object.values(ROLES);

const verifyToken = (token) => {
  const data = { status: false, token: null };

  if (!token) {
    return data;
  }

  try {
    if (isExpired(token)) {
      return data;
    }

    const decodedToken = decodeToken(token);
    if (!decodedToken) {
      return data;
    }

    const role = decodedToken.role?.toLowerCase?.() ?? decodedToken.role;
    if (!ALLOWED_ROLES.includes(role)) {
      return data;
    }

    return { status: true, token: decodedToken };
  } catch {
    return data;
  }
};

export default verifyToken;
