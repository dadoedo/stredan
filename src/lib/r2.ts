import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const bucket = process.env.R2_BUCKET;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const MAX_AGE_MS = 55 * 60 * 1000;

function client(): S3Client | null {
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) return null;
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function r2Get(
  key: string,
): Promise<{ body: Buffer; contentType: string } | null> {
  const s3 = client();
  if (!s3 || !bucket) return null;
  try {
    const object = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    const modified = object.LastModified?.getTime() ?? 0;
    if (Date.now() - modified > MAX_AGE_MS) return null;
    const bytes = await object.Body?.transformToByteArray();
    if (!bytes) return null;
    return {
      body: Buffer.from(bytes),
      contentType: object.ContentType ?? "application/octet-stream",
    };
  } catch {
    return null;
  }
}

export async function r2Put(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  const s3 = client();
  if (!s3 || !bucket) return;
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=3600",
      }),
    );
  } catch (error) {
    console.error("r2 put failed", error);
  }
}
