import json, time, threading, hmac, hashlib, requests
from urllib.parse import urlencode, quote
import asyncio
import websockets
from websocket import create_connection

def reset_global_values(symbol_list_temp = ["X","PNUT","SPX","HIPPO","CHILLGUY","RIFSOL","LUCE","MEMEFI","ZRC","CHEEMS","NEIROETH"]):
    global symbol_list, exchange_list, contract_amount, round_price, bal
    symbol_list = symbol_list_temp
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
    

reset_global_values()

SUBSCRIBED_CLIENTS = set()

class MexcClient:
    def __init__(self, access_key=None, secret_key=None):
        self.access_key = access_key
        self.secret_key = secret_key
        self.base_url_rest = "https://api.mexc.com"
        self.base_url_fu = "https://contract.mexc.com"
        self.spot_ws = None
        self.futures_ws = None
        self.listen_key = None
        self.keep_alive_threads = []

    def connect_spot(self):
        """Establish spot WebSocket connection"""
        try:
            self.listen_key = self.get_listen_key_me()
            if not self.listen_key:
                raise Exception("Failed to get listen key")

            self.spot_ws = create_connection(f"wss://wbs.mexc.com/ws?listenKey={self.listen_key}")
            
            # Subscribe to spot account updates
            subscribe_request = {
                "method": "SUBSCRIPTION",
                "params": ["spot@private.account.v3.api"]
            }
            self.spot_ws.send(json.dumps(subscribe_request))

            # Start keepalive thread
            keep_alive = threading.Thread(
                target=self.keep_alive_listen_me,
                daemon=True,
                name="spot_keepalive"
            )
            keep_alive.start()
            self.keep_alive_threads.append(keep_alive)

            return True
        except Exception as e:
            print(f"Error connecting to spot WebSocket: {e}")
            return False

    def connect_futures(self):
        """Establish futures WebSocket connection"""
        try:
            self.futures_ws = create_connection("wss://contract.mexc.com/edge")
            
            # Login to futures WebSocket
            timestamp = int(time.time() * 1000)
            str_to_sign = f"{self.access_key}{timestamp}"
            signature = hmac.new(
                self.secret_key.encode('utf-8'),
                str_to_sign.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()

            login_request = {
                "method": "login",
                "param": {
                    "apiKey": self.access_key,
                    "reqTime": timestamp,
                    "signature": signature
                }
            }
            self.futures_ws.send(json.dumps(login_request))

            # Start keepalive thread
            keep_alive = threading.Thread(
                target=self.keep_alive_futures,
                daemon=True,
                name="futures_keepalive"
            )
            keep_alive.start()
            self.keep_alive_threads.append(keep_alive)

            return True
        except Exception as e:
            print(f"Error connecting to futures WebSocket: {e}")
            return False

    def disconnect(self):
        """Properly disconnect from all WebSocket connections"""
        try:
            # Unsubscribe and close spot connection
            if self.spot_ws:
                try:
                    unsubscribe_request = {
                        "method": "UNSUBSCRIPTION",
                        "params": ["spot@private.account.v3.api"]
                    }
                    self.spot_ws.send(json.dumps(unsubscribe_request))
                    self.spot_ws.close()
                except:
                    pass
                self.spot_ws = None

            # Close futures connection
            if self.futures_ws:
                try:
                    self.futures_ws.close()
                except:
                    pass
                self.futures_ws = None

            # Stop keepalive threads
            for thread in self.keep_alive_threads:
                thread.join(timeout=1.0)
            self.keep_alive_threads.clear()

        except Exception as e:
            print(f"Error during disconnect: {e}")

    def update_credentials(self, access_key, secret_key, symbol_list_temp):
        """Update API credentials and restart connections"""
        print("Updating credentials and restarting connections...")
        
        # Disconnect existing connections
        self.disconnect()
        
        # Update credentials
        self.access_key = access_key
        self.secret_key = secret_key
        reset_global_values(symbol_list_temp)

        # Initialize data
        self.initialize_data()
        
        # Establish new connections
        spot_success = self.connect_spot()
        futures_success = self.connect_futures()
        
        if not (spot_success and futures_success):
            raise Exception("Failed to establish all WebSocket connections")

    def initialize_data(self):
        """Initialize all data with new credentials"""
        print("Initializing data with new credentials...")
        get_contract_amount_me()
        self.update_account_me()
        self.update_account_me_fu()
        self.get_position_me()
        
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
            # print(response, "from get_account_me")
            for item in response["balances"]:
                symbol = item["asset"]
                bal["Mexc"]["spot"][symbol] = float(item["free"])
        except Exception as e:
            print("Have error in get_account_me:", e)

    def keep_alive_futures(self):
        """Keep alive for futures WebSocket"""
        while self.futures_ws:
            try:
                ping = {"method": "ping"}
                self.futures_ws.send(json.dumps(ping))
                time.sleep(10)
            except:
                break

    def keep_alive_listen_me(self):
        """Keep alive for spot WebSocket"""
        ping_counter = 0
        renew_counter = 0
        
        while self.spot_ws and self.listen_key:
            try:
                if ping_counter >= 25:
                    ping_counter = 0
                    renew_counter += 1
                    
                    ping = {"method": "PING"}
                    self.spot_ws.send(json.dumps(ping))
                    
                    if renew_counter >= 100:
                        self.renew_listen_key_me(self.listen_key)
                        renew_counter = 0
                        
                ping_counter += 1
                time.sleep(1)
            except:
                break

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
            # print(response, "from get_account_me_fu")
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
            # print(response, "from get_listen_key_me")
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

class WebSocketHandler:
    def __init__(self, mexc_client):
        self.mexc_client = mexc_client
        self.subscribed_clients = set()
    
    async def __call__(self, websocket):
        is_subscribed = False
        try:
            print(f"New connection from {websocket.remote_address}")
            async for message in websocket:
                try:
                    data = json.loads(message)
                    print(f"Received message from {websocket.remote_address}: {data}")
                    
                    if data.get("type") == "get_symbols":
                        print("get_symbols from client")
                        await websocket.send(json.dumps({
                            "type": "list_symbols",
                            "data": symbol_list
                        }))


                    if data.get("type") == "update_symbols":
                        symbols = data.get("data", {}).get("symbols", [])
                        print(symbols, "from update_symbols")
                        if symbols:
                            self.mexc_client.update_credentials(self.mexc_client.access_key, self.mexc_client.secret_key, symbols)
                            await websocket.send(json.dumps({
                                "type": "symbols_update_response",
                                "status": "success",
                                "message": "Symbol list updated successfully"
                            }))

                        else:
                            await websocket.send(json.dumps({
                                "type": "symbols_update_response",
                                "status": "error",
                                "message": "Invalid symbol list provided"
                            }))


                    if data.get("type") == "api_credentials":
                        credentials = data.get("data", {})
                        access_key = credentials.get("access_key")
                        secret_key = credentials.get("secret_key")
                        if access_key and secret_key:
                            try:
                                # This will disconnect existing ws and re-init with new creds
                                self.mexc_client.update_credentials(access_key, secret_key, symbol_list)
                                await websocket.send(json.dumps({
                                    "type": "api_credentials_response",
                                    "status": "success",
                                    "message": "API credentials updated successfully"
                                }))
                            except Exception as e:
                                await websocket.send(json.dumps({
                                    "type": "api_credentials_response",
                                    "status": "error",
                                    "message": f"Failed to update credentials: {str(e)}"
                                }))
                        else:
                            await websocket.send(json.dumps({
                                "type": "api_credentials_response",
                                "status": "error",
                                "message": "Invalid credentials provided"
                            }))
                
                    elif data.get("type") == "subscribe":
                        self.subscribed_clients.add(websocket)
                        is_subscribed = True
                        print(f"Client {websocket.remote_address} subscribed.")
                        
                    elif data.get("type") == "unsubscribe":
                        if websocket in self.subscribed_clients:
                            self.subscribed_clients.remove(websocket)
                            is_subscribed = False
                            print(f"Client {websocket.remote_address} unsubscribed.")
                            
                except json.JSONDecodeError:
                    print(f"Failed to decode JSON message from {websocket.remote_address}: {message}")
                except Exception as e:
                    print(f"Error processing message from {websocket.remote_address}: {e}")
        except websockets.exceptions.ConnectionClosed as e:
            print(f"Connection closed for {websocket.remote_address}: {e}")
        finally:
            if is_subscribed and websocket in self.subscribed_clients:
                self.subscribed_clients.remove(websocket)

    async def broadcast_data(self, data):
        message = json.dumps(data)
        closed_clients = set()
        try:
            await asyncio.gather(
                *[client.send(message) for client in self.subscribed_clients],
                return_exceptions=True
            )
            closed_clients = {client for client in self.subscribed_clients if client.state == websockets.protocol.State.CLOSED}
            self.subscribed_clients.difference_update(closed_clients)
            if closed_clients:
                print(f"Closed {len(closed_clients)} clients")
        except websockets.exceptions.ConnectionClosed as e:
            closed_clients.add(e.client_address)



def convert_output():
    output_dict = {
        "type": "position_data",  # Add message type
        "data": {}
    }
    for symbol in symbol_list:
        bal_on_s = bal["Mexc"]["spot"].get(symbol, 0)
        long_pos = bal["Mexc_fu"]["long"].get(symbol, 0)
        short_pos = - bal["Mexc_fu"]["short"].get(symbol, 0)
        output_dict["data"][symbol] = {
            "spot": round(bal_on_s, 2),
            "long": round(long_pos, 2),
            "short": round(short_pos, 2),
            "total": bal_on_s + long_pos + short_pos
        }
    return output_dict

async def handle_spot_messages(mexc_client, websocket_handler):
    print("start handle_spot_messages")
    while mexc_client.spot_ws:
        try:
            # Using asyncio.to_thread to avoid blocking the event loop with a blocking recv
            data_str = await asyncio.to_thread(mexc_client.spot_ws.recv)
            data = json.loads(data_str)
            # print(data, "from spot")
            if "d" in data:
                symbol = data['d']["a"]
                bal["Mexc"]["spot"][symbol] = float(data["d"]["f"])
                await websocket_handler.broadcast_data(convert_output())
        except Exception as e:
            print(f"Error handling spot message: {e}")
            break

async def handle_futures_messages(mexc_client, websocket_handler):
    print("start handle_futures_messages")
    while mexc_client.futures_ws:
        try:
            response_str = await asyncio.to_thread(mexc_client.futures_ws.recv)
            response = json.loads(response_str)
            # print(response, "from futures")
            channel = response.get("channel")
            data = response.get("data")
            
            if channel == "push.personal.position" and data:
                symbol = data['symbol'][:-5]
                if symbol in symbol_list:
                    if data["positionType"] == 2:
                        bal["Mexc_fu"]["short"][symbol] = data["holdVol"] * contract_amount.get(symbol, 0)
                    else:
                        bal["Mexc_fu"]["long"][symbol] = data["holdVol"] * contract_amount.get(symbol, 0)
            if channel == "push.personal.asset" and data:
                symbol = data["currency"]
                bal["Mexc_fu"]["spot"][symbol] = data["availableBalance"]
            await websocket_handler.broadcast_data(convert_output())
        except Exception as e:
            print(f"Error handling futures message: {e}")
            break

async def main():
    # Initialize the MexcClient and WebSocketHandler with initial credentials
    mexc_client = MexcClient(access_key="mx0vglmdvKZX80cPb5", secret_key="5bdb509b08074dcb8cee375ca1e0951c")
    mexc_client.update_credentials(mexc_client.access_key, mexc_client.secret_key, symbol_list)  # Initialize connections

    websocket_handler = WebSocketHandler(mexc_client)
    
    # Start WebSocket server
    server = await websockets.serve(websocket_handler, "0.0.0.0", 6547)
    print("WebSocket server started on ws://0.0.0.0:6547")

    async def start_message_handlers():
        while True:
            try:
                # Re-create tasks after credentials update or disconnect
                spot_task = asyncio.create_task(handle_spot_messages(mexc_client, websocket_handler))
                futures_task = asyncio.create_task(handle_futures_messages(mexc_client, websocket_handler))

                # Wait for either task to complete (error or disconnect)
                done, pending = await asyncio.wait(
                    [spot_task, futures_task],
                    return_when=asyncio.FIRST_COMPLETED
                )

                # Cancel any pending tasks since one completed prematurely
                for task in pending:
                    task.cancel()

                # Sleep before retrying to give time for reconnection if needed
                await asyncio.sleep(5)

            except Exception as e:
                print(f"Error in message handlers: {e}")
                await asyncio.sleep(5)

    # Run message handlers in the background
    message_handler_task = asyncio.create_task(start_message_handlers())

    try:
        # Keep the server and handlers running forever
        await asyncio.Future()
    except KeyboardInterrupt:
        print("\nShutting down gracefully...")
    finally:
        # Cleanup on exit
        message_handler_task.cancel()
        mexc_client.disconnect()
        server.close()
        await server.wait_closed()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutting down gracefully...")
    except Exception as e:
        print(f"Fatal error: {e}")
