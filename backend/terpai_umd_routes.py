"""
Proxy TerpAI (terpai.umd.edu) chat turns — same HTTP flow as
backend_example/terpai_chat.stream_chat / terpai_ask.py.

Send the user's Nebula JWT in the Authorization header (not in JSON body).

**Parent segment auto-tracking:** After the first message (where you must send
`parent_segment_id`), you may omit `parent_segment_id` on later requests for the
same `conversation_id` and Bearer — the server keeps the last
`next_parent_segment_id` and Cosmos session headers, matching the terpai_chat REPL.

State is **in-memory only** (lost on process restart); not for multi-instance production
without Redis etc.
"""

from __future__ import annotations

import hashlib
import sys
import threading
from pathlib import Path
from typing import Annotated

import requests
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

_BACKEND_EXAMPLE = Path(__file__).resolve().parent.parent / "backend_example"
if str(_BACKEND_EXAMPLE) not in sys.path:
    sys.path.insert(0, str(_BACKEND_EXAMPLE))

from terpai_chat import DEFAULT_BASE, _ssl_verify_arg, stream_chat  # noqa: E402

router = APIRouter(prefix="/api/terpai", tags=["terpai-umd"])

_lock = threading.Lock()
# key -> {"parent_segment_id": str, "cosmos": dict[str, str]}
_session: dict[str, dict] = {}


def _session_key(conversation_id: str, bearer: str) -> str:
    h = hashlib.sha256(bearer.encode("utf-8")).hexdigest()[:24]
    return f"{conversation_id.strip()}:{h}"


def _get_session(key: str) -> dict | None:
    with _lock:
        return _session.get(key)


def _put_session(key: str, parent_segment_id: str, cosmos: dict[str, str]) -> None:
    with _lock:
        _session[key] = {
            "parent_segment_id": parent_segment_id,
            "cosmos": dict(cosmos),
        }


def _delete_session(key: str) -> None:
    with _lock:
        _session.pop(key, None)


class TerpaiAskBody(BaseModel):
    """One user turn in an existing conversation."""

    message: str = Field(..., min_length=1, max_length=32000)
    conversation_id: str = Field(..., min_length=1, max_length=80)
    parent_segment_id: str | None = Field(
        default=None,
        description="Required when there is no saved chain yet. Omit on follow-ups to use server-stored parent; Cosmos headers from the last reply are still applied when you pass an explicit parent.",
    )
    base_url: str | None = Field(
        default=None,
        description="Leave empty for https://terpai.umd.edu. Do not send the literal word 'string'.",
        json_schema_extra={"examples": [None]},
    )
    insecure_ssl: bool = Field(
        default=False,
        description="If true, skip TLS verification (dev only; same as terpai_ask.py --insecure-ssl).",
    )
    clear_stored_chain: bool = Field(
        default=False,
        description="If true, forget saved parent/cosmos for this conversation+token before handling (then parent_segment_id is required).",
    )


class TerpaiAskResponse(BaseModel):
    reply: str
    next_parent_segment_id: str | None = None
    parent_from_server_state: bool = Field(
        default=False,
        description="True when parent_segment_id was omitted and the server used stored state.",
    )


def _bearer_from_authorization_header(authorization: str | None) -> str:
    """
    Swagger UI lists this as **Parameters → authorization** on POST /ask (copy full
    `Bearer eyJ...` from DevTools). Accept `Bearer <jwt>` or raw JWT.
    """
    if not authorization or not str(authorization).strip():
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization header. In /docs → Try it out, fill **authorization** "
            "with `Bearer <JWT>` from terpai.umd.edu Network tab.",
        )
    auth = str(authorization).strip()
    if auth.lower().startswith("bearer "):
        token = auth[7:].strip()
    else:
        token = auth
    if not token:
        raise HTTPException(status_code=401, detail="Empty Bearer token")
    return token


def _verify(body: TerpaiAskBody):
    if body.insecure_ssl:
        import urllib3

        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        return False
    return _ssl_verify_arg()


