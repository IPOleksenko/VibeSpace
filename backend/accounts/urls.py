from django.urls import path
from .views import RegisterUserView, LoginView, UpdateUserProfileView, UserProfileView, UserSearchView, GetUserByIdView

urlpatterns = [
    path("register/", RegisterUserView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("update/", UpdateUserProfileView.as_view(), name="update"),

    path("user/", UserProfileView.as_view(), name="user"),
    path('user/search/', UserSearchView.as_view(), name="user_search"),
    path('user/<int:id>/', GetUserByIdView.as_view(), name='get_user_by_id'),
]
