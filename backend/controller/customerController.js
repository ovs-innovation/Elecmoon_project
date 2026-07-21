require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");
const LoginOtp = require("../models/LoginOtp");
const SignupOtp = require("../models/SignupOtp");
const { signInToken, tokenForVerify } = require("../config/auth");
const { sendEmail, sendMailPromise } = require("../lib/email-sender/sender");
const {
  customerRegisterBody,
} = require("../lib/email-sender/templates/register");
const {
  forgetPasswordEmailBody,
} = require("../lib/email-sender/templates/forget-password");
const { loginOtpEmailBody } = require("../lib/email-sender/templates/login-otp");
const { sendVerificationCode } = require("../lib/phone-verification/sender");
const {
  queueCustomerSignupNotificationEmail,
} = require("../lib/email-sender/adminNotificationEmail");

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

const buildCustomerLoginResponse = (customer, token) => ({
  token,
  _id: customer._id,
  name: customer.name,
  email: customer.email,
  address: customer.address,
  phone: customer.phone,
  image: customer.image,
  cart: customer.cart || [],
  wishlist: customer.wishlist || [],
});

const verifyStoredOtp = async ({ OtpModel, email, otp }) => {
  const otpRecord = await OtpModel.findOne({ email });
  if (!otpRecord) {
    return {
      ok: false,
      status: 401,
      message: "OTP expired or not requested. Please request a new OTP.",
    };
  }

  if (otpRecord.expiresAt < new Date()) {
    await OtpModel.deleteOne({ email });
    return {
      ok: false,
      status: 401,
      message: "OTP has expired. Please request a new one.",
    };
  }

  if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
    await OtpModel.deleteOne({ email });
    return {
      ok: false,
      status: 429,
      message: "Too many invalid attempts. Please request a new OTP.",
    };
  }

  const isValidOtp = bcrypt.compareSync(otp, otpRecord.otpHash);
  if (!isValidOtp) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    return {
      ok: false,
      status: 401,
      message: "Invalid OTP. Please try again.",
    };
  }

  await OtpModel.deleteOne({ email });
  return { ok: true, record: otpRecord };
};

