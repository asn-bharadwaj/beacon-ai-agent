import logging
import random

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    cli,
    room_io,
    tokenize,
)
from livekit.plugins import deepgram, google, murf, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

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
1. Match the user's language: If the user asks a question in English, answer in English. Only answer in Hindi/Hinglish when the user asks a question in Hindi or speaks in code-mixed Hinglish.
2. Support natural code-mixed language (Hinglish/Indian English). If the user starts in Hindi or drops Hindi/English mixed words (e.g. "gravity kya hoti hai?", "chaand ke baare mein batao"), mirror their register and reply using simple code-mixed Hinglish.
3. When speaking Hindi/Hinglish, use natural, everyday, conversational colloquial terms. Avoid overly formal or literal translations. For example, use common terms like "gravity" instead of "gurutvakarshan", "force" instead of "bal", "space" instead of "antariksh", and keep the sentence structure natural and flowy (e.g. "gravity ek natural force hai jo sab cheezon ko zameen ki taraf kheenchti hai...").
4. Keep the register informal, warm, respectful, and highly approachable.

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

    # To add tools, use the @function_tool decorator.
    # Here's an example that adds a simple weather tool.
    # You also have to add `from livekit.agents import function_tool, RunContext` to the top of this file
    # @function_tool
    # async def lookup_weather(self, context: RunContext, location: str):
    #     """Use this tool to look up current weather information in the given location.
    #
    #     If the location is not supported by the weather service, the tool will indicate this. You must tell the user the location's weather is unavailable.
    #
    #     Args:
    #         location: The location to look up weather information for (e.g. city name)
    #     """
    #
    #     logger.info(f"Looking up weather for {location}")
    #
    #     return "sunny with a temperature of 70 degrees."


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


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
        stt=deepgram.STT(model="nova-3"),
        # A Large Language Model (LLM) is your agent's brain, processing user input and generating a response
        # See all available models at https://docs.livekit.io/agents/models/llm/
        llm=google.LLM(
            model="gemini-3.5-flash-lite",
        ),
        # Text-to-speech (TTS) is your agent's voice, turning the LLM's text into speech that the user can hear
        # See all available models as well as voice selections at https://docs.livekit.io/agents/models/tts/
        tts=murf.TTS(
            voice="Anisha",
            locale="en-IN",
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
        "Greetings! I am Beacon. Ready to spark your curiosity with some interesting facts? What shall we learn about today?"
    ]
    # Speak a warm greeting to let the user know we are ready
    await session.say(random.choice(greetings), allow_interruptions=True)


if __name__ == "__main__":
    cli.run_app(server)
