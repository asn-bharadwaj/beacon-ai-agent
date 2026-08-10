import json
from unittest.mock import MagicMock

import pytest
from livekit.agents import RunContext

from agent import Assistant


@pytest.mark.asyncio
async def test_fetch_live_news():
    assistant = Assistant()

    # Mock RunContext
    mock_context = MagicMock(spec=RunContext)

    # Trigger the tool call
    result_str = await assistant.fetch_live_news(
        context=mock_context, category="science"
    )

    assert result_str is not None

    if "ERROR" in result_str:
        # Fallback handling path verified
        assert "live news feed is currently unreachable" in result_str
    else:
        # Successful RSS parsing path verified
        result = json.loads(result_str)
        assert result["source"] == "BBC News RSS Live Feed"
        assert "fetched_at" in result
        assert "articles" in result
        assert len(result["articles"]) > 0
        first_article = result["articles"][0]
        assert "title" in first_article
        assert "pub_date" in first_article
        assert "summary" in first_article
