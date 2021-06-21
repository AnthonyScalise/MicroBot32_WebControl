/*
    driverStation.ino
    Created by: Anthony Scalise

    This program takes advantage of the wifi functionality of the ESP32.
    There are a few parameters to coustomize. First the WiFi ssid and password
    for your WiFi must be entered so that it can host the control page on your
    network. This program uses apple bonjour based mDNS to allow for acess without
    knowing the devices local IP. This does not work without some additional setup
    on windows. In this case just upload the code and the IP will be printed into the
    serial monitor where you can copy, add it to the code and re-flash. If you are using
    the mDNS service you can access the page at "http://robot.local/". To use the robots
    web control page simply plug in a controler. Logitech F310 gamepads are what this
    software is designed for; however, the javascript api used supports almost all
    USB HID's. This can be tweaked and configured to work with other remotes and some
    may work without any modification. This software also requires the ESP32 SPIFFS tool
    to be installed. Use this to upload the data file to the ESP's internal
    file system to be mounted for hosting.
    *NOTE you need to change the websocket domain in "test.js" if you are not using mDNS.
*/


#include "DriverStationDashboard.h"
#include "wifiSecrets.h"

////////////////////////////////////////////
//Create your Driver Station Dashboard here
//Dash buttons parameters: (Name, Momentary?, StartingState, on_text, off_text)
DashButton DashButtons[6] = {
  {"Test Button 1", false, true, "On", "Off"},
  {"Test Button 2", true, false, "Pressed", "Released"},
  {"Test Button 3", false, false, "On", "Off"},
  {"Test Button 4", true, true, "Active", "Not Active"},
  {"Test Button 5", true, false, "1", "0"},
  {"Test Button 6", false, true, "True", "False"}
};
//Dash inputs parameters: (Name, InitialValue)
DashInput DashInputs[6] = {
  {"Test Input 1", 1.11},
  {"Test Input 2", 2},
  {"Test Input 3", 3.33},
  {"Test Input 4", 4},
  {"Test Input 5", 5.55},
  {"Test Input 6", 6}
};
//Dash displays parameters: (Name, Initial message if wanted)
DashDisplay DashDisplays[6] = {
  {"Test Display 1", "Hello World"},
  {"Test Display 2", "Foo Bar"},
  {"Test Display 3", "Lorem ipsum"},
  {"Test Display 4", "Nort"},
  {"Test Display 5"},
  {"Test Display 6"}
};
//Dash consoles parameters: (Name, Initial message if wanted)
DashConsole DashConsoles[1] = {
  {"Test Console"}
};
//Dash graph parameters: (Name, X axis name, Y axis names)
DashGraph DashGraphs[4] = {
  {"X1 Graph", "X1 X Axis", "X1 Y Axis"},
  {"Y1 Graph", "Y1 X Axis", "Y1 Y Axis"},
  {"X2 Graph", "X2 X Axis", "X2 Y Axis"},
  {"Y2 Graph", "Y2 X Axis", "Y2 Y Axis"}
};
DriverStationDashboard DriverStation(6, 6, 6, 1, 4, DashButtons, DashInputs, DashDisplays, DashConsoles, DashGraphs);
////////////////////////////////////////////

char ssid[] = THIS_IS_WHERE_YOUR_SSID_GOES;  //Set the wifi SSID for your robot access point here
char password[] = THIS_IS_WHERE_YOUR_PASS_GOES;  //Set the wifi password for your robot here

int lastGpButtons[16];
int lastGpAxes[4];
int lastVButtons[6];
double lastVInputs[6];
bool wasNotEnabled = true;
int inputCount[] = {0, 0, 0, 0};

void setup() {
  Serial.begin(115200);
  DriverStation.initialize(ssid, password);  //Start driver station web server
  delay(3000);
  DriverStation.setDashDisplay(4, 3.14159);
  DriverStation.setDashDisplay(5, 2.71828);
  DriverStation.sendToConsole(0, "Example of an int:");
  DriverStation.sendToConsole(0, 123456789);
  DriverStation.sendToConsole(0, "\n Example of a double:");
  DriverStation.sendToConsole(0, 3.14159);
  DriverStation.sendToConsole(0, "\nABCDEFGHIJKLMNOPQRSTUVWXYZ\n");
}

void loop() {
  // Temporary Test //
  if(DriverStation.enabled()) {
    if(wasNotEnabled) { 
      DriverStation.sendToConsole(0, ("____________________________________\nDriver Station Has Been Enabled\n____________________________________\n\n")); 
      wasNotEnabled = false;
    }
    for(int i=0; i < 16; i++) {
      if(DriverStation.gamePadButton(i) && (!(lastGpButtons[i]==1))) {
        lastGpButtons[i] = 1; 
        DriverStation.sendToConsole(0, ("GamePad Button "+String(i+1)+": Pressed\n"));
        Serial.println("Game Pad Button "+String(i+1)+" Pressed");
      }
      if((!DriverStation.gamePadButton(i)) && (!(lastGpButtons[i]==0))) {
        lastGpButtons[i] = 0;
        DriverStation.sendToConsole(0, ("GamePad Button "+String(i+1)+": Released\n"));
        Serial.println("Game Pad Button "+String(i+1)+" Released");
      }
    }
    for(int i=0; i < 4; i++) {
      if(abs(DriverStation.gamePadAxes(i)) > 5) {
        if(lastGpAxes[i] != DriverStation.gamePadAxes(i)) {
          DriverStation.sendToConsole(0, (String((i==0 || i==1)? "LeftJoystick " : "RightJoystick ") + String((i==0 || i==2)? "X Axis: " : "Y Axis: ") + String(DriverStation.gamePadAxes(i)))+"\n");
          Serial.println(String((i==0 || i==1)? "Left Joystick " : "Right Joystick ") + String((i==0 || i==2)? "X Axis: " : "Y Axis: ") + String(DriverStation.gamePadAxes(i)));
          DriverStation.sendToGraph(i, inputCount[i], DriverStation.gamePadAxes(i));
          inputCount[i]++;
          lastGpAxes[i] = DriverStation.gamePadAxes(i);
        }
      }
    }
    for(int i=0; i < 6; i++) {
      if(DriverStation.dashButton(i) && (!(lastVButtons[i]==1))) {
        lastVButtons[i] = 1;
        DriverStation.sendToConsole(0, ("VirtualButton "+String(i+1)+": Pressed\n"));
        Serial.println("Virtual Button "+String(i+1)+" Pressed");
      }
      if((!DriverStation.dashButton(i)) && (!(lastVButtons[i]==0))) {
        lastVButtons[i] = 0;
        DriverStation.sendToConsole(0, ("VirtualButton "+String(i+1)+": Released\n"));
        Serial.println("Virtual Button "+String(i+1)+" Released");
      }
    }
    for(int i=0; i < 6; i++) {
      if(DriverStation.dashInput(i) != lastVInputs[i]) {
        DriverStation.sendToConsole(0, ("VirtualInput "+String(i+1)+": "+String(DriverStation.dashInput(i), 5)+"\n"));
        Serial.println("Virtual Input "+String(i+1)+": "+String(DriverStation.dashInput(i), 5));
        lastVInputs[i] = DriverStation.dashInput(i);
      }
    }
  } else {
    wasNotEnabled = true;
    for(int i=0; i<4; i++) {
      inputCount[i] = 0;
    }
  }
}