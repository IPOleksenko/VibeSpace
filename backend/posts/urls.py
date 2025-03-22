from django.urls import path
from .views import PostCreateView, UserPostsView, SubscribedUsersPostsView

urlpatterns = [
    path("create/", PostCreateView.as_view(), name="Post_Upload"),
    path("user/get/", UserPostsView.as_view(), name="User_Post_Get"),
    path("subscriptions/get/", SubscribedUsersPostsView.as_view(), name="User_Post_Get"),

]
