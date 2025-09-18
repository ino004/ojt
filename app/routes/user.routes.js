
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
  restoreUser,
  getMyProfile, 
  updateMyProfile,
  getUserAvatar,
} from "../controllers/user.controller.js";
import { authJwt } from "../middlewares/index.js";
import { uploadAvatar } from "../middlewares/uploadAvatar.js";
import { updateMyAvatar } from "../controllers/user.controller.js";
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
 * /api/users/me:
 *   get:
 *     summary: Lấy hồ sơ của user đang đăng nhập
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin hồ sơ user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: integer
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 isVerified:
 *                   type: boolean
 *                 isDeleted:
 *                   type: boolean
 *                 avatarUrl:
 *                   type: string
 *                   example: http://localhost:3000/api/users/1/avatar
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authJwt.verifyToken, getMyProfile);
/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Cập nhật hồ sơ của user (username hoặc mật khẩu)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: new_username
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Bắt buộc nếu muốn đổi mật khẩu
 *                 example: old_password
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu mới (cần currentPassword đúng)
 *                 example: new_secure_password
 *     responses:
 *       200:
 *         description: Hồ sơ đã được cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc mật khẩu cũ không chính xác
 *       401:
 *         description: Unauthorized
 */
router.put("/me", authJwt.verifyToken, updateMyProfile);

/**
 * @swagger
 * /api/users/me/avatar:
 *   patch:
 *     summary: Cập nhật avatar của user (form-data)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Cập nhật avatar thành công
 *       400:
 *         description: Thiếu file hoặc file không hợp lệ
 *       401:
 *         description: Unauthorized
 */
router.patch("/me/avatar", authJwt.verifyToken, uploadAvatar, updateMyAvatar);
/**
 * @swagger
 * /api/users/{id}/avatar:
 *   get:
 *     summary: Lấy ảnh avatar của user
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của user
 *     responses:
 *       200:
 *         description: Ảnh avatar (binary data)
 *         content:
 *           image/jpeg: {}
 *           image/png: {}
 *           image/webp: {}
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Không có avatar
 */
router.get("/:id/avatar", authJwt.verifyToken, getUserAvatar);

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

