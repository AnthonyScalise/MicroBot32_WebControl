#include "DriverStationDashboard.h"
#include "wifiSecrets.h"


DashButton DashButtons[16] = {  //Dash buttons parameters: (Name, Momentary?, StartingState, on_text, off_text)
  {" ", true, false, "0", "0"},
  {" ", true, false, "1", "1"},
  {" ", true, false, "2", "2"},
  {" ", true, false, "3", "3"},
  {" ", true, false, "4", "4"},
  {" ", true, false, "5", "5"},
  {" ", true, false, "6", "6"},
  {" ", true, false, "7", "7"},
  {" ", true, false, "8", "8"},
  {" ", true, false, "9", "9"},
  {" ", true, false, "+", "+"},
  {" ", true, false, "−", "−"},
  {" ", true, false, "×", "×"},
  {" ", true, false, "÷", "÷"},
  {" ", true, false, "CE", "CE"},
  {" ", true, false, "=", "="}
};

DashInput DashInputs[0] = {}; //Dash inputs parameters: (Name)

DashDisplay DashDisplays[1] = { {"Output Display"} }; //Dash displays parameters: (Name, Initial message if wanted)

DashConsole DashConsoles[0] = {}; //Dash consoles parameters: (Name, Initial message if wanted)

DriverStationDashboard DriverStation(16, 0, 1, 0, DashButtons, DashInputs, DashDisplays, DashConsoles);


char ssid[] = THIS_IS_WHERE_YOUR_SSID_GOES;  //Set the wifi SSID for your robot access point here
char password[] = THIS_IS_WHERE_YOUR_PASS_GOES;  //Set the wifi password for your robot here

int operatorNumber = -1; // Operator Assignments => (-1: none), (0: +), (1: -), (2: *), (3: /)
double currentNum = 0;
double nextDidget = 0;
int machineState = 0;
double nextNum = 0;

void setup() {
  Serial.begin(115200);
  DriverStation.initialize(ssid, password);  //Start driver station dashboard
  delay(3000);
  DriverStation.setDashDisplay(0, 0); //Clear display
}

void loop() {
  if(DriverStation.enabled()) {
    // Main machine state. (STATE: 0) Waits for inputs
    if(machineState == 0) {
      for(int i=0; i<10; i++) { //Iterates through all nummber buttons
        if(DriverStation.dashButton(i)) {
          nextDidget = i; //Put input number into next didget place holder
          nextNum = ((nextNum * 10) + nextDidget); //Move next number contents forwards one decimal place and add the next didget to the first whole number decimal place
          DriverStation.setDashDisplay(0, nextNum);  //Print the entered number to the display
          machineState = 1; //Set machine state to 1 to wait for button release
        }
      }
      // Iterate through all non number buttons
      for(int i=10; i<15; i++) {
        if(DriverStation.dashButton(i)) {
          operatorNumber = (i-10);  //Set the selected operator number 
          machineState = 1; //Set machine state to 1 to wait for button release
          currentNum = nextNum; //Move completed number into current number space to prepare for next number
          nextNum = 0;  //Clear the number space to prepare for the next number
          nextDidget = 0; //Clear the didget space to prepare for the next didget
          if(i == 14) { //If the button pressed is the clear display button
            currentNum = 0; //Clear the current number
            operatorNumber = -1;  //Reset operator mode
            DriverStation.setDashDisplay(0, 0); //Clear the display
          }
        }
      }
      if(DriverStation.dashButton(15) && operatorNumber != -1) {  //If the equals button is pressed and there is an operation selected
        if(operatorNumber == 0) //If operator is addition
          nextNum = (currentNum+nextNum); //Add numbers and place answer in next number to be used again
        else if(operatorNumber == 1)  //If operator is subtraction
          nextNum = (currentNum-nextNum); //Subtract numbers and place answer in next number to be used again
        else if(operatorNumber == 2)  //If operator is multiplication
          nextNum = (currentNum*nextNum); //Multiply numbers and place answer in next number to be used again
        else if(operatorNumber == 3)  //If operator is division
          nextNum = (currentNum/nextNum); //Devide numbers and place answer in next number to be used again
        currentNum = 0; //Clear current number used for operation
        operatorNumber = -1;  //Reset operator to default
        DriverStation.setDashDisplay(0, nextNum); //Set screen to answer
      }
    // Secondary machine state. (STATE: 1)  Waits for button releases
    } else if(machineState == 1) {
      machineState = 0; //Sets for default next machine state to be 0
      for(int i=0; i<16; i++) { //Iterates through all buttons
        if(DriverStation.dashButton(i)) //If this button is pressed
          machineState = 1; //Set next defualt machine state to be 1
      }
    }
  }
}
