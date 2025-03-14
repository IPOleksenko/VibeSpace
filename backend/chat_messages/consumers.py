from channels.generic.websocket import AsyncWebsocketConsumer
import json

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"

        # Join the group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Leave the group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # Handler for new messages
    async def chat_message(self, event):
        """
        Receives an event from group_send and sends it to clients.
        """
        print("Sending WebSocket message:", json.dumps(event, indent=4))

        await self.send(text_data=json.dumps({
            "type": "message",
            "id": event["id"],
            "user": event["user"],
            "chat": event["chat"],
            "text": event["text"],
            "uploaded_at": event["uploaded_at"],
            "media_url": event.get("media_url"),
        }))
