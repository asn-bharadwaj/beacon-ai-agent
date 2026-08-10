import json
from unittest.mock import MagicMock

import pytest
from livekit.agents import RunContext

from agent import Assistant


@pytest.mark.asyncio
async def test_fetch_learning_exercise():
    assistant = Assistant()

    # Mock RunContext
    mock_context = MagicMock(spec=RunContext)

    # Trigger the tool call
    result_str = await assistant.fetch_learning_exercise(
        context=mock_context, category="science", level="beginner"
    )

    assert result_str is not None

    if "ERROR" in result_str:
        # Fallback handling path verified
        assert "live quiz database is currently unreachable" in result_str
    else:
        # Successful live API retrieval path verified
        result = json.loads(result_str)
        assert result["source"] == "Open Trivia Database Live API"
        assert "fetched_at" in result
        assert "question" in result
        assert "correct_answer" in result
        assert "choices" in result
        assert len(result["choices"]) > 0
