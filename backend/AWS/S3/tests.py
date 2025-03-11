import os
import boto3
from django.core.files.base import ContentFile
from django.conf import settings
from django.test import TestCase

class S3StorageTest(TestCase):
    def test_s3_upload(self):
        try:
            # Check connection to S3
            s3 = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME
            )
            
            # Check the list of buckets
            response = s3.list_buckets()
            self.assertIn(settings.AWS_STORAGE_BUCKET_NAME, [bucket['Name'] for bucket in response['Buckets']])
            
            # Upload a test file
            test_file_name = "test_upload.txt"
            test_content = "Hello, S3 from Django!"
            
            s3.upload_fileobj(
                ContentFile(test_content.encode()),
                settings.AWS_STORAGE_BUCKET_NAME,
                test_file_name
            )
            
            file_url = f"{settings.MEDIA_URL}{test_file_name}"
            
            # Verify that the file was uploaded
            response = s3.head_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=test_file_name)
            self.assertIsNotNone(response)
            print("File successfully uploaded at:", file_url)
            
            # Upload the site logo
            logo_path = os.path.join(os.path.dirname(settings.BASE_DIR), "frontend/src/logo.svg")
            logo_file_name = "logo.svg"
            
            with open(logo_path, "rb") as logo_file:
                s3.upload_fileobj(
                    logo_file,
                    settings.AWS_STORAGE_BUCKET_NAME,
                    logo_file_name
                )
            
            logo_url = f"{settings.MEDIA_URL}{logo_file_name}"
            
            # Verify that the logo was uploaded
            response = s3.head_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=logo_file_name)
            self.assertIsNotNone(response)
            print("Logo successfully uploaded at:", logo_url)
            
        except Exception as e:
            self.fail(f"Error connecting to S3: {e}")
