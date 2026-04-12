
import base64, json, requests

BEARER = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImtTQTY0dEFUMEx3RERELTdXbG5VRU1TQXBULXR2dl94WUtWc0lHNW1nR1kiLCJ0eXAiOiJKV1QifQ.eyJ1cG4iOiIyMzBkNjQ0OC1kMWM3LTRhZWQtOWUzMS04YTkyOGIxMTJhYzYiLCJpcCI6IkVudHJhSWQiLCJlbWFpbCI6ImFrYWJyYTE5QHVtZC5lZHUiLCJ1dm8iOnsiaWQiOiIyMzBkNjQ0OC1kMWM3LTRhZWQtOWUzMS04YTkyOGIxMTJhYzYiLCJuIjoiQWFkZXNoIEthYnJhIn0sInVyIjpbXSwiY2FwIjpbImE3OWJlMjEzLTEwYWUtNDFhNy1iY2ZmLTk3ZDJiNmJhNzA2OSIsImZmMjllMzhjLWVlNzYtNDM2Zi1iMTU0LTAzMmE3MjU2MmQxMCJdLCJ2IjoiMi4yNjA1LjQ0NzIuMCIsIm5iZiI6MTc3NTkyOTQwNywiZXhwIjoxNzc1OTMxMjA3LCJpYXQiOjE3NzU5Mjk0MDcsImlzcyI6Imh0dHBzOi8vbmVidWxhb25lLmFpIiwiYXVkIjoiTmVidWxhT25lIn0.S1gReuoUIdBrei5JOIBnXdx9SWOWkYZeKaJUoy6pKrV8lPnaLZPNeU3vavW6T_wiiih10XVx-PG9xEGPwuBRPRxmsyexQnaEPfNw5-dX7JvGidD6n-I6-SR34d5K4DDwtjS3cr1A_ecxGb5ZOI-X9wj1u8f8tFpzjVebkdLwlN5ks-Z9IkNzFgwYR6eHPDv6TI6lZK3J16NSjmwZYyCC59st76Or5VH3YPdEuNDC3jucYIXJ4IwX2TUOReYU8HWvZ7BNzyyt9gOES_blyf4XS5aRtKrby6I1nraYuB6aBYx8wx7ZJow5WFU-yHpWEv3DWKYT8yKcTiU3bTCZN0Eynw"
CONVERSATION_ID = "5c3a63d8-983e-856d-3e31-b370e8cf68e9"
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
# parent = ask("What can you help me with?", parent)
# parent = ask("Summarize what we just computed.", parent)

# 