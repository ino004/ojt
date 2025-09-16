import express from "express";
import {
  allAccess,
  userBoard,
  adminBoard,
  moderatorBoard,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  restoreUser
} from "../controllers/user.controller.js";
import { authJwt } from "../middlewares/index.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: Các API test phân quyền người dùng
 */

/**
 * @swagger
 * /api/test/all:
 *   get:
 *     summary: Public content (không cần đăng nhập)
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Trả về nội dung public
 */
router.get("/all", allAccess);

/**
 * @swagger
 * /api/test/user:
 *   get:
 *     summary: Nội dung dành cho User (cần token)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về nội dung của User
 *       401:
 *         description: Không có hoặc token không hợp lệ
 */
router.get("/user", [authJwt.verifyToken], userBoard);

/**
 * @swagger
 * /api/test/mod:
 *   get:
 *     summary: Nội dung dành cho Moderator (cần token và quyền Moderator)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về nội dung của Moderator
 *       403:
 *         description: Yêu cầu quyền Moderator
 */
router.get("/mod", [authJwt.verifyToken, authJwt.isModerator], moderatorBoard);

/**
 * @swagger
 * /api/test/admin:
 *   get:
 *     summary: Nội dung dành cho Admin (cần token và quyền Admin)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về nội dung của Admin
 *       403:
 *         description: Yêu cầu quyền Admin
 */
router.get("/admin", [authJwt.verifyToken, authJwt.isAdmin], adminBoard);





/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API quản lý người dùng (Admin Only)
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lấy danh sách tất cả user (chưa bị xóa)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Không có hoặc token không hợp lệ
 *       403:
 *         description: Chỉ Admin mới được phép
 */
router.get("/", [authJwt.verifyToken, authJwt.isAdmin], getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Lấy thông tin user theo ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Không có hoặc token không hợp lệ
 *       403:
 *         description: Chỉ Admin mới được phép
 *       404:
 *         description: Không tìm thấy user
 */
router.get("/:id", [authJwt.verifyToken, authJwt.isAdmin], getUserById);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Tạo user mới
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Email đã tồn tại
 *       401:
 *         description: Không có hoặc token không hợp lệ
 *       403:
 *         description: Chỉ Admin mới được phép
 */
router.post("/", [authJwt.verifyToken, authJwt.isAdmin], createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Cập nhật thông tin user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *               isVerified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       401:
 *         description: Không có hoặc token không hợp lệ
 *       403:
 *         description: Chỉ Admin mới được phép
 *       404:
 *         description: Không tìm thấy user
 */
router.put("/:id", [authJwt.verifyToken, authJwt.isAdmin], updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Ẩn (soft delete) user theo ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User đã bị ẩn (soft delete)
 *       401:
 *         description: Không có hoặc token không hợp lệ
 *       403:
 *         description: Chỉ Admin mới được phép
 *       404:
 *         description: Không tìm thấy user
 */
router.delete("/:id", [authJwt.verifyToken, authJwt.isAdmin], deleteUser);

/**
 * @swagger
 * /api/users/{id}/restore:
 *   put:
 *     summary: Khôi phục user đã bị ẩn (soft delete)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Khôi phục thành công
 *       400:
 *         description: User chưa bị xóa
 *       401:
 *         description: Không có hoặc token không hợp lệ
 *       403:
 *         description: Chỉ Admin mới được phép
 *       404:
 *         description: Không tìm thấy user
 */
router.put("/:id/restore", [authJwt.verifyToken, authJwt.isAdmin], restoreUser);

export default router;