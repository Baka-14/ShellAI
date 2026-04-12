import base64, json, requests,os
from dotenv import load_dotenv


load_dotenv()

BEARER = os.getenv("Bearer_token")
CONVERSATION_ID = os.getenv("Conversation_id")
URL = f"https://terpai.umd.edu/api/internal/userConversations/{CONVERSATION_ID}/segments"

HEADERS = {
    "Authorization": f"Bearer {BEARER}",
    "Content-Type": "application/json",
    "Accept": "text/event-stream",
}

def ask(question: str, parent_segment_id: str) -> str:
    """Send a question, print the streamed reply, return the new segment ID to use as next parent."""
    payload = {
        "question": question,
        "visionImageIds": [],
        "attachmentIds": [],
        "segmentTraceLogLevel": "NonPersisted",
        "lineage": {"parentSegmentId": parent_segment_id, "lineageType": "Question"},
    }

    new_parent = None
    with requests.post(URL, headers=HEADERS, json=payload, stream=True) as resp:
        resp.raise_for_status()
        for raw in resp.iter_lines(decode_unicode=True):
            if not raw or not raw.startswith("data:"):
                continue
            data = raw[5:].strip()
            if not data:
                continue
            try:
                decoded = base64.b64decode(data, validate=True).decode("utf-8")
            except Exception:
                decoded = data
            try:
                obj = json.loads(decoded)
                # First chunk: metadata. Grab the segment ID for the assistant's reply.
                # Field name is likely 'id' or 'segmentId' — confirm on first run and adjust.
                # new_parent = obj.get("id") or obj.get("segmentId") or new_parent
                print(f"\n[meta] {obj}\n", flush=True)
            except json.JSONDecodeError:
                print(decoded, end="", flush=True)
                continue

            if isinstance(obj, dict):
                seg_id = obj.get("ConversationSegmentId") or obj.get("id") or obj.get("segmentId")
                if seg_id:
                    new_parent = seg_id

                continue

                # print(f"\n[meta] {obj}\n", flush=True)

            # else:
            print(obj, end="", flush=True)
        print()
    return new_parent


# Seed with the parent you captured from DevTools for this conversation
parent = "8888d674-51d3-4612-8008-7e0fd60a61d2"
parent = ask("Are you TerpAI? Answer in Yes/No?", parent)
