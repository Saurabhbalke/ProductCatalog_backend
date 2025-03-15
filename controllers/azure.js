import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from "@azure/storage-blob";
import dotenv from "dotenv";
dotenv.config();

const storageAccountBaseUrl = `https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`;
const sharedKeyCredential = new StorageSharedKeyCredential(
  process.env.AZURE_STORAGE_ACCOUNT,
  process.env.AZURE_STORAGE_KEY
);
const blobServiceClient = new BlobServiceClient(storageAccountBaseUrl, sharedKeyCredential);

export const uploadToAzureBlob = async (file) => {
  if (!file) throw new Error("No file uploaded");

  const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_CONTAINER_NAME);
  const blobName = `images/${Date.now()}-${file.originalname}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  // Upload file
  await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: { blobContentType: file.mimetype },
  });

  // Generate a SAS Token (Valid for 24 hours)
  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: process.env.AZURE_CONTAINER_NAME,  // ✅ Required
      blobName,  // ✅ Required
      expiresOn: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      permissions: BlobSASPermissions.parse("r"), // Read-only
    },
    sharedKeyCredential
  ).toString();

  return `${blockBlobClient.url}?${sasToken}`;
};
