/*
      DriverStationDashboard.cpp
      Created by: Anthony Scalise

      This library allows you to create and configure your
      Driver station dashboard. You can place virtual buttons,
      input fields for numbers and drop down selections, and
      displays for monitoring data.
*/

#include "WiFi.h"
#include "SPIFFS.h"
#include "ESPmDNS.h"
#include "Arduino.h"
#include "ArduinoJson.h"
#include "ESPAsyncWebServer.h"
#include "DriverStationDashboard.h"

///////////////////////////////////// ENABLE/DISABLE LOGS
//Toggle for verbose logs
#define VERBOSE_DRIVER_STATION_LOGS
//////////////////////////////////////////
#ifdef VERBOSE_DRIVER_STATION_LOGS
#define logPL(a) Serial.println(a);
#define logP(a) Serial.print(a);
#else
#define logP(a)
#define logPL(a)
#endif
//////////////////////////////////////////

static AsyncWebServer _server(80);           //Creates an asyncronomous webserver on port 80
static AsyncWebSocket _ws("/");              //Creates an asyncronomous web socket at subdomain "/"
static DriverStationDashboard *dashInstance; //Create a static pointer to dash instance for access from ws class

//Function used to do a software reset
//void(*resetFunc)(void)=0;

//Function to interact with the incoming websocket data
static void onWsEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len)
{
  //////////////////////////////////////////////////////////////////////////// On connected
  if (type == WS_EVT_CONNECT)
  { //If the websocket is connected
    logPL("---------------------------------------\n  Websocket client connection started\n---------------------------------------");
    //  Send intital data to configure the smart dashbord elements
    DynamicJsonDocument JSONBufferOut(5000); //Dynamicly created json document to hold the storage of the init config message
    //Pack json config for virtual buttons
    JsonArray VirtualButtons = JSONBufferOut.createNestedArray("vBtns"); //Json array to hold dash buttons
    for (int btn = 0; btn < dashInstance->getBtnCount(); btn++)
    {                                                                              //Iterate throught the dash button list
      JsonObject Button = VirtualButtons.createNestedObject();                     //Create button object in json button array
      Button["Id"] = dashInstance->getDashButtons(btn).btnName;                    //Add name for button
      JsonArray ButtonParams = Button.createNestedArray("Params");                 //Create an array for special button parameters
      ButtonParams.add((dashInstance->getDashButtons(btn).momentaryType) ? 1 : 0); //Add config selection for button momentary type
      ButtonParams.add((dashInstance->getDashButtons(btn).defaultState) ? 1 : 0);  //Add config selection for button default state
      ButtonParams.add(dashInstance->getDashButtons(btn).onText);                  //Add config for button on text
      ButtonParams.add(dashInstance->getDashButtons(btn).offText);                 //Add config for button off text
    }
    //Pack json config for virtual inputs
    JsonArray VirtualInputs = JSONBufferOut.createNestedArray("vInps"); //Json array to hold the dash inputs
    for (int inp = 0; inp < dashInstance->getInpCount(); inp++)
    {                                                         //Iterate through the dash inputs list
      JsonObject Input = VirtualInputs.createNestedObject();  //Create input object in json virtual input array
      Input["Id"] = dashInstance->getDashInputs(inp).inpName; //Set input name
    }
    //Pack json config for virtual displays
    JsonArray VirtualDisplays = JSONBufferOut.createNestedArray("vDisps");
    for (int disp = 0; disp < dashInstance->getDispCount(); disp++)
    {
      JsonObject Display = VirtualDisplays.createNestedObject();
      Display["Id"] = dashInstance->getDashDisplays(disp).dispName;
    }
    //Pack json config for virtual console
    JsonArray VirtualConsoles = JSONBufferOut.createNestedArray("vCons");
    for (int cons = 0; cons < dashInstance->getConsCount(); cons++)
    {
      JsonObject Console = VirtualConsoles.createNestedObject();
      Console["Id"] = dashInstance->getDashConsoles(cons).consName;
    }
    //Package the initial configuration message
    String initDataString;                        //String to hold the constrcted message
    serializeJson(JSONBufferOut, initDataString); //Serailze the json and put it in the created string
    client->text(initDataString);                 //Send the serialized json from the string back to client over websocket
    logPL("Sent json initilization message");
    dashInstance->setDashIsEnabled(true); //Set flag ennabled
  }
  ////////////////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////// On Disconnected
  else if (type == WS_EVT_DISCONNECT)
  { //If the websocket is not connected
    logPL("-----------------------\n  Client disconnected\n-----------------------");
    dashInstance->setDashIsEnabled(false); //Set flag disabled
    // resetFunc();
  }
  ////////////////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////// On Message Recived
  else if (type == WS_EVT_DATA)
  {
    //////////////////////////////////
    //// Parse incoming json data ////
    char incomingJsonData[len]; //Create char array for json data to be converted
    for (int i = 0; i < len; i++)
    {                                        //Parse through incoming data to print character by character
      incomingJsonData[i] = ((char)data[i]); //Set indexes of json data array
    }
    StaticJsonDocument<3000> IncomingJsonBuffer;                                        //Memory pool
    DeserializationError error = deserializeJson(IncomingJsonBuffer, incomingJsonData); //Parse message
    if (error)
    { //Check for errors in parsing
      logPL("!-Parsing failed-!");
    }
    else
    {
      for (int gpBtn = 0; gpBtn < 16; gpBtn++)
      {
        dashInstance->setDashGamePadButtons(gpBtn, (IncomingJsonBuffer["gp"]["btns"][gpBtn] == 1));
      } //Get game pad button values
      for (int axes = 0; axes < 4; axes++)
      {
        dashInstance->setDashGamePadAxes(axes, IncomingJsonBuffer["gp"]["axes"][axes]);
      } //Get game pad axes
      for (int btn = 0; btn < dashInstance->getBtnCount(); btn++)
      {
        dashInstance->setDashButtons(btn, (IncomingJsonBuffer["vBtns"][btn] == 1));
      } //Get dash button values
      for (int inp = 0; inp < dashInstance->getInpCount(); inp++)
      {
        dashInstance->setDashInputs(inp, IncomingJsonBuffer["vInps"][inp]);
      } //Get dash input values
    }
    //////////////////////////////////
    ////    Send response data    ////
    DynamicJsonDocument OutgoingJsonBuffer(1000);                               //Dynamicly created json document to hold response
    JsonArray VirtualDisplays = OutgoingJsonBuffer.createNestedArray("vDisps"); //Create json array to hold dash display data
    JsonArray VirtualConsoles = OutgoingJsonBuffer.createNestedArray("vCons");  //Crate json array to hold dash console data
    for(int disp=0; disp < dashInstance->getDispCount(); disp++) 
    {
      VirtualDisplays.add(dashInstance->getDashDisplays(disp).dispData);
    } //Add dash display data
    for (int cons = 0; cons < dashInstance->getConsCount(); cons++)
    { 
      if(dashInstance->getDashIsEnabled()) 
      {
        int msgLength;
        int buffEnd = dashInstance->getDashConsoles(cons).bufferEnd;
        int buffStart = dashInstance->getDashConsoles(cons).bufferStart;
        if(buffEnd > buffStart) 
        {
          msgLength = buffEnd - buffStart;
        } 
        else if(buffEnd < buffStart) 
        {
          msgLength = (buffEnd + (1000-buffStart));
        } 
        else 
        { 
          msgLength = 0;
        }
        if(msgLength > 0) 
        {
          char consoleMsg[msgLength+1];
          for(int i=0; i<msgLength; i++) 
          {        
            consoleMsg[i] = dashInstance->getDashConsoles(cons).consBuffer[dashInstance->getDashConsoles(cons).bufferStart];
            int next = dashInstance->getDashConsoles(cons).bufferStart + 1;
            if(next >= 1000) 
            { 
              next = 0; 
            }
            dashInstance->setConsoleBufferStart(cons, next);
          }
          consoleMsg[msgLength] = '\0';
          VirtualConsoles.add(consoleMsg);
        }
      }
    }
    String responseDataString;                             //String to hold the constrcted message
    serializeJson(OutgoingJsonBuffer, responseDataString); //Serailze the json and put it in the created string
    client->text(responseDataString);                      //Send the serialized json from the string back to client over websocket
    //////////////////////////////////
  }
  ////////////////////////////////////////////////////////////////////////////////////////
}