def _resolve_parent_and_cosmos(
    body: TerpaiAskBody,
    bearer: str,
) -> tuple[str, dict[str, str] | None, bool]:
    """
    Returns (parent_segment_id, cosmos_headers, parent_from_server_state).

    If client sends parent_segment_id: use it; forward stored Cosmos headers when we
    have them (matches terpai_chat REPL). If parent_segment_id is omitted: use stored
    parent + cosmos from the last response for this conv+token.
    """
    key = _session_key(body.conversation_id, bearer)
    if body.clear_stored_chain:
        _delete_session(key)

    st = _get_session(key)
    cosmos_stored: dict[str, str] = (st.get("cosmos") if st else None) or {}
    cosmos_opt = cosmos_stored if cosmos_stored else None

    explicit = (body.parent_segment_id or "").strip()
    if explicit:
        return explicit, cosmos_opt, False

    if not st or not st.get("parent_segment_id"):
        raise HTTPException(
            status_code=400,
            detail="Send parent_segment_id for the first message, or after clear_stored_chain=true. "
            "Later messages may omit it to reuse the server-stored parent and Cosmos headers.",
        )
    inner = st.get("cosmos") or {}
    return st["parent_segment_id"], (inner if inner else None), True


@router.post("/ask", response_model=TerpaiAskResponse)
def post_terpai_ask(
    body: TerpaiAskBody,
    authorization: Annotated[
        str,
        Header(
            description="Required. Paste full header value from the browser: `Bearer eyJ...`",
        ),
    ],
) -> TerpaiAskResponse:
    """
    POST a message to TerpAI using the same segments API as the website.

    - **authorization** header (shown under **Parameters** in Swagger): `Bearer <JWT>`.
    - **parent_segment_id**: segment to attach this question under. Omit on follow-ups
      when the server already has a chain for this `conversation_id` + token; it will
      use the last **next_parent_segment_id** and Cosmos headers from the previous reply.
    """
    bearer = _bearer_from_authorization_header(authorization)
    raw_base = (body.base_url or "").strip()
    if not raw_base or raw_base.lower() == "string":
        base = DEFAULT_BASE.rstrip("/")
    else:
        base = raw_base.rstrip("/")
    verify = _verify(body)

    parent, cosmos_headers, from_state = _resolve_parent_and_cosmos(body, bearer)

    try:
        reply, new_seg, next_cosmos = stream_chat(
            body.message,
            bearer=bearer,
            conversation_id=body.conversation_id.strip(),
            parent_segment_id=parent,
            base_url=base,
            cosmos_headers=cosmos_headers,
            verify=verify,
        )
    except requests.HTTPError as e:
        status = e.response.status_code if e.response is not None else 502
        text = (e.response.text if e.response is not None else "")[:800]
        if status == 401:
            raise HTTPException(
                status_code=401,
                detail="TerpAI rejected the JWT (expired or invalid). Paste a fresh Bearer from the site.",
            ) from e
        raise HTTPException(status_code=status, detail=text or str(e)) from e
    except requests.RequestException as e:
        err = str(e)
        if "CERTIFICATE_VERIFY_FAILED" in err:
            raise HTTPException(
                status_code=502,
                detail="TLS verification failed. Set insecure_ssl=true on this request, "
                "or fix Python certs (certifi / Install Certificates.command), "
                "or set TERPAI_SSL_VERIFY=0 in env for dev.",
            ) from e
        raise HTTPException(status_code=502, detail=err) from e

    key = _session_key(body.conversation_id, bearer)
    if new_seg:
        _put_session(key, new_seg, next_cosmos)
    elif next_cosmos:
        st = _get_session(key)
        if st and st.get("parent_segment_id"):
            _put_session(key, st["parent_segment_id"], next_cosmos)

    return TerpaiAskResponse(
        reply=reply or "",
        next_parent_segment_id=new_seg,
        parent_from_server_state=from_state,
    )


@router.delete("/session/{conversation_id}")
def delete_terpai_session(
    conversation_id: str,
    authorization: Annotated[
        str,
        Header(description="Bearer JWT from terpai.umd.edu"),
    ],
) -> dict:
    """Drop stored parent/cosmos for this conversation and Bearer (e.g. before a new branch)."""
    bearer = _bearer_from_authorization_header(authorization)
    key = _session_key(conversation_id, bearer)
    _delete_session(key)
    return {"ok": True, "cleared": True}
