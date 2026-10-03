import { Router } from "express";
import { CheckAuth, isAdmin } from "../middlewares/auth.js";
import { uploadImage } from "../middlewares/upload.js";
import {
  uploadMenuItemImage,
  deleteMenuItemImage,
} from "../controllers/upload.controller.js";

const uploadRouter = Router();

uploadRouter.post(
  "/menu-item-image/:id",
  CheckAuth,
  isAdmin,
  uploadImage.single("image"),
  uploadMenuItemImage,
);

uploadRouter.delete(
  "/menu-item-image/:id",
  CheckAuth,
  isAdmin,
  deleteMenuItemImage,
);

export default uploadRouter;
