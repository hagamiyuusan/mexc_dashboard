import json, time, threading, hmac, hashlib, requests
from urllib.parse import urlencode, quote
import asyncio
import websockets
from websocket import create_connection

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

class MexcClient:
    def __init__(self, access_key=None, secret_key=None):
        self.access_key = access_key
        self.secret_key = secret_key
        self.base_url_rest = "https://api.mexc.com"
        self.base_url_fu = "https://contract.mexc.com"
        self.ws_connections = []
        
    def update_credentials(self, access_key, secret_key):
        """Update API credentials and restart connections"""
        self.access_key = access_key
        self.secret_key = secret_key
        # Close existing WebSocket connections to force reconnect
        for ws in self.ws_connections:
            try:
                ws.close()
            except:
                pass
        self.ws_connections = []

    def get_position_me(self):
        url = self.base_url_fu + "/api/v1/private/position/open_positions"
        params = ""
        timestamp = str(int(time.time() * 1000))
        symbol_to_sign = self.access_key + timestamp + params
        signature = hmac.new(self.secret_key.encode('utf-8'), 
                           symbol_to_sign.encode('utf-8'), 
                           hashlib.sha256).hexdigest()
        headers = {
            "ApiKey": self.access_key,
            "Request-Time": timestamp,
            "Content-Type": "Application/JSON",
            "Signature": signature
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
            print("Have error in get_position_me:", e)

    def update_account_me(self):
        url = self.base_url_rest + "/api/v3/account"
        timestamp = str(int(time.time() * 1000))
        symbol_to_sign = "timestamp=" + timestamp
        signature = hmac.new(self.secret_key.encode('utf-8'), 
                           symbol_to_sign.encode('utf-8'), 
                           hashlib.sha256).hexdigest()
        headers = {
            "X-MEXC-APIKEY": self.access_key
        }
        url_all = url + "?" + symbol_to_sign + "&signature=" + str(signature)
        try:
            response = requests.get(url_all, headers=headers).json()
            for item in response["balances"]:
                symbol = item["asset"]
                bal["Mexc"]["spot"][symbol] = float(item["free"])
        except Exception as e:
            print("Have error in get_account_me:", e)

    def update_account_me_fu(self):
        url = self.base_url_fu + "/api/v1/private/account/assets"
        params = ""
        timestamp = str(int(time.time() * 1000))
        symbol_to_sign = self.access_key + timestamp + params
        signature = hmac.new(self.secret_key.encode('utf-8'), 
                           symbol_to_sign.encode('utf-8'), 
                           hashlib.sha256).hexdigest()
        headers = {
            "ApiKey": self.access_key,
            "Request-Time": timestamp,
            "Content-Type": "Application/JSON",
            "Signature": signature
        }
        try:
            response = requests.get(url, headers=headers).json()
            for item in response["data"]:
                if item["currency"] == "USDT":
                    bal["Mexc_fu"]["spot"]["USDT"] = item["availableBalance"]
        except Exception as e:
            print("Have error in get_account_me_fu:", e)

    def get_listen_key_me(self):
        url = self.base_url_rest + "/api/v3/userDataStream"
        timestamp = str(int(time.time() * 1000))
        symbol_to_sign = f"recvWindow=5000&timestamp={timestamp}"
        signature = hmac.new(self.secret_key.encode('utf-8'), 
                           symbol_to_sign.encode('utf-8'), 
                           hashlib.sha256).hexdigest()
        headers = {
            "X-MEXC-APIKEY": self.access_key
        }
        url_all = url + "?" + symbol_to_sign + "&signature=" + str(signature)
        try:
            response = requests.post(url_all, headers=headers).json()
            print(response, "from get_listen_key_me")
            return response["listenKey"]
        except Exception as e:
            print("Have error in get_listen_key_me:", e)
            return 0

    def renew_listen_key_me(self, key):
        url = self.base_url_rest + "/api/v3/userDataStream"
        timestamp = str(int(time.time() * 1000))
        params = {
            "listenKey": key,
            "timestamp": timestamp
        }
        symbol_to_sign = urlencode(params, quote_via=quote)
        signature = hmac.new(self.secret_key.encode('utf-8'), 
                           symbol_to_sign.encode('utf-8'), 
                           hashlib.sha256).hexdigest()
        url_all = url + "?" + symbol_to_sign + "&signature=" + str(signature)
        headers = {
            "X-MEXC-APIKEY": self.access_key
        }
        try:
            response = requests.put(url_all, headers=headers).json()
            return response
        except Exception as e:
            print("Have error in renew listen key MEXC", e)
            return 0

# Initialize global client
mexc_client = MexcClient()

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

def count_trailing_zeros(string_number):
    string_number = string_number.rstrip('0')
    decimal_index = string_number.find('.')
    if decimal_index == -1:
        return 0
    zeros_count = len(string_number) - decimal_index - 1
    return max(0, zeros_count)

def keep_alive_mexc_fu(ws):
    while True:
        try:
            ping = {"method": "ping"}
            ws.send(json.dumps(ping))
            time.sleep(10)
        except:
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
                    mexc_client.renew_listen_key_me(listen_key)
                    j = 0
            i += 1
            time.sleep(1)
        except:
            print("keep_alive_listen_me kill itself when listen thread have close and open new")
            return 0

def get_info_wss_me():
    while True:
        listen_key = mexc_client.get_listen_key_me()
        try:
            ws = create_connection("wss://wbs.mexc.com/ws?listenKey=" + str(listen_key))
            mexc_client.ws_connections.append(ws)
            request = {
                "method": "SUBSCRIPTION",
                "params": ["spot@private.account.v3.api"]
            }
            ws.send(json.dumps(request))
            k_t = threading.Thread(target=keep_alive_listen_me, args=(ws, listen_key), daemon=True)
            k_t.start()
            
            while True:
                data = json.loads(ws.recv())
                if "d" in data:
                    symbol = data['d']["a"]
                    bal["Mexc"]["spot"][symbol] = float(data["d"]["f"])
        except Exception as e:
            print("Have error in listening Account Mexc: ", e)
            mexc_client.update_account_me()
            try:
                ws.close()
                mexc_client.ws_connections.remove(ws)
            except:
                pass
            time.sleep(1)

def get_infor_wss_me_fu():
    while True:
        try:
            ws = create_connection("wss://contract.mexc.com/edge")
            mexc_client.ws_connections.append(ws)
            kl = threading.Thread(target=keep_alive_mexc_fu, args=(ws,), daemon=True)
            kl.start()
            timestamp = int(time.time()*1000)
            str_to_sign = mexc_client.access_key + str(timestamp)
            signature = hmac.new(mexc_client.secret_key.encode('utf-8'), 
                               str_to_sign.encode('utf-8'), 
                               hashlib.sha256).hexdigest()
            request = {
                "method": "login",
                "param": {
                    "apiKey": mexc_client.access_key,
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
            print("Have error in get_infor_wss_me_fu", e)
            try:
                ws.close()
                mexc_client.ws_connections.remove(ws)
            except:
                pass
            time.sleep(10)

def restart_websocket_listeners():
    """Restart WebSocket listener threads"""
    # Stop existing threads if any
    for thread in threading.enumerate():
        if thread.name in ["mexc_spot_ws", "mexc_futures_ws"]:
            thread.join(timeout=1.0)
    
    # Start new threads
    threading.Thread(
        target=get_infor_wss_me_fu, 
        daemon=True, 
        name="mexc_futures_ws"
    ).start()
    
    threading.Thread(
        target=get_info_wss_me, 
        daemon=True, 
        name="mexc_spot_ws"
    ).start()

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
                
                if data.get("type") == "api_credentials":
                    credentials = data.get("data", {})
                    access_key = credentials.get("access_key")
                    secret_key = credentials.get("secret_key")
                    
                    if access_key and secret_key:
                        # Update credentials and restart connections
                        mexc_client.update_credentials(access_key, secret_key)
                        
                        # Reinitialize data
                        get_contract_amount_me()
                        mexc_client.update_account_me()
                        mexc_client.update_account_me_fu()
                        mexc_client.get_position_me()
                        
                        # Restart WebSocket listeners
                        restart_websocket_listeners()
                        
                        await websocket.send(json.dumps({
                            "type": "api_credentials_response",
                            "status": "success"
                        }))
                    else:
                        await websocket.send(json.dumps({
                            "type": "api_credentials_response",
                            "status": "error",
                            "message": "Invalid credentials provided"
                        }))
                
                elif data.get("type") == "subscribe":
                    SUBSCRIBED_CLIENTS.add(websocket)
                    is_subscribed = True
                    print(f"Client {websocket.remote_address} subscribed.")
                    
                elif data.get("type") == "unsubscribe":
                    if websocket in SUBSCRIBED_CLIENTS:
                        SUBSCRIBED_CLIENTS.remove(websocket)
                        is_subscribed = False
                        print(f"Client {websocket.remote_address} unsubscribed.")
                        
            except json.JSONDecodeError:
                print(f"Failed to decode JSON message from {websocket.remote_address}: {message}")
            except Exception as e:
                print(f"Error processing message from {websocket.remote_address}: {e}")
    except websockets.exceptions.ConnectionClosed as e:
        print(f"Connection closed for {websocket.remote_address}: {e}")
    finally:
        if is_subscribed and websocket in SUBSCRIBED_CLIENTS:
            SUBSCRIBED_CLIENTS.remove(websocket)

async def broadcast_data(data):
    message = json.dumps(data)
    if SUBSCRIBED_CLIENTS:
        print(f"Broadcasting: {message}")
    await asyncio.gather(
        *[client.send(message) for client in SUBSCRIBED_CLIENTS if not client.closed]
    )

async def main():
    server = await websockets.serve(handler, "0.0.0.0", 6547)
    
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
            await broadcast_data(output_dict)
            await asyncio.sleep(5)

if __name__ == "__main__":
    # Initial setup with default or environment credentials
    mexc_client.update_credentials(
        access_key="mx0vglmdvKZX80cPb5",  # Default or env value
        secret_key="5bdb509b08074dcb8cee375ca1e0951c"  # Default or env value
    )
    
    # Initial data fetches
    get_contract_amount_me()
    mexc_client.update_account_me()
    mexc_client.update_account_me_fu()
    mexc_client.get_position_me()

    # Start background threads
    restart_websocket_listeners()

    # Run the main event loop
    asyncio.run(main())