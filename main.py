import json, time, threading, hmac, hashlib, requests
from urllib.parse import urlencode, quote
import asyncio
import websockets
from websocket import create_connection


mexc_access_key = "mx0vglmdvKZX80cPb5"
mexc_key_secret = "5bdb509b08074dcb8cee375ca1e0951c"
mexc_base_url_rest = "https://api.mexc.com"
mex_base_url_fu = "https://contract.mexc.com"

symbol_list = ["X","PNUT","SPX","HIPPO","CHILLGUY","RIFSOL","LUCE","MEMEFI","ZRC","CHEEMS","NEIROETH"]
exchange_list = ["Mexc","Mexc_fu"]
contract_amount = dict()
round_price = dict()
bal = dict()
for exchange in exchange_list:
    bal[exchange] = dict()
    bal[exchange]["spot"] = dict()
    bal[exchange]["long"] = dict()
    bal[exchange]["short"] = dict()
    for symbol in symbol_list:
        bal[exchange]["spot"][symbol] = 0
        bal[exchange]["long"][symbol] = 0
        bal[exchange]["short"][symbol] = 0

SUBSCRIBED_CLIENTS = set()

async def handler(websocket, path):
    """
    Handles incoming WebSocket connections and messages.
    """
    is_subscribed = False
    try:
        print(f"New connection from {websocket.remote_address}")
        async for message in websocket:
            try:
                data = json.loads(message)
                print(f"Received message from {websocket.remote_address}: {data}")
                if data.get("type") == "subscribe":
                    SUBSCRIBED_CLIENTS.add(websocket)
                    is_subscribed = True
                    print(f"Client {websocket.remote_address} subscribed.")
                elif data.get("type") == "unsubscribe":
                    if websocket in SUBSCRIBED_CLIENTS:
                        SUBSCRIBED_CLIENTS.remove(websocket)
                        is_subscribed = False
                        print(f"Client {websocket.remote_address} unsubscribed.")
                else:
                    print(f"Unknown message type from {websocket.remote_address}: {data.get('type')}")
            except json.JSONDecodeError:
                print(f"Failed to decode JSON message from {websocket.remote_address}: {message}")
            except Exception as e:
                print(f"Error processing message from {websocket.remote_address}: {e}")
    except websockets.exceptions.ConnectionClosed as e:
        print(f"Connection closed for {websocket.remote_address}: {e}")
    except Exception as e:
        print(f"Unexpected error with {websocket.remote_address}: {e}")
    finally:
        if is_subscribed and websocket in SUBSCRIBED_CLIENTS:
            SUBSCRIBED_CLIENTS.remove(websocket)
            print(f"Client {websocket.remote_address} removed from subscribers.")


async def broadcast_data(data):
    # Broadcast given data once to all subscribed clients
    message = json.dumps(data)
    if SUBSCRIBED_CLIENTS:
        print(f"Broadcasting: {message}")
    await asyncio.gather(
        *[client.send(message) for client in SUBSCRIBED_CLIENTS if not client.closed]
    )

def count_trailing_zeros(string_number):
    string_number = string_number.rstrip('0')
    decimal_index = string_number.find('.')
    if decimal_index == -1:
        return 0
    zeros_count = len(string_number) - decimal_index - 1
    return max(0, zeros_count)

def get_contract_amount_me():
    try:
        url = "https://contract.mexc.com/api/v1/contract/detail"
        response = requests.get(url).json()
        for item in response["data"]:
            symbol = item["symbol"][:-5]
            if symbol in symbol_list and item['quoteCoin'] == "USDT":
                contract_amount[symbol] = item["contractSize"]
                round_price[symbol] = count_trailing_zeros(str(item["priceUnit"]))
    except Exception as e:
        print("Have error in get_contract_amount:", e)