DriverStationDashboard::DriverStationDashboard(int btnCount, int inpCount, int dispCount, int consCount,
                                               DashButton *dashButtons, DashInput *dashInputs, DashDisplay *dashDisplays, DashConsole *dashConsoles)
{
  _dashButtons = dashButtons;
  _dashInputs = dashInputs;
  _dashDisplays = dashDisplays;
  _dashConsoles = dashConsoles;
  _btnCount = btnCount;
  _inpCount = inpCount;
  _dispCount = dispCount;
  _consCount = consCount;
  dashInstance = this;
}

void DriverStationDashboard::initialize(char *ssid, char *password)
{
  //Print ASCII art title
  logPL("\n\n\n___  ___ _                   ______         _    _____  _____\n|  \\/  |(_)                  | ___ \\       | |  |____ |/ __  \\");
  logPL("| .  . | _   ___  _ __  ___  | |_/ /  ___  | |_     / /`' / /'\n| |\\/| || | / __|| '__|/ _ \\ | ___ \\ / _ \\ | __|    \\ \\  / /");
  logPL("| |  | || || (__ | |  | (_) || |_/ /| (_) || |_ .___/ /./ /___\n\\_|  |_/|_| \\___||_|   \\___/ \\____/  \\___/  \\__|\\____/ \\_____/");
  logPL(" _    _        _      _____                _                _ \n| |  | |      | |    /  __ \\              | |              | |");
  logPL("| |  | |  ___ | |__  | /  \\/  ___   _ __  | |_  _ __  ___  | |\n| |/\\| | / _ \\| '_ \\ | |     / _ \\ | '_ \\ | __|| '__|/ _ \\ | |");
  logPL("\\  /\\  /|  __/| |_) || \\__/\\| (_) || | | || |_ | |  | (_) || |\n \\/  \\/  \\___||_.__/  \\____/ \\___/ |_| |_| \\__||_|   \\___/ |_|\n");
  //Handle Wi-Fi initialization
  int count = 1;
  WiFi.begin(ssid, password); //Start WiFi
  logP("Connecting to WiFi.");
  while (WiFi.status() != WL_CONNECTED)
  {
    logP(".");
    delay(1000);
    if (count % 10 == 0)
    {
      WiFi.begin(ssid, password);
    } //Start WiFi again
    count++;
  }
  logPL("\nConnected at: " + (WiFi.localIP()).toString()); //Print local IP address

  //Handle server initialization
  _ws.onEvent(onWsEvent);   //Create event for websockets
  _server.addHandler(&_ws); //Put websocket event in the schedule handler for the server
  //If a HTTP_GET request is recived for "/" subdomain serve the index.html page
  _server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) { request->send(SPIFFS, "/index.html", "text/html"); });
  //If a HTTP_GET request is recived for "/index.html" alternate subdomain serve the index.html page
  _server.on("/index.html", HTTP_GET, [](AsyncWebServerRequest *request) { request->send(SPIFFS, "/index.html", "text/html"); });
  //If a HTTP_GET request is recived for "/settings.html" serve the settings.html page
  _server.on("/settings.html", HTTP_GET, [](AsyncWebServerRequest *request) { request->send(SPIFFS, "/settings.html", "text/html"); });
  //If a HTTP_GET request is recived for "/about.html" serve the logo image
  _server.on("/about.html", HTTP_GET, [](AsyncWebServerRequest *request) { request->send(SPIFFS, "/about.html", "text/html"); });
  //If a HTTP_GET request is recived for "/devPage.html" serve the devPage.html page
  _server.on("/devPage.html", HTTP_GET, [](AsyncWebServerRequest *request) { request->send(SPIFFS, "/devPage.html", "text/html"); });
  //If a HTTP_GET request is recived for "/styles.css" serve the style.css script
  _server.on("/styles.css", HTTP_GET, [](AsyncWebServerRequest *request) { request->send(SPIFFS, "/styles.css", "text/css"); });
  //If a HTTP_GET request is recived for "/index.js" serve javascript file
  _server.on("/index.js", HTTP_GET, [](AsyncWebServerRequest *request) { request->send(SPIFFS, "/index.js", "text/javascript"); });
  //If a HTTP_GET request is recived for "/devPage.js" serve javascript file
  _server.on("/devPage.js", HTTP_GET, [](AsyncWebServerRequest *request) { request->send(SPIFFS, "/devPage.js", "text/javascript"); });
  //If a HTTP_GET request is recived for "/logo.png" serve the logo png
  _server.on("/logo.png", HTTP_GET, [](AsyncWebServerRequest *request) { request->send(SPIFFS, "/logo.png", "image/png"); });
  //If a HTTP_GET request is recived for "/favicon.ico" serve the favicon icon
  _server.on("/favicon.ico", HTTP_GET, [](AsyncWebServerRequest *request) { request->send(SPIFFS, "/favicon.png", "image/png"); });

  //Handle mDNS initialization
  if (!MDNS.begin("robot"))
  {
    logPL("!-Error setting up mDNS responder-!"); //Creates dns name in this case it is robot.
  }
  else
  {
    logPL("DNS server started.");
  }

  //Handle SPIFFS file system initialization
  if (!SPIFFS.begin())
  {
    logPL("!-SPIFFS Mount failed-!");
  }
  else
  {
    logPL("SPIFFS Mount succesfull.");
  }

  //Begin hosting web server
  _server.begin(); //Start the server schedule handler
  logPL("Web Server Started!");
}

