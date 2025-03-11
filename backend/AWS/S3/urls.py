from django.urls import path
from .views import S3FileUploadView, S3FileGetView, S3FileDeleteView

urlpatterns = [
    path("S3/upload/", S3FileUploadView.as_view(), name="S3_Upload"),
    path("S3/get/", S3FileGetView.as_view(), name="S3_Get"),
    path("S3/delete/", S3FileDeleteView.as_view(), name="S3_Delete"),
]
