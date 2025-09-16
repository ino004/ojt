import db from "../models/index.js";

const ROLES = db.ROLES;
const User = db.user;

export const checkDuplicateUsernameOrEmail = async (req, res, next) => {
  console.log("🔍 [Middleware] checkDuplicateUsernameOrEmail:", req.body);
  try {
    // Check for duplicate username
    const usernameExists = await User.findOne({ username: req.body.username }).exec();
    if (usernameExists) {
      return res.status(400).send({ message: "Failed! Username is already in use!" });
    }

    // Check for duplicate email
    const emailExists = await User.findOne({ email: req.body.email }).exec();
    if (emailExists) {
      return res.status(400).send({ message: "Failed! Email is already in use!" });
    }

    // If no duplicates are found, proceed to the next middleware
    next();
  } catch (err) {
    // Catch and handle any errors that occur during the database query
    res.status(500).send({ message: err.message });
  }
};

export const checkRolesExisted = (req, res, next) => {
    console.log("🔍 [Middleware] checkRolesExisted:", req.body.roles);
  if (req.body.roles) {
    for (let i = 0; i < req.body.roles.length; i++) {
      if (!ROLES.includes(req.body.roles[i])) {
        return res.status(400).send({
         message: `Failed! Role ${req.body.roles[i]} does not exist!`,
        });
      }
    }
  }
  next();
};