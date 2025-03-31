from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework import status
from .models import GoogleAccount
from .serializers import GoogleAccountSerializer

class GoogleAccountRetrieveView(APIView):
    """
    View for retrieving the linked Google account of the current user.
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get(self, request, *args, **kwargs):
        try:
            google_account = request.user.google_account
            serializer = GoogleAccountSerializer(google_account)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except GoogleAccount.DoesNotExist:
            return Response(
                {"message": "No Google account linked."},
                status=status.HTTP_200_OK
            )

class GoogleAccountLinkView(APIView):
    """
    View for linking (or updating) a Google account.
    Before linking, it is additionally checked that the given google_id is not linked to another user.
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def post(self, request, *args, **kwargs):
        google_id = request.data.get("google_id")
        if not google_id:
            return Response(
                {"error": "google_id is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Ensure that the given google_id is not linked to another user
        if GoogleAccount.objects.filter(google_id=google_id).exclude(user=request.user).exists():
            return Response(
                {"error": "This Google account is already linked to another user."},
                status=status.HTTP_400_BAD_REQUEST
            )

        google_account, created = GoogleAccount.objects.get_or_create(user=request.user)
        google_account.google_id = google_id
        google_account.save()

        serializer = GoogleAccountSerializer(google_account)
        return Response(
            {
                "message": "Google account linked successfully.",
                "google_account": serializer.data
            },
            status=status.HTTP_200_OK
        )

class GoogleAccountUnlinkView(APIView):
    """
    View for unlinking the Google account from the current user.
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def delete(self, request, *args, **kwargs):
        try:
            google_account = request.user.google_account
            google_account.delete()
            return Response(
                {"message": "Google account unlinked successfully."},
                status=status.HTTP_200_OK
            )
        except GoogleAccount.DoesNotExist:
            return Response(
                {"error": "No Google account linked."},
                status=status.HTTP_400_BAD_REQUEST
            )

class GoogleLoginView(APIView):
    def post(self, request):
        google_id = request.data.get("google_id")
        if not google_id:
            return Response({"error": "Google ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            google_account = GoogleAccount.objects.get(google_id=google_id)
            user = google_account.user
            
            if not user.is_active:
                return Response({"error": "Your account is inactive. Please contact support."}, status=status.HTTP_403_FORBIDDEN)
            
            token, created = Token.objects.get_or_create(user=user)
            return Response({"token": token.key, "user_id": user.id}, status=status.HTTP_200_OK)
        
        except GoogleAccount.DoesNotExist:
            return Response({"error": "Google account not found"}, status=status.HTTP_404_NOT_FOUND)