def get_position_me():
    url = mex_base_url_fu + "/api/v1/private/position/open_positions"
    params = ""
    timestamp = str(int(time.time() * 1000))
    symbol_to_sign = mexc_access_key + timestamp + params
    signature = hmac.new(mexc_key_secret.encode('utf-8'), symbol_to_sign.encode('utf-8'), hashlib.sha256).hexdigest()
    headers = {
        "ApiKey": mexc_access_key,
        "Request-Time": timestamp,
        "Content-Type" : "Application/JSON",
        "Signature" : signature
    }
    try:
        response = requests.get(url, headers=headers).json()
        for item in response["data"]:
            symbol = item["symbol"][:-5]
            if symbol in symbol_list:
                if item["positionType"] == 2:
                    bal["Mexc_fu"]["short"][symbol] = item["holdVol"] * contract_amount[symbol]
                else:
                    bal["Mexc_fu"]["long"][symbol] = item["holdVol"] * contract_amount[symbol]
    except Exception as e:
        print("Have error in get_position_me:",e)

def update_account_me():
    url = mexc_base_url_rest + "/api/v3/account"
    timestamp = str(int(time.time() * 1000))
    symbol_to_sign = "timestamp=" + timestamp
    signature = hmac.new(mexc_key_secret.encode('utf-8'), symbol_to_sign.encode('utf-8'), hashlib.sha256).hexdigest()
    headers = {
        "X-MEXC-APIKEY": mexc_access_key
    }
    url_all = url + "?" + symbol_to_sign + "&signature=" + str(signature)
    try:
        response = requests.get(url_all,headers=headers).json()
        for item in response["balances"]:
            symbol = item["asset"]
            bal["Mexc"]["spot"][symbol] = float(item["free"])
    except Exception as e:
        print("Have error in get_account_me")
        print(e)

def update_account_me_fu():
    url = mex_base_url_fu + "/api/v1/private/account/assets"
    params = ""
    timestamp = str(int(time.time() * 1000))
    symbol_to_sign = mexc_access_key + timestamp + params
    signature = hmac.new(mexc_key_secret.encode('utf-8'), symbol_to_sign.encode('utf-8'), hashlib.sha256).hexdigest()
    headers = {
        "ApiKey": mexc_access_key,
        "Request-Time": timestamp,
        "Content-Type" : "Application/JSON",
        "Signature" : signature
    }
    try:
        response = requests.get(url, headers=headers).json()
        for item in response["data"]:
            if item["currency"] == "USDT":
                bal["Mexc_fu"]["spot"]["USDT"] = item["availableBalance"]
    except Exception as e:
        print("Have error in get_account_me_fu:",e)

def renew_listen_key_me(key):
    url = mexc_base_url_rest + "/api/v3/userDataStream"
    timestamp = str(int(time.time() * 1000))
    params = {
        "listenKey":key,
        "timestamp": timestamp
    }
    symbol_to_sign = urlencode(params, quote_via=quote)
    signature = hmac.new(mexc_key_secret.encode('utf-8'), symbol_to_sign.encode('utf-8'), hashlib.sha256).hexdigest()
    url_all = url + "?" + symbol_to_sign + "&signature=" + str(signature)
    headers = {
        "X-MEXC-APIKEY": mexc_access_key
    }
    try:
        response = requests.put(url_all, headers=headers).json()
        return response
    except Exception as e:
        print("Have error in renew listen key MEXC",e)
        return 0

def keep_alive_mexc_fu(ws):
    while True:
        try:
            ping = {"method":"ping"}
            ws.send(json.dumps(ping))
            time.sleep(10)
        except:
            return 0

def get_listen_key_me():
    url = mexc_base_url_rest + "/api/v3/userDataStream"
    timestamp = str(int(time.time() * 1000))
    symbol_to_sign = f"recvWindow=5000&timestamp={timestamp}"
    signature = hmac.new(mexc_key_secret.encode('utf-8'), symbol_to_sign.encode('utf-8'), hashlib.sha256).hexdigest()
    headers = {
        "X-MEXC-APIKEY": mexc_access_key
    }
    url_all = url + "?" + symbol_to_sign + "&signature=" + str(signature)
    try:
        response = requests.post(url_all,headers=headers).json()
        return response["listenKey"]
    except Exception as e:
        print("Have error in place_order_me")
        print(e)
        return 0

