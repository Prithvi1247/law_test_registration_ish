
import { apiRequest } from "./client";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  reply: string;
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[]
): Promise<string> {
  const data = await apiRequest<ChatResponse>(
    "/chatbot/message",
    {
      method: "POST",
      body: { message, history },
    }
  );

  return data.reply;
}
