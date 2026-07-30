require("dotenv").config();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const signInToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      address: user.address,
      phone: user.phone,
      image: user.image,
      type: "customer",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
};

const signInAdminToken = (admin) => {
  return jwt.sign(
    {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      address: admin.address,
      phone: admin.phone,
      image: admin.image,
      role: admin.role,
      type: "admin",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
};

const tokenForVerify = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      password: user.password,
    },
    process.env.JWT_SECRET_FOR_VERIFY,
    { expiresIn: "15m" }
  );
};

const isAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  const isPublicOrderRoute =
    req.path.includes("/phonepe/callback") ||
    req.path.includes("/phonepe/webhook") ||
    req.path.includes("/phonepe/mock-checkout") ||
    req.path.includes("/create-phonepe-payment") ||
    req.path.includes("/add") ||
    req.path.includes("/create/razorpay") ||
    req.path.includes("/verify");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    if (isPublicOrderRoute) {
      req.user = null;
      return next();
    }
    return res.status(401).send({
      message: "Authorization token is required.",
    });
  }

  try {
    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (isPublicOrderRoute) {
      req.user = null;
      return next();
    }
    res.status(401).send({
      message: err.message,
    });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      return res.status(401).send({
        message: "Authentication required.",
      });
    }

    if (req.user.type !== "admin") {
      return res.status(403).send({
        message: "Admin access required.",
      });
    }

    const admin = await Admin.findById(req.user._id);
    if (!admin || admin.status === "Inactive") {
      return res.status(403).send({
        message: "Admin account is not authorized.",
      });
    }

    req.admin = admin;
    next();
  } catch (err) {
    res.status(401).send({
      message: err.message,
    });
  }
};

const secretKey = process.env.ENCRYPT_PASSWORD;

// Ensure the secret key is exactly 32 bytes (256 bits)
const key = crypto.createHash("sha256").update(secretKey).digest();

// Generate an initialization vector (IV)
const iv = crypto.randomBytes(16); // AES-CBC requires a 16-byte IV

// Helper function to encrypt data
const handleEncryptData = (data) => {
  // Ensure the input is a string or convert it to a string
  const dataToEncrypt = typeof data === "string" ? data : JSON.stringify(data);

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encryptedData = cipher.update(dataToEncrypt, "utf8", "hex");
  encryptedData += cipher.final("hex");

  return {
    data: encryptedData,
    iv: iv.toString("hex"),
  };
};

const adminOnly = [isAuth, isAdmin];

const ensureSelfOrAdmin = (req, res, next) => {
  if (!req.user || req.user?.type === "admin") {
    return next();
  }

  const targetId = req.params.id || req.params.userId;
  if (!targetId || String(req.user?._id) === String(targetId)) {
    return next();
  }

  return res.status(403).send({
    message: "You are not authorized to access this resource.",
  });
};

const ensureSelfEmail = (req, res, next) => {
  if (req.user?.type === "admin") {
    return next();
  }

  if (
    req.body?.email &&
    String(req.body.email).toLowerCase() ===
      String(req.user?.email || "").toLowerCase()
  ) {
    return next();
  }

  return res.status(403).send({
    message: "You are not authorized to change this account password.",
  });
};

module.exports = {
  isAuth,
  isAdmin,
  adminOnly,
  ensureSelfOrAdmin,
  ensureSelfEmail,
  signInToken,
  signInAdminToken,
  tokenForVerify,
  handleEncryptData,
};
