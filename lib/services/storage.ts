/* eslint-disable import/no-anonymous-default-export */
import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET = process.env.S3_BUCKET || process.env.MINIO_BUCKET || "nimbus";

function s3Client() {
	const endpoint = process.env.S3_ENDPOINT;
	return new S3Client({
		endpoint: endpoint || undefined,
		region: process.env.S3_REGION || "us-east-1",
		credentials: {
			accessKeyId:
				process.env.AWS_ACCESS_KEY_ID ||
				process.env.MINIO_ROOT_USER ||
				"",
			secretAccessKey:
				process.env.AWS_SECRET_ACCESS_KEY ||
				process.env.MINIO_ROOT_PASSWORD ||
				"",
		},
		forcePathStyle:
			Boolean(process.env.S3_FORCE_PATH_STYLE) || Boolean(endpoint),
	});
}

export async function getPresignedPutUrl(
	key: string,
	contentType: string,
	expiresSeconds = 900,
) {
	const client = s3Client();
	const cmd = new PutObjectCommand({
		Bucket: BUCKET,
		Key: key,
		ContentType: contentType,
	});
	const url = await getSignedUrl(client, cmd, { expiresIn: expiresSeconds });
	return url;
}

export async function getPresignedGetUrl(key: string, expiresSeconds = 900) {
	const client = s3Client();
	const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
	const url = await getSignedUrl(client, cmd, { expiresIn: expiresSeconds });
	return url;
}

export async function uploadBuffer(
	key: string,
	buffer: Buffer,
	contentType?: string,
) {
	const client = s3Client();
	const cmd = new PutObjectCommand({
		Bucket: BUCKET,
		Key: key,
		Body: buffer,
		ContentType: contentType,
	});
	return client.send(cmd);
}

export default {
	getPresignedPutUrl,
	getPresignedGetUrl,
	uploadBuffer,
};
