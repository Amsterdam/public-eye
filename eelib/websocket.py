import requests
from eelib.config import load

config = load()
base_url = config["backend"]["url"]
token = config["backend"]["token"]


def send_websocket_message(route, event_type, data):
    try:
        url = f"{base_url}/websocket/echo/{route}?tk={token}"
        body = {
            "event_type": event_type,
            "data": data
        }
        requests.post(url, json=body)
    except Exception as e:
        print("Exiting because of error:", repr(e))