//Get enabled state of dashboard
bool DriverStationDashboard::enabled(void) { return _dashIsEnabled; }

//Get the value of a dash data input
double DriverStationDashboard::dashInput(int inpNum) { return _dashInputs[inpNum].inpData; }

//Get the value of a dash button
bool DriverStationDashboard::dashButton(int btnNum) { return _dashButtons[btnNum].currentState; }

//Get the value of a game pad button
bool DriverStationDashboard::gamePadButton(int btnNum) { return _dashGamePad.gpButtons[btnNum]; }

//Get the value of a game pad axes
int DriverStationDashboard::gamePadAxes(int axesNum) { return _dashGamePad.gpAxes[axesNum]; }

//Set the data on a dash board display
void DriverStationDashboard::setDashDisplay(int dispNum, String dataToDisplay)
{
  int msgLength = (dataToDisplay.length());
  char msgArray[msgLength+1];
  dataToDisplay.toCharArray(msgArray, (msgLength + 1));
  for (int i = 0; i < msgLength; i++)
  {
    _dashDisplays[dispNum].dispData[i] = dataToDisplay[i];
  }
  for (int i = msgLength; i < sizeof(_dashDisplays[dispNum].dispData); i++)
  {
    _dashDisplays[dispNum].dispData[i] = ' ';
  }
  _dashDisplays[dispNum].dispData[msgLength] = '\0';
}

