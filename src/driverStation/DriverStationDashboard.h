/*
      DriverStationDashboard.h
      Created by: Anthony Scalise

      This library allows you to create and configure your
      Driver station dashboard. You can place virtual buttons,
      input fields for numbers and drop down selections, and
      displays for monitoring data.
*/

#ifndef DriverStationDashboard_h
#define DriverStationDashboard_h

#include "WiFi.h"
#include "SPIFFS.h"
#include "ESPmDNS.h"
#include "Arduino.h"
#include "ArduinoJson.h"
#include "ESPAsyncWebServer.h"

struct DashButton
{
  String btnName;
  bool momentaryType;
  bool defaultState;
  String onText;
  String offText;
  bool currentState;
};

struct DashInput
{
  String inpName;
  double inpData;
};

struct DashDisplay
{
  String dispName;
  char dispData[20];
};

struct DashGamePad
{
  bool gpButtons[16];
  int gpAxes[4];
};

struct DashConsole
{
  String consName;
  char consBuffer[500];
  int bufferStart;
  int bufferEnd;
};

struct DashGraph
{
  String grfName;
  String xName;
  String yName;
  double grfBufferX[50];
  double grfBufferY[50];
  int bufferStart;
  int bufferEnd;
};

class DriverStationDashboard
{
public:
  DriverStationDashboard(int btnCount, int inpCount, int dispCount, int consCount, int grfCount,
                         DashButton *dashButtons, DashInput *dashInputs, DashDisplay *dashDisplays, DashConsole *dashConsoles, DashGraph *dashGraphs);

  void initialize(char *ssid, char *password);
  bool enabled(void);
  bool dashButton(int btnNum);
  double dashInput(int inpNum);
  bool gamePadButton(int btnNum);
  int gamePadAxes(int axesNum);
  void setDashDisplay(int dispNum, String dataToDisplay);
  void setDashDisplay(int dispNum, double dataToDisplay);
  void setDashDisplay(int dispNum, int dataToDisplay);
  void sendToConsole(int consNum, String dataToDisplay);
  void sendToConsole(int consNum, double dataToDisplay);
  void sendToConsole(int consNum, int dataToDisplay);
  void sendToGraph(int grfNum, double xVal, double yVal); //int lineNum


  int getBtnCount(void);
  int getInpCount(void);
  int getDispCount(void);
  int getConsCount(void);
  int getGrfCount(void);
  void setDashIsEnabled(bool dashState);
  bool getDashIsEnabled(void);
  DashButton getDashButtons(int btnNum);
  DashInput getDashInputs(int inpNum);
  DashDisplay getDashDisplays(int dispNum);
  DashConsole getDashConsoles(int consNum);
  DashGraph getDashGraphs(int grfNum);
  void setDashButtons(int btnNum, bool btnState);
  void setDashInputs(int inpNum, double inpVal);
  void setDashGamePadButtons(int btnNum, bool btnState);
  void setDashGamePadAxes(int axesNum, int axesState);
  void setConsoleBufferStart(int consNum, int startIndex);
  void setGraphBufferStart(int grfNum, int startIndex);

private:
  int _btnCount;
  int _inpCount;
  int _dispCount;
  int _consCount;
  int _grfCount;
  bool _dashIsEnabled = false;

  DashInput *_dashInputs;
  DashGamePad _dashGamePad;
  DashButton *_dashButtons;
  DashDisplay *_dashDisplays;
  DashConsole *_dashConsoles;
  DashGraph *_dashGraphs;
};

#endif
