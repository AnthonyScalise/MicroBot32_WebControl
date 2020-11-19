<img style="display: block; margin: 1em auto;" src="/images/logo.png" width="300"></img>

# Microbot32_WebControl
An arduino library to create a modular UI that can be hosted localy on an ESP32 based robot to interface with a robot through a browser. Developed by Team 3932: Dirty Mechanics members.

## Features
* Log console widgets
* Numerical input widgets
* Gamepad input map widget
* Customizable button widgets
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

# Library Usage
### Setup
![dashboardConfigurationExample image](/images/dashboardConfigurationExample.PNG)

### Class Functions
```C++ 
//DriverStationDashboard class that creates a driver station with the specified widgets
DriverStationDashboard::DriverStationDashboard(int btnCount, int inpCount, int dispCount, int consCount,
    DashButton *dashButtons, DashInput *dashInputs, DashDisplay *dashDisplays, DashConsole *dashConsoles)

//Initialize the driver station webpage on your local network
void DriverStationDashboard::initialize(char *ssid, char *password)

//Returns true if the driver station is enabled
bool DriverStationDashboard::enabled(void)

//Get the value of a specified input widget
double DriverStationDashboard::dashInput(int inpNum)

//Get the state of a specified dash button widget 
bool DriverStationDashboard::dashButton(int btnNum)

//Get the value of a specified game pad button
bool DriverStationDashboard::gamePadButton(int btnNum)

//Get the value of a specified game pad axes 
int DriverStationDashboard::gamePadAxes(int axesNum)

//Update a specified dash board display widget with text
void DriverStationDashboard::setDashDisplay(int dispNum, char *dataToDisplay)

//Update a specified dash board display widget with a double
void DriverStationDashboard::setDashDisplay(int dispNum, double dataToDisplay)

//Update a specified dash board display widget with an int
void DriverStationDashboard::setDashDisplay(int dispNum, int dataToDisplay)

//Send data to a dash board console with a string
void DriverStationDashboard::sendToConsole(int consNum, String dataToDisplay)

//Send data to a dash board console with a double
void DriverStationDashboard::sendToConsole(int consNum, double dataToDisplay)

//Send data to a dash board console with an int
void DriverStationDashboard::sendToConsole(int consNum, int dataToDisplay)
```

# UI Usage
### Using the Gamepad
![Gamepad Usage Example Video](/images/gamepadUsageExample.gif)
* When the dashboard is enabled the gamepad widget is hidden untill an input on a valid controler is detected.

### Locking the Widget Configuration
![Configuration Saving Example Video](/images/configurationLockExample.gif)
* When you use the dashboard for the first time the widgets will be placed in rows. You can resize the length of buttons displays and inputs, the height of the gamepad map, and the size of consoles using the resizers in the four corners of all widgets. 
* You can move all widgets draging them by their top banner.
* Using the lock in the top right will ensure every time you use the dashboard your widgets will stay the same.
* You can unlock the configuration make modifications and lock them again at any time.

### Clearing and Downloading Console Logs
![Console Buttons Example Video](/images/consoleButtonExample.gif)
* You can use the download button to save the console logs as a `.txt` file
* The clear button will clear the console field and its save file.

## Contributing
Contributions are welcome. Please open an issue or make a pull request as needed.