const verifyEmailAddress = async (req, res) => {
  try {
    const isAdded = await Customer.findOne({ email: req.body.email });
    if (isAdded) {
      return res.status(403).send({
        message: "This Email already Added!",
      });
    } else {
      const newUser = new Customer({
        name: req.body.name,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10),
      });
      await newUser.save();
      queueCustomerSignupNotificationEmail(newUser, "Direct signup");
      res.send({
        message: "User created successfully!",
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const verifyPhoneNumber = async (req, res) => {
  const phoneNumber = req.body.phone;

  // console.log("verifyPhoneNumber", phoneNumber);

  // Check if phone number is provided and is in the correct format
  if (!phoneNumber) {
    return res.status(400).send({
      message: "Phone number is required.",
    });
  }

  // Optional: Add phone number format validation here (if required)
  // const phoneRegex = /^[0-9]{10}$/; // Basic validation for 10-digit phone numbers
  // if (!phoneRegex.test(phoneNumber)) {
  //   return res.status(400).send({
  //     message: "Invalid phone number format. Please provide a valid number.",
  //   });
  // }

  try {
    // Check if the phone number is already associated with an existing customer
    const isAdded = await Customer.findOne({ phone: phoneNumber });

    if (isAdded) {
      return res.status(403).send({
        message: "This phone number is already added.",
      });
    }

    // Generate a random 6-digit verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Send verification code via SMS
    const sent = await sendVerificationCode(phoneNumber, verificationCode);

    if (!sent) {
      return res.status(500).send({
        message: "Failed to send verification code.",
      });
    }

    const message = "Please check your phone for the verification code!";
    return res.send({ message });
  } catch (err) {
    console.error("Error during phone verification:", err);
    res.status(500).send({
      message: err.message,
    });
  }
};

const registerCustomer = async (req, res) => {
  const token = req.params.token;

  try {
    const { name, email, password } = jwt.decode(token);

    // Check if the user is already registered
    const isAdded = await Customer.findOne({ email });

    if (isAdded) {
      const token = signInToken(isAdded);
      return res.send({
        token,
        _id: isAdded._id,
        name: isAdded.name,
        email: isAdded.email,
        password: password,
        message: "Email Already Verified!",
      });
    }

    if (token) {
      jwt.verify(
        token,
        process.env.JWT_SECRET_FOR_VERIFY,
        async (err, decoded) => {
          if (err) {
            return res.status(401).send({
              message: "Token Expired, Please try again!",
            });
          }

          // Create a new user only if not already registered
          const existingUser = await Customer.findOne({ email });
          console.log("existingUser");

          if (existingUser) {
            return res.status(400).send({ message: "User already exists!" });
          } else {
            const newUser = new Customer({
              name,
              email,
              password: bcrypt.hashSync(password, 10),
            });

            await newUser.save();
            queueCustomerSignupNotificationEmail(newUser, "Email verification");
            const token = signInToken(newUser);
            res.send({
              token,
              _id: newUser._id,
              name: newUser.name,
              email: newUser.email,
              message: "Email Verified, Please Login Now!",
            });
          }
        }
      );
    }
  } catch (error) {
    console.error("Error during email verification:", error);
    res.status(500).send({
      message: "Internal server error. Please try again later.",
    });
  }
};

const addAllCustomers = async (req, res) => {
  try {
    await Customer.deleteMany();
    await Customer.insertMany(req.body);
    res.send({
      message: "Added all users successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const loginCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ email: req.body.email });

    // console.log("loginCustomer", req.body.password, "customer", customer);

    if (
      customer &&
      customer.password &&
      bcrypt.compareSync(req.body.password, customer.password)
    ) {
      const token = signInToken(customer);
      res.send(buildCustomerLoginResponse(customer, token));
    } else {
      res.status(401).send({
        message: "Invalid user or password!",
        error: "Invalid user or password!",
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
      error: "Invalid user or password!",
    });
  }
};

const sendLoginOtp = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).send({
        message: "Email is required.",
      });
    }

    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(404).send({
        message: "No account found with this email. Please sign up first.",
      });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = bcrypt.hashSync(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await LoginOtp.findOneAndUpdate(
      { email },
      { otpHash, expiresAt, attempts: 0 },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendMailPromise({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `${otp} is your Elecmoon login code`,
      html: loginOtpEmailBody({ name: customer.name, otp }),
    });

    res.send({
      message: "OTP sent to your email inbox. It is valid for 10 minutes.",
    });
  } catch (err) {
    console.error("sendLoginOtp error:", err);
    res.status(500).send({
      message: "Could not send OTP. Please try again later.",
    });
  }
};

const verifyLoginOtp = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) {
      return res.status(400).send({
        message: "Email and OTP are required.",
      });
    }

    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(404).send({
        message: "No account found with this email.",
      });
    }

    const otpCheck = await verifyStoredOtp({
      OtpModel: LoginOtp,
      email,
      otp,
    });
    if (!otpCheck.ok) {
      return res.status(otpCheck.status).send({ message: otpCheck.message });
    }

    const token = signInToken(customer);
    res.send(buildCustomerLoginResponse(customer, token));
  } catch (err) {
    console.error("verifyLoginOtp error:", err);
    res.status(500).send({
      message: err.message,
    });
  }
};

const sendSignupOtp = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!name || !email) {
      return res.status(400).send({
        message: "Name and email are required.",
      });
    }

    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(403).send({
        message: "This email is already registered. Please login instead.",
      });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = bcrypt.hashSync(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await SignupOtp.findOneAndUpdate(
      { email },
      { name, otpHash, expiresAt, attempts: 0 },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendMailPromise({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `${otp} is your Elecmoon signup code`,
      html: loginOtpEmailBody({ name, otp, purpose: "signup" }),
    });

    res.send({
      message: "OTP sent to your email inbox. It is valid for 10 minutes.",
    });
  } catch (err) {
    console.error("sendSignupOtp error:", err);
    res.status(500).send({
      message: "Could not send OTP. Please try again later.",
    });
  }
};

const verifySignupOtp = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();

    if (!name || !email || !otp) {
      return res.status(400).send({
        message: "Name, email and OTP are required.",
      });
    }

    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(403).send({
        message: "This email is already registered. Please login instead.",
      });
    }

    const otpCheck = await verifyStoredOtp({
      OtpModel: SignupOtp,
      email,
      otp,
    });
    if (!otpCheck.ok) {
      return res.status(otpCheck.status).send({ message: otpCheck.message });
    }

    const signupName = otpCheck.record?.name || name;
    const newUser = new Customer({
      name: signupName,
      email,
    });

    await newUser.save();
    queueCustomerSignupNotificationEmail(newUser, "OTP signup");

    const token = signInToken(newUser);
    res.send(buildCustomerLoginResponse(newUser, token));
  } catch (err) {
    console.error("verifySignupOtp error:", err);
    res.status(500).send({
      message: err.message,
    });
  }
};

