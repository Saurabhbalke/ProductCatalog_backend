import s3 from "../config/awsConfig.js";
// import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

// import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from "@azure/storage-blob";
import { uploadToAzureBlob } from "./azure.js";


// ✅ Store Product Data in AWS S3
const uploadProductDataToS3 = async (productData) => {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `products/${Date.now()}-product.json`,
      Body: JSON.stringify(productData, null, 2),
      ContentType: "application/json",
    };
    await s3.upload(params).promise();
  } catch (error) {
    console.error("Error uploading product data to S3:", error.message);
    throw new Error("Failed to upload product data");
  }
};

// ✅ Add New Product
export const addProduct = async (req, res) => {
  try {
    const { name, description, price } = req.body;
    console.log("Received product data:", req.body);

    if (!name || !description || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    // Get correct Image URL from Azure
    const imageUrl = await uploadToAzureBlob(req.file);
    const productData = { name, description, price, imageUrl };
    console.log(imageUrl)
    // Store product data in S3
    await uploadProductDataToS3(productData);

    res.status(201).json({ message: "Product added!", product: productData });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
};

// ✅ List All Products
export const getProducts = async (req, res) => {
  try {
    console.log("Fetching products...");
    const params = { Bucket: process.env.S3_BUCKET_NAME, Prefix: "products/" };
    const data = await s3.listObjectsV2(params).promise();

    if (!data.Contents || data.Contents.length === 0) {
      return res.json({ message: "No products found" });
    }

    const products = await Promise.all(
      data.Contents.map(async (file) => {
        try {
          const fileData = await s3.getObject({ Bucket: process.env.S3_BUCKET_NAME, Key: file.Key }).promise();
          if (!fileData.Body) {
            console.warn(`Skipping empty file: ${file.Key}`);
            return null;
          }
          return JSON.parse(fileData.Body.toString());
        } catch (err) {
          console.error(`Error reading/parsing file ${file.Key}:`, err.message);
          return null;
        }
      })
    );

    res.json(products.filter(Boolean));
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
};
