"""
Storage Service — Download resume PDFs from AWS S3 or Cloudinary.
"""

import functools
import logging
import urllib.request
import boto3

from app.config import settings

logger = logging.getLogger(__name__)


@functools.lru_cache(maxsize=1)
def get_s3_client():
    return boto3.client(
        "s3",
        region_name=settings.aws_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
    )


def download_resume_from_s3(s3_key: str) -> bytes:
    """
    Download a resume PDF from S3 or Cloudinary URL and return raw bytes.
    Works seamlessly whether the key is an S3 bucket path or a Cloudinary HTTPS URL.
    """
    # 1. If key is a direct URL (Cloudinary or any HTTP storage)
    if s3_key.startswith("http://") or s3_key.startswith("https://"):
        logger.info("Fetching resume directly via HTTP/HTTPS URL from Cloudinary...")
        req = urllib.request.Request(
            s3_key,
            headers={"User-Agent": "Mozilla/5.0 Resumarq-Agent-Server"},
        )
        with urllib.request.urlopen(req) as response:
            return response.read()

    # 2. Otherwise fetch from AWS S3 bucket
    logger.info("Fetching resume from AWS S3 bucket: %s, key: %s", settings.aws_s3_bucket_name, s3_key)
    s3_client = get_s3_client()
    response = s3_client.get_object(
        Bucket=settings.aws_s3_bucket_name,
        Key=s3_key,
    )
    return response["Body"].read()