const forgetPassword = async (req, res) => {
  const isAdded = await Customer.findOne({ email: req.body.email });
  if (!isAdded) {
    return res.status(404).send({
      message: "User Not found with this email!",
    });
  } else {
    const token = tokenForVerify(isAdded);
    const option = {
      name: isAdded.name,
      email: isAdded.email,
      token: token,
    };

    const body = {
      from: process.env.EMAIL_USER,
      to: `${req.body.email}`,
      subject: "Password Reset",
      html: forgetPasswordEmailBody(option),
    };

    const message = "Please check your email to reset password!";
    sendEmail(body, res, message);
  }
};

const resetPassword = async (req, res) => {
  const token = req.body.token;
  const { email } = jwt.decode(token);
  const customer = await Customer.findOne({ email: email });

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET_FOR_VERIFY, (err, decoded) => {
      if (err) {
        return res.status(500).send({
          message: "Token expired, please try again!",
        });
      } else {
        customer.password = bcrypt.hashSync(req.body.newPassword, 10);
        customer.save();
        res.send({
          message: "Your password change successful, you can login now!",
        });
      }
    });
  }
};

const changePassword = async (req, res) => {
  try {
    // console.log("changePassword", req.body);
    const customer = await Customer.findOne({ email: req.body.email });
    if (!customer.password) {
      return res.status(403).send({
        message:
          "For change password,You need to sign up with email & password!",
      });
    } else if (
      customer &&
      bcrypt.compareSync(req.body.currentPassword, customer.password)
    ) {
      customer.password = bcrypt.hashSync(req.body.newPassword, 10);
      await customer.save();
      res.send({
        message: "Your password change successfully!",
      });
    } else {
      res.status(401).send({
        message: "Invalid email or current password!",
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const signUpWithProvider = async (req, res) => {
  try {
    // const { user } = jwt.decode(req.body.params);
    const user = jwt.decode(req.params.token);

    // console.log("user", user);
    const isAdded = await Customer.findOne({ email: user.email });
    if (isAdded) {
      const token = signInToken(isAdded);
      res.send({
        token,
        _id: isAdded._id,
        name: isAdded.name,
        email: isAdded.email,
        address: isAdded.address,
        phone: isAdded.phone,
        image: isAdded.image,
        cart: isAdded.cart || [],
        wishlist: isAdded.wishlist || [],
      });
    } else {
      const newUser = new Customer({
        name: user.name,
        email: user.email,
        image: user.picture,
      });

      const signUpCustomer = await newUser.save();
      queueCustomerSignupNotificationEmail(signUpCustomer, "Social login");
      const token = signInToken(signUpCustomer);
      res.send({
        token,
        _id: signUpCustomer._id,
        name: signUpCustomer.name,
        email: signUpCustomer.email,
        image: signUpCustomer.image,
        cart: signUpCustomer.cart || [],
        wishlist: signUpCustomer.wishlist || [],
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const signUpWithOauthProvider = async (req, res) => {
  try {
    // console.log("user", user);
    // console.log("signUpWithOauthProvider", req.body);
    const isAdded = await Customer.findOne({ email: req.body.email });
    if (isAdded) {
      const token = signInToken(isAdded);
      res.send({
        token,
        _id: isAdded._id,
        name: isAdded.name,
        email: isAdded.email,
        address: isAdded.address,
        phone: isAdded.phone,
        image: isAdded.image,
        cart: isAdded.cart || [],
        wishlist: isAdded.wishlist || [],
      });
    } else {
      const newUser = new Customer({
        name: req.body.name,
        email: req.body.email,
        image: req.body.image,
      });

      const signUpCustomer = await newUser.save();
      queueCustomerSignupNotificationEmail(signUpCustomer, "OAuth");
      const token = signInToken(signUpCustomer);
      res.send({
        token,
        _id: signUpCustomer._id,
        name: signUpCustomer.name,
        email: signUpCustomer.email,
        image: signUpCustomer.image,
        cart: signUpCustomer.cart || [],
        wishlist: signUpCustomer.wishlist || [],
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllCustomers = async (req, res) => {
  try {
    const users = await Customer.find({}).sort({ _id: -1 });
    res.send(users);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    res.send(customer);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Shipping address create or update
const addShippingAddress = async (req, res) => {
  try {
    const customerId = req.params.id;
    const newShippingAddress = req.body;

    // Find the customer by ID and update the shippingAddress field
    const result = await Customer.updateOne(
      { _id: customerId },
      {
        $set: {
          shippingAddress: newShippingAddress,
        },
      },
      { upsert: true } // Create a new document if no document matches the filter
    );

    if (result.nModified > 0 || result.upserted) {
      return res.send({
        message: "Shipping address added or updated successfully.",
      });
    } else {
      return res.status(404).send({ message: "Customer not found." });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getShippingAddress = async (req, res) => {
  try {
    const customerId = req.params.id;
    // const addressId = req.query.id;

    // console.log("getShippingAddress", customerId);
    // console.log("addressId", req.query);

    const customer = await Customer.findById(customerId);
    res.send({ shippingAddress: customer?.shippingAddress });

    // if (addressId) {
    //   // Find the specific address by its ID
    //   const address = customer.shippingAddress.find(
    //     (addr) => addr._id.toString() === addressId.toString()
    //   );

    //   if (!address) {
    //     return res.status(404).send({
    //       message: "Shipping address not found!",
    //     });
    //   }

    //   return res.send({ shippingAddress: address });
    // } else {
    //   res.send({ shippingAddress: customer?.shippingAddress });
    // }
  } catch (err) {
    // console.error("Error adding shipping address:", err);
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateShippingAddress = async (req, res) => {
  try {
    const activeDB = req.activeDB;

    const Customer = activeDB.model("Customer", CustomerModel);
    const customer = await Customer.findById(req.params.id);

    if (customer) {
      customer.shippingAddress.push(req.body);

      await customer.save();
      res.send({ message: "Success" });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const deleteShippingAddress = async (req, res) => {
  try {
    const activeDB = req.activeDB;
    const { userId, shippingId } = req.params;

    const Customer = activeDB.model("Customer", CustomerModel);
    await Customer.updateOne(
      { _id: userId },
      {
        $pull: {
          shippingAddress: { _id: shippingId },
        },
      }
    );

    res.send({ message: "Shipping Address Deleted Successfully!" });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    // Validate the input
    const { name, email, address, phone, image } = req.body;

    // Find the customer by ID
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).send({
        message: "Customer not found!",
      });
    }

    // Check if the email already exists and does not belong to the current customer
    const existingCustomer = await Customer.findOne({ email });
    if (
      existingCustomer &&
      existingCustomer._id.toString() !== customer._id.toString()
    ) {
      return res.status(400).send({
        message: "Email already exists.",
      });
    }

    // Update customer details
    customer.name = name;
    customer.email = email;
    customer.address = address;
    customer.phone = phone;
    customer.image = image;

    // Save the updated customer
    const updatedUser = await customer.save();

    // Generate a new token
    const token = signInToken(updatedUser);

    // Send the updated customer data with the new token
    res.send({
      token,
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      address: updatedUser.address,
      phone: updatedUser.phone,
      image: updatedUser.image,
      cart: updatedUser.cart || [],
      wishlist: updatedUser.wishlist || [],
      message: "Customer updated successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const deleteCustomer = (req, res) => {
  Customer.deleteOne({ _id: req.params.id }, (err) => {
    if (err) {
      res.status(500).send({
        message: err.message,
      });
    } else {
      res.status(200).send({
        message: "User Deleted Successfully!",
      });
    }
  });
};

// Save cart for a customer
const saveCart = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).send({ message: "Customer not found!" });
    }
    // console.log("saveCart items:", req.body.cart?.length);
    customer.cart = req.body.cart || [];
    customer.markModified("cart");
    await customer.save();
    res.send({ message: "Cart saved successfully!", cart: customer.cart });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get cart for a customer
const getCart = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).send({ message: "Customer not found!" });
    }
    // console.log("getCart items found:", customer.cart?.length);
    res.send({ cart: customer.cart || [] });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Save wishlist for a customer
const saveWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).send({ message: "Customer not found!" });
    }
    customer.wishlist = req.body.wishlist || [];
    customer.markModified("wishlist");
    await customer.save();
    res.send({ message: "Wishlist saved successfully!", wishlist: customer.wishlist });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get wishlist for a customer
const getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).send({ message: "Customer not found!" });
    }
    res.send({ wishlist: customer.wishlist || [] });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

module.exports = {
  loginCustomer,
  sendLoginOtp,
  verifyLoginOtp,
  sendSignupOtp,
  verifySignupOtp,
  verifyPhoneNumber,
  registerCustomer,
  addAllCustomers,
  signUpWithProvider,
  signUpWithOauthProvider,
  verifyEmailAddress,
  forgetPassword,
  changePassword,
  resetPassword,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  addShippingAddress,
  getShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
  saveCart,
  getCart,
  saveWishlist,
  getWishlist,
};
