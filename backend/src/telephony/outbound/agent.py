"""Outbound telephony agent — places calls and talks to whoever answers.

Unlike the inbound agent, this one does the dialling. It waits to be dispatched
into a room with a phone number in the job metadata, then asks LiveKit to call
that number and bridge it into the room.

Run the worker with:

    uv run python src/telephony/outbound/agent.py dev

Then trigger a call from another terminal:

    uv run python src/telephony/outbound/dial.py --to +15551234567

See src/telephony/README.md for the trunk setup.
"""

import asyncio
import json
import logging
import os
import sys

# Configure path so we can import from src/ without shadowing
src_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir in sys.path:
    sys.path.remove(script_dir)

from dotenv import load_dotenv
from livekit import api, rtc
from livekit.agents import (
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    RunContext,
    cli,
    function_tool,
    room_io,
    tokenize,
)
from livekit.plugins import deepgram, google, murf, noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

# Import our custom database module and base assistant
import db
from agent import SYSTEM_PROMPT as BASE_SYSTEM_PROMPT
from agent import Assistant

logger = logging.getLogger("outbound-agent")

load_dotenv(".env.local")

# Required — create this with `lk sip outbound create` (see src/telephony/README.md).
OUTBOUND_TRUNK_ID = os.getenv("LIVEKIT_SIP_OUTBOUND_TRUNK_ID")

# Optional — a phone number to transfer people to when they ask for a human.
TRANSFER_TO_NUMBER = os.getenv("TRANSFER_TO_NUMBER")

# Outbound instructions to append to base system prompt
OUTBOUND_INSTRUCTIONS = """

OUTBOUND PHONE CALL RULES:
1. Introduction: You are placing an outbound call to the user. Introduce yourself as "Beacon" immediately and state the reason: you are calling for their daily news and practice session.
2. Voicemail: If you reach a voicemail or answering machine, call the `detected_answering_machine` tool immediately.
3. Human Handoff: If the user asks for a human, use the `transfer_to_human` tool.
4. Hanging Up: When the call is finished and you have said goodbye, use the `end_call` tool.
5. Tone: Be brief, respectful, and keep responses conversational (no formatting, markdown, or bullet points).
"""
SYSTEM_PROMPT = BASE_SYSTEM_PROMPT + OUTBOUND_INSTRUCTIONS

# The default greeting if no user profile is loaded.
GREETING = "Hello! This is your learning assistant Beacon calling for your daily news and practice. Do you have a moment?"

# The identity LiveKit gives the person we call. Used to transfer them later.
CALLEE_IDENTITY = "phone-user"


class OutboundAgent(Assistant):
    def __init__(self, ctx: JobContext, call_info: dict | None = None) -> None:
        super().__init__(instructions=SYSTEM_PROMPT, call_info=call_info)
        self.ctx = ctx

    @function_tool
    async def transfer_to_human(self, context: RunContext) -> str:
        """Transfer the person to a human colleague.

        Use this when they explicitly ask for a person, or when you cannot help
        them with their request.
        """
        if not TRANSFER_TO_NUMBER:
            return "Transfers are not available on this line. Offer to have someone call back instead."

        # Tell them before transferring — the SIP transfer cuts off the audio.
        await context.session.generate_reply(
            instructions="Tell them you're connecting them to a colleague now."
        )

        logger.info("transferring call to %s", TRANSFER_TO_NUMBER)
        try:
            await self.ctx.api.sip.transfer_sip_participant(
                api.TransferSIPParticipantRequest(
                    room_name=self.ctx.room.name,
                    participant_identity=CALLEE_IDENTITY,
                    transfer_to=f"tel:{TRANSFER_TO_NUMBER}",
                    play_dialtone=True,
                )
            )
        except Exception:
            logger.exception("transfer failed")
            return "The transfer did not go through. Apologize and offer a call back."

        return "Transferred."

    @function_tool
    async def detected_answering_machine(self, context: RunContext) -> str:
        """Hang up because the call reached a voicemail or answering machine.

        Use this as soon as you hear a recorded greeting rather than a live person.
        """
        logger.info("answering machine detected — hanging up")
        await self._hangup()
        return "Call ended."

    @function_tool
    async def end_call(self, context: RunContext) -> str:
        """Hang up the call.

        Use this once the conversation is finished and you have said goodbye.
        """
        await context.session.generate_reply(
            instructions="Thank them for their time and say a short goodbye."
        )

        logger.info("ending call")
        await self._hangup()
        return "Call ended."

    async def _hangup(self) -> None:
        """Delete the room, which drops the SIP leg and ends the phone call."""
        await self.ctx.api.room.delete_room(
            api.DeleteRoomRequest(room=self.ctx.room.name)
        )


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()
    db.init_db()


server.setup_fnc = prewarm


