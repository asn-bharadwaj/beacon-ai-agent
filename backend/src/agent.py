import json
import logging
import random

from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    RunContext,
    cli,
    function_tool,
    tokenize,
)
from livekit.plugins import deepgram, google, murf, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

import db

logger = logging.getLogger("agent")

load_dotenv(".env.local")

# Change this prompt to change what your voice agent does.
# See README.md for example prompts (customer support, language tutor, receptionist).
SYSTEM_PROMPT = """IDENTITY:
You are "Beacon", a warm, enthusiastic, and down-to-earth general knowledge AI assistant powered by Beacon AI.

Beacon exists to explain, not persuade. Everything follows from that:
1. It explains rather than argues.
2. It cites context when possible.
3. It presents multiple viewpoints on contentious topics.
4. It distinguishes facts from interpretations.
5. It admits uncertainty rather than inventing answers.

OBJECTIVES:
1. Explain interesting facts about science, history, geography, and space in simple, everyday language.
2. Spark curiosity and encourage the user to ask follow-up questions.
3. Provide a delightful, educational, and engaging conversational experience.

KNOWLEDGE:
You know about general knowledge topics (science, space, history, geography, arts). You do not know private personal information, real-time stocks, or clinical details.

LANGUAGE:
1. Match the user's language: If the user speaks or asks in a particular language (English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, etc.), you MUST reply in that exact same language.
2. Support natural code-mixed language (e.g. Hinglish, Tanglish, etc.). If the user mixes English with an Indian language, mirror their register and reply using simple code-mixed terms that are natural and everyday.
3. Avoid overly formal or literal translations. For example, use common technical terms in English (e.g. "gravity" instead of "gurutvakarshan", "orbit" instead of "kaksha") when speaking code-mixed sentences so it flows naturally.
4. Keep the register informal, warm, respectful, and highly approachable.

### LANGUAGE & SCRIPT
Always write every language in its own native script.
- Hindi & Marathi → Devanagari script (e.g. नमस्ते, नमस्कार), never romanized (never "namaste").
- Tamil → Tamil script (e.g. வணக்கம்), never romanized (never "vanakkam").
- Telugu → Telugu script (e.g. నమస్కారం), never romanized (never "namaskaram").
- Kannada → Kannada script (e.g. ನಮಸ್ಕಾರ), never romanized (never "namaskara").
- Malayalam → Malayalam script (e.g. നമസ്കാരം), never romanized (never "namaskaram").
- Bengali → Bengali script (e.g. নমস্কার), never romanized (never "namaskar").
- Gujarati → Gujarati script (e.g. નમસ્તે), never romanized (never "namaste").
- Same rule for all other non-English languages.

MEMORY & PRIVACY:
1. Lookup: As soon as the user introduces themselves or says their name, call the `lookup_user` tool to search for their profile.
2. Greet Returning Callers: If the profile is found, greet them warmly by name and reference their previous topic or details (e.g. "नमस्ते रमेश! आपका फिर से स्वागत है। पिछली बार हम गुरुत्वाकर्षण के बारे में बात कर रहे थे। क्या वह जानकारी काम आई?"). Welcome them back and build on the topic.
3. Ask Before Saving: You MUST explicitly ask the user for permission to remember them or save their progress (e.g., "क्या मैं अगली बार के लिए आपका नाम और आज की बातें याद रख सकता हूँ?").
4. Saving: If the user grants permission (says yes), call the `save_user_profile` tool to store their name, language preference, and learning details. If they decline or say no, do not call the tool and do not save anything.

GUARDRAILS:
1. Refusals: Do not provide medical diagnoses, legal opinions, financial investment advice, or ask for sensitive details (PIN, OTP, passwords).
2. Never-Claims: Never claim to be a human, doctor, financial advisor, or have official credentials.
3. Historical Neutrality: Never take sides in historical, political, or social conflicts. Always present objective historical facts, remain unbiased, and stay strictly true to documented history.
4. Escalation Script: If asked for professional advice, say: "I am a general knowledge AI assistant, so I cannot give professional advice. Please check with a qualified expert for this."

STYLE:
1. Maintain a friendly neighbor tone who loves sharing cool facts.
2. Keep responses short and concise (2-3 sentences max).
3. Do NOT use bullet points, lists, emojis, markdown formatting, or symbols."""


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions=SYSTEM_PROMPT)

    @function_tool
    async def lookup_user(self, context: RunContext, name: str) -> str:
        """Look up a user by their name to retrieve their profile and memory facts.

        Args:
            name: The name of the user to look up.
        """
        logger.info(f"Lookup request for user: {name}")
        profile = db.lookup_user(name)
        if profile:
            return json.dumps(profile)
        return f"No profile found for user name '{name}'."

    @function_tool
    async def save_user_profile(
        self,
        context: RunContext,
        name: str,
        language_preference: str,
        current_level: str,
        topics_covered: str,
        mistakes: str,
    ) -> str:
        """Save or update the user's profile and memory facts in the database.

        Before invoking this tool, you must explicitly ask the user for permission to save their name and facts (e.g. 'Is it okay if I remember your details for next time?').
        If the user declines, you must NOT save their information.

        Args:
            name: The user's name.
            language_preference: The user's preferred language (e.g. English, Hindi, Hinglish).
            current_level: The user's current learning level (e.g. Beginner, Intermediate, Advanced).
            topics_covered: Topics covered in today's lesson (e.g. gravity, planets, history).
            mistakes: Mistakes they kept making or areas of struggle.
        """
        logger.info(f"Saving profile details for user: {name}")
        facts = {
            "current_level": current_level,
            "topics_covered": topics_covered,
            "mistakes": mistakes,
        }
        profile = db.save_user(name, language_preference, facts)
        return f"Successfully saved profile for {name}: {json.dumps(profile)}"


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()
    db.init_db()


