from django.urls import path
from .views import GoogleAccountLinkView, GoogleAccountRetrieveView, GoogleAccountUnlinkView

urlpatterns = [
    path('link/', GoogleAccountLinkView.as_view(), name='link_google_account'),
    path('get/', GoogleAccountRetrieveView.as_view(), name='get_google_account'),
    path('unlink/', GoogleAccountUnlinkView.as_view(), name='unlink_google_account'),
]
