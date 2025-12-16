import { GoogleGenAI, Chat, Content } from "@google/genai";
import { TIGRA_SYSTEM_INSTRUCTION, MODEL_NAME } from "../constants";
import { Message, UserContext, UserProfile } from "../types";

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const formatHistoryForGemini = (messages: Message[]): Content[] => {
  return messages.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }));
};

export const createChatSession = async (
  previousMessages: Message[] = [],
  userContext: UserContext,
  userProfile: UserProfile
) => {
  let personalizedContext = `
[SYSTEM CONTEXT]
User Environment: ${userContext.platform}, ${userContext.userAgent}
User Timezone: ${userContext.timezone}
User Language: ${userContext.language}
`.trim();

  // Inject Basic Profile Info (Name, Age, Gender, Country)
  personalizedContext += `
\n[USER PROFILE]
Name: ${userProfile.name}
Age: ${userProfile.age || 'Not specified'}
Gender: ${userProfile.gender || 'Not specified'}
Country: ${userProfile.country || 'Not specified'}
`.trim();

  // Inject Preferences if they exist
  if (userProfile.preferences) {
    const p = userProfile.preferences;
    personalizedContext += `
\n[USER PERSONALIZATION]
Location (City): ${p.location || 'Unknown'}
Marital Status: ${p.maritalStatus || 'Not specified'}
Occupation: ${p.occupation || 'Not specified'}
Interests: ${p.interests || 'Not specified'}
`.trim();
  }

  const chat: Chat = ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: TIGRA_SYSTEM_INSTRUCTION + "\n\n" + personalizedContext,
      temperature: 0.7,
    },
    history: formatHistoryForGemini(previousMessages),
  });

  return chat;
};

export const sendMessageStream = async (
  chat: Chat,
  message: string
) => {
  return await chat.sendMessageStream({ message });
};