//Set the data on a dash board display
void DriverStationDashboard::setDashDisplay(int dispNum, double dataToDisplay)
{
  int sizeOfData = sizeof(_dashDisplays[dispNum].dispData);
  char dataArray[sizeOfData];
  (String(dataToDisplay, 5)).toCharArray(dataArray, sizeOfData);
  setDashDisplay(dispNum, dataArray);
}

//Set the data on a dash board display
void DriverStationDashboard::setDashDisplay(int dispNum, int dataToDisplay)
{
  int sizeOfData = sizeof(_dashDisplays[dispNum].dispData);
  char dataArray[sizeOfData];
  (String(dataToDisplay)).toCharArray(dataArray, sizeOfData);
  setDashDisplay(dispNum, dataArray);
}

//Send data to a dash board console
void DriverStationDashboard::sendToConsole(int consNum, String dataToDisplay)
{
  int msgLength = (dataToDisplay.length()+1);
  char msgArray[msgLength+1];
  dataToDisplay.toCharArray(msgArray, msgLength);
  for(int i=0; i < msgLength; i++)
  {
    int next = _dashConsoles[consNum].bufferEnd + 1;
    if(next >= 1000) 
    {
       next = 0;
    }
    if(next == _dashConsoles[consNum].bufferStart) 
    {
      logPL("ERROR: Console "+String(consNum)+" buffer overflow detected in sendToConsole function at buffer index "+String(_dashConsoles[consNum].bufferEnd)+":\n"); 
      for(int ind=0; ind<1000; ind++)
      {
        if(_dashConsoles[consNum].consBuffer[ind] != '\n')
        {
          logP(_dashConsoles[consNum].consBuffer[ind]);
        }
        else
        {
          logP(" NEW_LINE ");
        }
      }
    } 
    else 
    {
      _dashConsoles[consNum].consBuffer[_dashConsoles[consNum].bufferEnd] = msgArray[i];
      _dashConsoles[consNum].bufferEnd = next;
    }
  }
  for(int i=0; i<1000; i++) 
  {
    if(_dashConsoles[consNum].consBuffer[i] == '\0' && ((i <= _dashConsoles[consNum].bufferEnd) && (i >= _dashConsoles[consNum].bufferStart))) 
    { 
      _dashConsoles[consNum].consBuffer[i] = ' ';
    }
  }
}