def user_info_from_metadata(ctx: JobContext) -> tuple[str | None, str | None]:
    """Read the number and optional name out of the dispatch metadata set by dial.py."""
    metadata = ctx.job.metadata
    if not metadata:
        return None, None
    try:
        data = json.loads(metadata)
        return data.get("phone_number"), data.get("name")
    except json.JSONDecodeError:
        # Allow a bare phone number as metadata too, for quick `lk dispatch` tests.
        return metadata.strip() or None, None


@server.rtc_session(agent_name="outbound-agent")
async def outbound_agent(ctx: JobContext):
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    phone_number, user_name = user_info_from_metadata(ctx)
    if not phone_number:
        logger.error(
            "no phone number in job metadata — dispatch with "
            '{"phone_number": "+15551234567"}'
        )
        ctx.shutdown()
        return

    if not OUTBOUND_TRUNK_ID:
        logger.error("LIVEKIT_SIP_OUTBOUND_TRUNK_ID is not set — cannot place calls")
        ctx.shutdown()
        return

    await ctx.connect()

    # Look up user profile from SQLite database
    profile = None
    if user_name:
        profile = db.lookup_user(user_name)

    greeting = GREETING
    if profile:
        lang = profile.get("language_preference", "English").strip().lower()
        name = profile["name"]
        if "hindi" in lang:
            greeting = f"नमस्ते {name}! मैं बीकन बोल रहा हूँ। आपके दैनिक समाचार और अभ्यास के लिए फोन किया है। क्या आपके पास एक मिनट है?"
        elif "tamil" in lang:
            greeting = f"வணக்கம் {name}! நான் பீக்கன் பேசுகிறேன். உங்களது தினசரி செய்தி மற்றும் பயிற்சி அமர்வுக்கு அழைக்கிறேன். உங்களிடம் ஒரு நிமிடம் இருக்கிறதா?"
        else:
            greeting = f"Hello {name}! This is your learning assistant Beacon calling for your daily news and practice. Do you have a moment?"

    # Same voice pipeline as src/agent.py — see that file for the annotated version.
    session = AgentSession(
        stt=deepgram.STT(
            model="nova-3",
            language="multi",
            smart_format=True,
            keyterms=["Beacon", "AI"],
        ),
        llm=google.LLM(
            model="gemini-3.5-flash-lite",
        ),
        tts=murf.TTS(
            voice="Anisha",
            style="Conversation",
            tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
            text_pacing=True,
        ),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
        min_endpointing_delay=0.3,
        max_endpointing_delay=0.8,
    )

    from datetime import datetime

    start_time = datetime.now()
    call_info = {
        "success": False,
        "user_turns": 0,
        "channel": "sip",
    }

    @session.on("user_input_transcribed")
    def on_user_speech(chat_msg):
        call_info["user_turns"] += 1
        logger.info(
            f"Outbound user speech turn detected: {chat_msg.transcript} (Turns: {call_info['user_turns']})"
        )

    @ctx.room.on("participant_disconnected")
    def on_participant_disconnected(participant):
        if participant.identity == ctx.room.local_participant.identity:
            return

        logger.info("Outbound caller disconnected. Logging analytics data.")
        duration = (datetime.now() - start_time).total_seconds()
        success = call_info["success"] or (call_info["user_turns"] >= 2)

        failure_reason = None
        if not success:
            failure_reason = (
                "early_hangup"
                if call_info["user_turns"] == 0
                else "incomplete_lesson"
            )

        db.save_call_record(
            room_name=ctx.room.name,
            channel=call_info["channel"],
            duration=duration,
            user_turns=call_info["user_turns"],
            success=success,
            failure_reason=failure_reason,
        )

    # Start the session while the phone is still ringing so the models are warm
    # by the time somebody picks up.
    session_started = asyncio.create_task(
        session.start(
            agent=OutboundAgent(ctx, call_info=call_info),
            room=ctx.room,
            room_options=room_io.RoomOptions(
                audio_input=room_io.AudioInputOptions(
                    # BVCTelephony is tuned for the narrow frequency range of phone audio.
                    noise_cancellation=lambda params: (
                        noise_cancellation.BVCTelephony()
                        if params.participant.kind
                        == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                        else noise_cancellation.BVC()
                    ),
                ),
            ),
        )
    )

    logger.info("dialing %s", phone_number)
    try:
        # wait_until_answered means this returns once the call connects — if the
        # number is busy, declines, or never answers, it raises instead.
        await ctx.api.sip.create_sip_participant(
            api.CreateSIPParticipantRequest(
                room_name=ctx.room.name,
                sip_trunk_id=OUTBOUND_TRUNK_ID,
                sip_call_to=phone_number,
                participant_identity=CALLEE_IDENTITY,
                participant_name="Phone user",
                wait_until_answered=True,
            )
        )
    except api.TwirpError as e:
        logger.error(
            "call to %s was not answered: %s (%s)",
            phone_number,
            e.message,
            e.metadata.get("sip_status"),
        )
        session_started.cancel()
        ctx.shutdown()
        return

    await session_started

    # Speak first — they just picked up an unexpected call and won't say anything.
    await session.say(greeting, allow_interruptions=True)


if __name__ == "__main__":
    cli.run_app(server)
