from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from rest_framework.authtoken.models import Token

class InactiveUserMiddleware(MiddlewareMixin):
    def process_request(self, request):
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Token "):
            token_key = auth_header.split(" ")[1]
            try:
                token = Token.objects.get(key=token_key)
                user = token.user
                
                if not user.is_active:
                    token.delete()
                    return JsonResponse(
                        {"error": "Your account is inactive.", "forceLogout": True}, 
                        status=403
                    )
            except Token.DoesNotExist:
                pass