server.setup_fnc = prewarm


@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
    # Logging setup
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Set up a voice AI pipeline using Murf Falcon, Gemini, Deepgram, and the LiveKit turn detector
    session = AgentSession(
        # Speech-to-text (STT) is your agent's ears, turning the user's speech into text that the LLM can understand
        # See all available models at https://docs.livekit.io/agents/models/stt/
        stt=deepgram.STT(
            model="nova-3",
            language="multi",
            smart_format=True,
            keyterms=["Beacon", "AI"],
        ),
        # A Large Language Model (LLM) is your agent's brain, processing user input and generating a response
        # See all available models at https://docs.livekit.io/agents/models/llm/
        llm=google.LLM(
            model="gemini-3.5-flash-lite",
        ),
        # Text-to-speech (TTS) is your agent's voice, turning the LLM's text into speech that the user can hear
        # See all available models as well as voice selections at https://docs.livekit.io/agents/models/tts/
        tts=murf.TTS(
            voice="Anisha",
            style="Conversation",
            tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
            text_pacing=True,
        ),
        # VAD and turn detection are used to determine when the user is speaking and when the agent should respond
        # See more at https://docs.livekit.io/agents/build/turns
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        # allow the LLM to generate a response while waiting for the end of turn
        # See more at https://docs.livekit.io/agents/build/audio/#preemptive-generation
        preemptive_generation=True,
        min_endpointing_delay=0.3,
        max_endpointing_delay=0.8,
    )

    # To use a realtime model instead of a voice pipeline, use the following session setup instead.
    # (Note: This is for the OpenAI Realtime API. For other providers, see https://docs.livekit.io/agents/models/realtime/))
    # 1. Install livekit-agents[openai]
    # 2. Set OPENAI_API_KEY in .env.local
    # 3. Add `from livekit.plugins import openai` to the top of this file
    # 4. Use the following session setup instead of the version above
    # session = AgentSession(
    #     llm=openai.realtime.RealtimeModel(voice="marin")
    # )

    # # Add a virtual avatar to the session, if desired
    # # For other providers, see https://docs.livekit.io/agents/models/avatar/
    # avatar = hedra.AvatarSession(
    #   avatar_id="...",  # See https://docs.livekit.io/agents/models/avatar/plugins/hedra
    # )
    # # Start the avatar and wait for it to join
    # await avatar.start(session, room=ctx.room)

    # Join the room and connect to the user
    await ctx.connect()

    # Start the session, which initializes the voice pipeline and warms up the models
    await session.start(
        agent=Assistant(),
        room=ctx.room,
    )

    # Welcome messages variations
    greetings = [
        "Hey there! I am Beacon. What kind of interesting stories or fun facts can I share with you today?",
        "Hello! I am Beacon, your general knowledge companion. What amazing topic or history facts are we exploring today?",
        "Hi! Beacon here. Ready to dive into some cool facts about science, space, or history? What is on your mind?",
        "Hey friend! I am Beacon. I've got some fascinating stories lined up for you today. Where would you like to start?",
        "Greetings! I am Beacon. Ready to spark your curiosity with some interesting facts? What shall we learn about today?",
    ]
    # Speak a warm greeting to let the user know we are ready
    await session.say(random.choice(greetings), allow_interruptions=True)


if __name__ == "__main__":
    cli.run_app(server)
