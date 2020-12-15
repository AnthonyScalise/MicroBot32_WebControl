<img style="display: block; margin: 1em auto;" src="/images/logo.png" width="300"></img>

# Microbot32_WebControl
An arduino library to generate a modular browser based UI that can be hosted on an ESP32 based robot to interface with a robot through a browser. Developed by Team 3932: Dirty Mechanics members.

## Features
* Log console widgets
* Numerical input widgets
* Gamepad input map widget
* Customizable button widgets
* Tank drive control using WASD or arrow keys
* Display widgets that work with numbers and text

![UI_Example image](/images/UI_Example.PNG)

## Installation
1. First, you need to install the ESP32 boards and the ESP32 file system manager in the Arduino IDE. See [here](https://randomnerdtutorials.com/installing-the-esp32-board-in-arduino-ide-windows-instructions/) for instructions on installing the board in the Arduino IDE, and see [here](https://randomnerdtutorials.com/install-esp32-filesystem-uploader-arduino-ide/) for instructions on how to install the file system uploader in the Arduino IDE.
2. Clone the repository.
3. Open the `driverStation.ino` file in the Arduino IDE. This will allow your Arduino IDE to be positioned at the correct file location locally.
4. Using the `wifiSecrets_EXAMPLE.h` file as refference Change the `ssid` and `password` to the name of your WiFi network so that the program can connect to your WiFi upon startup. Alternatively you can remove the line `#include "wifiSecrets.h"` and directly set your ssid and password in your ino sketch.
5. Upload the `data` folder to the ESP32 filesystem. To do this, choose the `Tools > ESP32 Sketch Data Upload` option in the Arduino menu bar. Wait for this process to complete. You should see a message similar to `Leaving...` or `Hard reseting...` when the process is done.
6. Upload the current file to the ESP32 through the Arduino IDE by using the `Upload` button (commonly styled as a right arrow) in the Arduino menu. Make sure the board is set to `ESP32 Dev Module` in your board settings. Again, you should see a message similar to `Leaving...` or `Hard reseting...` when the process is done.
7. If you have mDNS bonjour installed on your computer (you might already) you can open `robot.local` in your browser. If this does not work when the program is finished uploading, open up your serial monitor. The robots assigned local IP will be printed. Open this IP in a web browser, and the GUI should be accessible.

<br><br>

# UI Usage
### Using the Gamepad
![Gamepad Usage Example Video](/images/gamepadUsageExample.gif)
* When the dashboard is enabled the gamepad widget is hidden until a valid controller input and button press is detected

<div style="height: 15px"></div>

### Using Keyboard Input Mode
![Keyboard Input Example Image2](/images/keyboardInputImage2.PNG) ![Keyboard Input Example Image](/images/keyboardInputImage.PNG) 
* Selecting either `WASD` or `Arrow Keys` input mode in settings will substitute for the gamePad widget using tank drive
* You can press these buttons with a mouse or use your keyboards actual buttons 
* To use the keyboard buttons simply click anywhere on this widget. Clicking anywhere off will stop the listening for keyboard button presses

<div style="height: 15px"></div>

### Locking the Widget Configuration
![Configuration Saving Example Video](/images/configurationLockExample.gif)
* When you use the dashboard for the first time the widgets will be placed in rows. You can resize the length of buttons displays and inputs, the height of the gamepad map, and the size of consoles using the resizers in the four corners of all widgets. 
* You can move all widgets draging them by their top banner.
* Using the lock in the top right will ensure every time you use the dashboard your widgets will stay the same.
* You can unlock the configuration make modifications and lock them again at any time.

<div style="height: 15px"></div>

### Clearing and Downloading Console Logs
![Console Buttons Example Video](/images/consoleButtonExample.gif)
* You can use the download button to save the console logs as a `.txt` file
* The clear button will clear the console field and its save file.

<br><br>

# Settings
![Settings Page Image](/images/settingsPageImage.PNG)
### Widget Settings
##### Configuration
* The widget configuration stores data for both position and size of widgets 
* After creating a widget setup you can download your configuration to migrate to another computer or share with others
* You can upload position configurations here 
* You can also reset your widget position configuration to default here
##### Dragging
* Turning on `Grid` will snap widgets to a grid with the resolution specified by the slider from 1 to 40 pixels
* Turning on `Snap To Edges` will cause widgets to snap to nearby widgets sides and corners  

### Controller Input Settings
* `GamePad` mode allows for reading controller buttons and joysticks to control your robot
* `WASD` and `Arrow Key` modes emulate gamepad joystick axes #1 and #3 for left and right respectively as a tank drive configuration
* By default WASD and Arrow Key joystick emulation uses a value of `-100` for joystick up and `100` for joystick down
* Invert Y axis mode will invert all joystick Y axes

<br><br>

# Library Usage
## Setup
![dashboardConfigurationExample image](/images/dashboardConfigurationExample.PNG)

<div style="height: 15px"></div>

## Class Functions
##### Setup Functions
```C++ 
//DriverStationDashboard class that creates a driver station with the specified widgets
DriverStationDashboard::DriverStationDashboard(int btnCount, int inpCount, int dispCount, int consCount,
    DashButton *dashButtons, DashInput *dashInputs, DashDisplay *dashDisplays, DashConsole *dashConsoles)

//Initialize the driver station webpage on your local network
void DriverStationDashboard::initialize(char *ssid, char *password)
```
<div style="height: 5px"></div>

##### Static Functions
```C++
//Returns true if the driver station is enabled
bool DriverStationDashboard::enabled(void)
```
<div style="height: 5px"></div>

##### Widget Structures
```C++
struct DashButton { String btnName, bool momentaryType, bool defaultState, String onText, String offText, bool currentState };

struct DashInput { String inpName, double inpData };

struct DashDisplay { String dispName, char dispData[20] };

struct DashGamePad { bool gpButtons[16], int gpAxes[4] };

struct DashConsole { String consName, char consBuffer[1000], int bufferStart, int bufferEnd };
```
<div style="height: 5px"></div>

##### Virtual Input Functions 
```C++
//Get the value of a specified input widget
double DriverStationDashboard::dashInput(int inpNum)
```
<div style="height: 5px"></div>

##### Virtual Button Functions
```C++
//Get the state of a specified dash button widget 
bool DriverStationDashboard::dashButton(int btnNum)
```

<div style="height: 5px"></div>

##### Gamepad Controller Functions
```C++
//Get the value of a specified game pad button
bool DriverStationDashboard::gamePadButton(int btnNum)

//Get the value of a specified game pad axes 
int DriverStationDashboard::gamePadAxes(int axesNum)
```

<div style="height: 5px"></div>

##### Virtual Display Functions
```C++
//Update a specified dash board display widget with text
void DriverStationDashboard::setDashDisplay(int dispNum, String dataToDisplay)

//Update a specified dash board display widget with a double
void DriverStationDashboard::setDashDisplay(int dispNum, double dataToDisplay)

//Update a specified dash board display widget with an int
void DriverStationDashboard::setDashDisplay(int dispNum, int dataToDisplay)
```

<div style="height: 5px"></div>

##### Virtual Console Functions
```C++
//Send data to a dash board console with a string
void DriverStationDashboard::sendToConsole(int consNum, String dataToDisplay)

//Send data to a dash board console with a double
void DriverStationDashboard::sendToConsole(int consNum, double dataToDisplay)

//Send data to a dash board console with an int
void DriverStationDashboard::sendToConsole(int consNum, int dataToDisplay)
```

<br><br>

## Contributing
Contributions are welcome. Please open an issue or make a pull request as needed.