def keep_alive_listen_me(ws, listen_key):
    i = 0
    j = 0
    while True:
        try:
            if i == 25:
                j += 1
                i = 0
                ping = {"method": "PING"}
                ws.send(json.dumps(ping))
                if j == 100:
                    renew_listen_key_me(listen_key)
                    j = 0
            i += 1
            time.sleep(1)
        except:
            print("keep_alive_listen_me kill itself when listen thread have close and open new")
            return 0

def get_info_wss_me():
    while True:
        listen_key = get_listen_key_me()
        try:
            ws = create_connection("wss://wbs.mexc.com/ws?listenKey=" + listen_key)
            request = {
                "method": "SUBSCRIPTION",
                "params": [
                    "spot@private.account.v3.api"
                ]
            }
            ws.send(json.dumps(request))
            k_t = threading.Thread(target=keep_alive_listen_me, args=(ws,listen_key), daemon=True)
            k_t.start()
            while True:
                data = json.loads(ws.recv())
                if "d" in data:
                    symbol = data['d']["a"]
                    bal["Mexc"]["spot"][symbol] = float(data["d"]["f"])
        except Exception as e:
            print("Have error in linstening Account Mexc: ",e)
            update_account_me()
            try:
                ws.close()
            except:
                pass
            time.sleep(1)

def get_infor_wss_me_fu():
    while True:
        try:
            ws = create_connection("wss://contract.mexc.com/edge")
            kl = threading.Thread(target=keep_alive_mexc_fu, args=(ws,),daemon=True)
            kl.start()
            timestamp = int(time.time()*1000)
            str_to_sign = mexc_access_key + str(timestamp)
            signature =  hmac.new(mexc_key_secret.encode('utf-8'), str_to_sign.encode('utf-8'), hashlib.sha256).hexdigest()
            request = {
                "method":"login",
                "param":{
                    "apiKey": mexc_access_key,
                    "reqTime": timestamp,
                    "signature": signature
                }
            }
            ws.send(json.dumps(request))
            while True:
                response = json.loads(ws.recv())
                channel = response.get("channel")
                data = response.get("data")
                if channel == "push.personal.position" and data is not None:
                    symbol = data['symbol'][:-5]
                    if symbol in symbol_list:
                        if data["positionType"] == 2:
                            bal["Mexc_fu"]["short"][symbol] = data["holdVol"] * contract_amount.get(symbol, 0)
                        else:
                            bal["Mexc_fu"]["long"][symbol] = data["holdVol"] * contract_amount.get(symbol, 0)
                if channel == "push.personal.asset" and data is not None:
                    symbol = data["currency"]
                    bal["Mexc_fu"]["spot"][symbol] = data["availableBalance"]
        except Exception as e:
            print("Have error in get_infor_wss_me_fu",e)
            time.sleep(10)

async def main():
    # Start the WebSocket server
    server = await websockets.serve(handler, "0.0.0.0", 6547)  # Make sure port matches frontend
    
    # Keep the server running and broadcast data
    async with server:
        while True:
            output_dict = {}
            for symbol in symbol_list:
                bal_on_s = bal["Mexc"]["spot"].get(symbol, 0)
                long_pos = bal["Mexc_fu"]["long"].get(symbol, 0)
                short_pos = -bal["Mexc_fu"]["short"].get(symbol, 0)
                output_dict[symbol] = {
                    "spot": round(bal_on_s, 2),
                    "long": round(long_pos, 2),
                    "short": round(short_pos, 2),
                    "total": bal_on_s + long_pos + short_pos
                }

            # Broadcast to subscribed clients
            print(output_dict)
            await broadcast_data(output_dict)
            await asyncio.sleep(5)

if __name__ == "__main__":
    # Initial data fetches
    get_contract_amount_me()
    update_account_me()
    update_account_me_fu()
    get_position_me()

    # Start background threads to keep data updated
    threading.Thread(target=get_infor_wss_me_fu, daemon=True).start()
    threading.Thread(target=get_info_wss_me, daemon=True).start()

    # Run the main event loop (WebSocket server + broadcasting)
    asyncio.run(main())
