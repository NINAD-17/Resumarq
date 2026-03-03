"""
S3 Service — Download resume PDFs from S3.
"""

import boto3

from app.config import settings

s3_client = boto3.client(
    "s3",
    region_name=settings.aws_region,
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
)


def download_resume_from_s3(s3_key: str) -> bytes:
    """Download a resume PDF from S3 and return raw bytes."""
    response = s3_client.get_object(
        Bucket=settings.aws_s3_bucket_name,
        Key=s3_key,
    )
    return response["Body"].read()
