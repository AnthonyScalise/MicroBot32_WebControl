# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
<br><br>

## 2.3.3 - 2021-06-14
### Fixed
* Size of externally hosted logo

<br><br>

## 2.3.2 - 2021-06-13
### Changed
* Logo file is now hosted externally from the robot

<br><br>

## 2.3.1 - 2021-06-13
### Changed
* Use of robot.local domain for websocket changed to actual ip address of server for the case mDNS does not work

<br><br>

## 2.3.0 - 2020-12-14
### Fixed
* Bugs with console widgets resizing beyond minimum limit
* Bugs with button widgets resizing beyond minimum limit
* Bugs with input widgets resizing beyond minimum limit
* Bug where widgets shrink when locked
* Bug where new users can not enable until visiting settings page
* New widgets no longer glitch into navbar
* Bugs caused by moving mouse before releasing buttons
* Bug with arrow key ASCII character incompatibility on Mac OSX

### Added
* Ability to snap widgets to a grid of specified resolution
* Ability for widgets to snap to each others edges
* Settings UI for widget snaping
* Boundaries to keep widgets on screen
* Ability to set initial value for input widgets
* Buttons now initially auto size to largest state display value
* All widgets auto size to contents and keep minimum size limits after resizing
* Ability to add additional widgets without glitching a saved position configuration

### Removed
* Developer page HTML
* Developer page JS
* About page HTML

### Changed
* Moved enable and disable buttons to navbar
* Moved version number from `About` page to `Settings`
* Removed rounded edges from widgets
* Added grey border to sides of widgets
* Standardized widget heights
* Refactored code for dragging widgets
* Refactored code for settings page
* `driverStation.ino` test sketch to demonstrate new features
* Widget config for calculator demo to work with changes

<br><br>

## 2.2.3 - 2020-11-22
### Fixed
* A bug where dash display contents were not visible without a dash console

### Added
* Update to documentation
* First example project

### Changed
* Made Change log a little more readable

<br><br>

## 2.2.2 - 2020-11-19
### Added
* Ability to emulate gamepad joystick with arrow keys and WASD keys
* Ability to download, upload, and clear the widget position configuration from settings
* Ability to invert Y axis for gamepad joysticks and gamepad emulation

### Fixed
* UI bug with releasing button widgets after moving mouse

### Changed
* Settings page now has actual settings in it

<br><br>

## 2.2.1 - 2020-11-08
### Added
* Auto widget spacing for startup without saved previous position configuration
* Button to clear logs for console widgets

### Changed
* Compressed logo and favicon images to save on memory

<br><br>

## 2.2.0 - 2020-11-06
### Added
* Ability to set persistant size of all widgets
* Ability to print ints to displays
* Ability to print ints to consoles

### Fixed
* Bugs with console buffers
* Bugs with display names

### Changed
* Total rewrite of client side widget construction
* Total rewrite of server side console buffer
* Moved gamepad widget creation from HTML to JS to allow for multiple controler support in the future 
* Test script modified to test all features now that bugs are fixed

<br><br>

## 2.1.5 - 2020-10-14
### Added
* Ability to download console log as a `.txt` file

<br><br>

## 2.1.4 - 2020-10-13
### Changed
* Formatted all files to allow for easier reading

### Fixed
* WiFi would continously begin in an infinite loop

<br><br>

## 2.1.3 - 2020-10-12
### Added
* Log console widget
* Custom serial monitor startup message

### Fixed
* Problems not connecting to WiFi the first time
* Error from converting string constant to char pointer

<br><br>

## 2.1.2 - 2020-10-07
### Added
* Persistant dashboard layout locking button

### Changed
* Improved some awkward UI interactions

<br><br>

## 2.1.1 - 2020-10-06
### Added
* Test support for input widgets in `driverStation.ino`
* Ability to print to a display widget with text or numbers
* Ability to specify the text on a button widget for both on and off states

### Fixed
* Bug that caused connection to crash sometimes
* Inability to disable and re-enable dashboard
* Bug that casued widgets to duplicate when re-enabling

<br><br>

## 2.1.0 - 2020-10-06
### Added
* Front end support for button widgets
* Front end support for input widgets
* Front end support for display widgets
* Client side back end support for button widgets
* Client side back end support for input widgets
* Client side back end support for display widgets
* Testing sketch in `driverStation.ino` to demonstrate all current functionality

### Changed
* Turned gamepad display into a widget and made it draggable

<br><br>

## 2.0.4 - 2020-10-04
### Added
* `wifiSecrets.h` which is ignored by git to define wifi creds and avoid commits containing personal data
* Testing script in `driverStation.ino` main loop to print game pad joystick and button presses to serial monitor

### Removed 
* WiFi access point mode

### Fixed
* Bugs with json data transmission. 

<br><br>

## 2.0.3 - 2020-09-23
### Added
* WiFi access point mode

### Removed
* WiFi client mode

### Fixed
* Issue with leaving personal wifi credentials in code

<br><br>

## 2.0.2 - 2020-09-23
### Changed
* Added C++ gitignore template to `.gitignore`

<br><br>

## 2.0.1 - 2020-09-23
### Added
* Added `CHANGELOG.md` file

### Changed
* Major updates to `README.md` file

<br><br>

## 2.0.0 - 2020-09-21
### Added
* Functionality on developer page

### Changed
* [ArduinoJson](https://github.com/bblanchon/ArduinoJson) version was updated to 6.16.1
* Major rewrite of JSON communication structure
* Major rewrite of driver station class structure

<br><br>

## 1.1.2 - 2020-09-06
### Added
* Developer page on the client
* Driver station classes
* Dirty Mechanics logo stored locally instead of referred to in the `src` attribute

### Changed
* `test.js` is now `index.js`

### Fixed
* Updated reference to `ArduinoJson` library.

<br><br>

## 1.1.1 - 2020-08-29
### Added
* Client-side JSON data transmission

### Fixed
* Updated reference to `ArduinoJson` library.

<br><br>

## 1.1.0 - 2020-08-27
### Added
* jQuery version was updated to 3.3.1
* Files are now in `src` folder
* Added a navigation bar, along with About and Settings pages
* Added [Bootstrap](https://getbootstrap.com) to the user interface

### Fixed
* Various spelling/grammar issues

<br><br>

## 1.0.0 - 2020-08-25
### Added
* Intial commit
