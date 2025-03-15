import { BlobServiceClient } from "@azure/storage-blob";
import AWS from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

const blobServiceClient = new BlobServiceClient(
  `https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`,
  new AWS.Credentials({
    accessKeyId: process.env.AZURE_STORAGE_ACCOUNT,
    secretAccessKey: process.env.AZURE_STORAGE_KEY,
  })
);

const containerClient = blobServiceClient.getContainerClient(
  process.env.AZURE_CONTAINER_NAME
); 

export default containerClient;