//Set the data on a dash board display
void DriverStationDashboard::sendToConsole(int consNum, double dataToDisplay)
{
  char dataArray[20];
  (String(dataToDisplay, 5)).toCharArray(dataArray, 20);
  sendToConsole(consNum, dataArray);
}

//Set the data on a dash board display
void DriverStationDashboard::sendToConsole(int consNum, int dataToDisplay)
{
  char dataArray[20];
  String(dataToDisplay).toCharArray(dataArray, 20);
  sendToConsole(consNum, dataArray);
}

//Fucntion for ws class to access instance button count
int DriverStationDashboard::getBtnCount(void) { return _btnCount; }

//Function for ws class to access instance input count
int DriverStationDashboard::getInpCount(void) { return _inpCount; }

//Function for ws class to access instance display count
int DriverStationDashboard::getDispCount(void) { return _dispCount; }

//Function for ws class to access instance console count
int DriverStationDashboard::getConsCount(void) { return _consCount; }

//Function for ws class to modify instance enabled state
void DriverStationDashboard::setDashIsEnabled(bool dashState) { _dashIsEnabled = dashState; }

//Function for ws class to access instance dashIsEnabled
bool DriverStationDashboard::getDashIsEnabled() { return _dashIsEnabled; }

//Function for ws class to access instance dash buttons
DashButton DriverStationDashboard::getDashButtons(int btnNum) { return _dashButtons[btnNum]; }

//Function for ws class to access instance dash inputs
DashInput DriverStationDashboard::getDashInputs(int inpNum) { return _dashInputs[inpNum]; }

//Function for ws class to access instance dash displays
DashDisplay DriverStationDashboard::getDashDisplays(int dispNum) { return _dashDisplays[dispNum]; }

//Function for ws class to access instance dash consoles
DashConsole DriverStationDashboard::getDashConsoles(int consNum) { return _dashConsoles[consNum]; }

//Function for ws class to modify instance dash buttons
void DriverStationDashboard::setDashButtons(int btnNum, bool btnState) { _dashButtons[btnNum].currentState = btnState; }

//Function for ws class to modify instance dash inputs
void DriverStationDashboard::setDashInputs(int inpNum, double inpVal) { _dashInputs[inpNum].inpData = inpVal; }

//Fucntion for ws class to modify instance dash game pad buttons
void DriverStationDashboard::setDashGamePadButtons(int btnNum, bool btnState) { _dashGamePad.gpButtons[btnNum] = btnState; }

//Fucntion for ws class to modify instance dash game pad axes
void DriverStationDashboard::setDashGamePadAxes(int axesNum, int axesState) { _dashGamePad.gpAxes[axesNum] = axesState; }

//Fucntion for ws class to modify instance console buffer start position
void DriverStationDashboard::setConsoleBufferStart(int consNum, int startIndex) { _dashConsoles[consNum].bufferStart = startIndex; }
