import express from "express";
import upload from "../middlewares/uploadMiddleware.js";
import { addProduct, getProducts } from "../controllers/productController.js";

const router = express.Router();

router.post("/", upload.single("image"), addProduct);
router.get("/", getProducts);

export default router;
