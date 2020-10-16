// Set true for verbose logs. False for regular logs
var verboseConsoleLogs = true;
////////////////////////////////////////////////////

var repGP;
var repSendData;
var repVirtualInputs;
var repVirtualDisplays;
var repVirtualConsoles;
var ws = null;
var hasGP = false;
var connectedToWebSocket = false;
var dashIsInitialized = false;

//Smart dashboard configuration values
var virtualInputCount = 0;
var virtualButtonCount = 0;
var virtualDisplayCount = 0;
var virtualConsoleCount = 0;
var gamepadCount = 1;
//Variable to hold all dashboard atributes
var dashboardData = {};
//Array to hold the widget elements
var widgetElements = { "gamepadWidgets": [], "inputWidgets": [], "buttonWidgets": [], "displayWidgets": [], "consoleWidgets": [] };
//Variable to hold the state of wether a previous widget position configuration exists
var previousConfigurationExists = false;

//The function that initializes the driver dashboard
function initializeDashboard() {
    dashboardData = JSON.parse(arguments[0]);
    virtualButtonCount = Object.keys(dashboardData["vBtns"]).length;
    virtualInputCount = Object.keys(dashboardData["vInps"]).length;
    virtualDisplayCount = Object.keys(dashboardData["vDisps"]).length;
    virtualConsoleCount = Object.keys(dashboardData["vCons"]).length;
    dashboardData["gp"] = { "btns": [], "axes": [] };
    for (var i = 0; i < 16; i++) { dashboardData["gp"]["btns"][i] = 0; }
    for (var i = 0; i < 4; i++) { dashboardData["gp"]["axes"][i] = 0; }
    widgetElements["gamepadWidgets"][0] = $(gamepadWidget);
    var widgetBoardSpace = document.getElementById("widgetBoard");
    var previousConfigurationSave = {};
    if (typeof(Storage) !== "undefined") {
        if (localStorage.positionSaveConfig) {
            previousConfigurationExists = true;
            $("#posLock").toggleClass("unlocked");
            previousConfigurationSave = JSON.parse(localStorage.getItem("positionSaveConfig"));
            console.log(previousConfigurationSave);
        }
    }

    //GamePad widget
    if (!previousConfigurationExists) { $("#gamepadWidget").draggable(); }

    //Virtual Inputs
    for (var i = 0; i < virtualInputCount; i++) {
        dashboardData["vInps"][i]["inpValue"] = 0.0;
        var inputWidget = document.createElement("span");
        inputWidget.className = "widgetBlock";
        var headerSpace = document.createElement("span");
        headerSpace.appendChild(document.createTextNode(dashboardData["vInps"][i]["Id"]));
        headerSpace.className = "widgetHeader";
        inputWidget.appendChild(headerSpace);
        var inputSpace = document.createElement("span");
        var inputField = document.createElement("INPUT");
        inputField.setAttribute("type", "number");
        inputField.setAttribute("value", "0.00");
        inputField.setAttribute("id", ("vInp" + (i.toString())));
        inputSpace.appendChild(inputField);
        inputSpace.className = "widgetContent";
        inputWidget.appendChild(inputSpace);
        widgetBoardSpace.appendChild(inputWidget);
        widgetElements["inputWidgets"][i] = inputWidget;
        if (!previousConfigurationExists) { $(inputWidget).draggable(); }
    }
    //Virtual Displays
    for (var i = 0; i < virtualDisplayCount; i++) {
        dashboardData["vDisps"][i]["dispMsg"] = "";
        var displayWidget = document.createElement("span");
        displayWidget.className = "widgetBlock";
        var headerSpace = document.createElement("span");
        headerSpace.appendChild(document.createTextNode(dashboardData["vDisps"][i]["Id"]));
        headerSpace.className = "widgetHeader";
        displayWidget.appendChild(headerSpace);
        var displaySpace = document.createElement("span");
        var displayNode = document.createTextNode(" ");
        displaySpace.appendChild(displayNode);
        displaySpace.setAttribute("id", ("vDisp" + (i.toString())));
        displaySpace.className = "widgetContent";
        displayWidget.appendChild(displaySpace);
        widgetBoardSpace.appendChild(displayWidget);
        widgetElements["displayWidgets"][i] = displayWidget;
        if (!previousConfigurationExists) { $(displayWidget).draggable(); }
    }
    //Virtual Consoles
    for (var i = 0; i < virtualConsoleCount; i++) {
        dashboardData["vCons"][i]["consMsg"] = "";
        var consoleWidget = document.createElement("span");
        consoleWidget.className = "widgetBlock";
        consoleWidget.style = "padding: 0px 0px 5px 0px;";
        var headerSpace = document.createElement("span");
        headerSpace.appendChild(document.createTextNode(dashboardData["vCons"][i]["Id"]));
        headerSpace.className = "widgetHeader";
        consoleWidget.appendChild(headerSpace);
        var consoleSpace = document.createElement("span");
        var consoleWindow = document.createElement("TEXTAREA");
        consoleWindow.cols = 30;
        consoleWindow.rows = 10;
        consoleWindow.value = ">";
        consoleWindow.readOnly = true;
        consoleWindow.setAttribute("overflow", "auto");
        consoleWindow.setAttribute("id", ("vCons" + (i.toString())));
        consoleSpace.appendChild(consoleWindow);
    	var br = document.createElement("br");
    	consoleSpace.appendChild(br);
    	var consoleSaveBtn = document.createElement("BUTTON");
    	consoleSaveBtn.setAttribute("id", ("consSaveBtn"+(i.toString())));
    	consoleSaveBtn.appendChild(document.createTextNode("Download"));
        consoleSaveBtn.className = "btn btn-secondary btn-sm";
    	consoleSaveBtn.style = "float: right;";
    	var saveLogDataFile = function(index) {
      	    return function() {
        	    downloadToFile(dashboardData["vCons"][index]["consMsg"], 'LogSave.txt', 'text/plain');
      	    }
      	}(i);
    	consoleSaveBtn.addEventListener("click", saveLogDataFile);
    	consoleSpace.appendChild(consoleSaveBtn);
        consoleSpace.className = "widgetContent";
        consoleWidget.appendChild(consoleSpace);
        widgetBoardSpace.appendChild(consoleWidget);
        widgetElements["consoleWidgets"][i] = consoleWidget;
        if (!previousConfigurationExists) { $(consoleWidget).draggable(); }
    }
    //Virtual Buttons
    for (var i = 0; i < virtualButtonCount; i++) {
        var buttonWidget = document.createElement("span");
        buttonWidget.className = "widgetBlock";
        var headerSpace = document.createElement("span");
        headerSpace.appendChild(document.createTextNode(dashboardData["vBtns"][i]["Id"]));
        headerSpace.className = "widgetHeader";
        buttonWidget.appendChild(headerSpace);
        var buttonSpace = document.createElement("span");
        var buttonField = document.createElement("BUTTON");
        buttonField.setAttribute("id", ("vBtn" + (i.toString())));
        if ((dashboardData["vBtns"][i]["Params"][1]) == 1) {
            buttonField.appendChild(document.createTextNode(dashboardData["vBtns"][i]["Params"][2]));
            buttonField.className = "btn btn-secondary";
        } else {
            buttonField.appendChild(document.createTextNode(dashboardData["vBtns"][i]["Params"][3]));
            buttonField.className = "btn btn-secondary disabled";
        }
        buttonSpace.appendChild(buttonField);
        buttonSpace.className = "widgetContent";
        buttonWidget.appendChild(buttonSpace);
        widgetBoardSpace.appendChild(buttonWidget);
        widgetElements["buttonWidgets"][i] = buttonWidget;
        if (!previousConfigurationExists) { $(buttonWidget).draggable(); }
        var handleVirtualButtons = function(index) {
            return function() {
                if (dashboardData["vBtns"][index]["Params"][1] == 1) {
                    dashboardData["vBtns"][index]["Params"][1] = 0;
                    document.getElementById("vBtn" + index).className = "btn btn-secondary disabled";
                    document.getElementById("vBtn" + index).innerText = dashboardData["vBtns"][index]["Params"][3];
                } else {
                    dashboardData["vBtns"][index]["Params"][1] = 1;
                    document.getElementById("vBtn" + index).className = "btn btn-secondary";
                    document.getElementById("vBtn" + index).innerText = dashboardData["vBtns"][index]["Params"][2];
                }
            }
        }(i);
        if (dashboardData["vBtns"][i]["Params"][0] == 1) {
            buttonField.addEventListener("mouseup", handleVirtualButtons);
            buttonField.addEventListener("mousedown", handleVirtualButtons);
        } else {
            buttonField.addEventListener("click", handleVirtualButtons);
        }
    }
    dashIsInitialized = true;
    repVirtualInputs = window.setInterval(handleVirtualInputs, 50); //Set interval to update virtual inputs
    repVirtualDisplays = window.setInterval(handleVirtualDisplays, 50); //Set interval to update virtual display
    repVirtualConsoles = window.setInterval(handleVirtualConsoles, 50); //Set interval to update virtual console
    repSendData = window.setInterval(sendData, 50); //Set interval for the json websocket transmission

    $(".lock").click(function() {
        if (typeof(Storage) !== "undefined") {
            $(this).toggleClass("unlocked");
            if (document.getElementById("posLock").className == "lock unlocked") {
                console.log("UNLOCKED");
                for (var i = 0; i < gamepadCount; i++) { $(widgetElements["gamepadWidgets"][i]).draggable(); }
                for (var i = 0; i < virtualInputCount; i++) { $(widgetElements["inputWidgets"][i]).draggable(); }
                for (var i = 0; i < virtualButtonCount; i++) { $(widgetElements["buttonWidgets"][i]).draggable(); }
                for (var i = 0; i < virtualDisplayCount; i++) { $(widgetElements["displayWidgets"][i]).draggable(); }
                for (var i = 0; i < virtualConsoleCount; i++) { $(widgetElements["consoleWidgets"][i]).draggable(); }
            } else {
                console.log("LOCKED\n");
                var positionSaveConfig = { "gamepadWidgets": [], "inputWidgets": [], "buttonWidgets": [], "displayWidgets": [], "consoleWidgets": [] };
                for (var i = 0; i < gamepadCount; i++) {
                    var offset = $(widgetElements["gamepadWidgets"][i]).offset();
                    positionSaveConfig["gamepadWidgets"][i] = { "x": offset.left, "y": offset.top };
                    // console.log("gamePad "+String(i)+" X: "+String(offset.left)+"   Y: "+String(offset.top));
                    $(widgetElements["gamepadWidgets"][i]).draggable("destroy");
                }
                for (var i = 0; i < virtualInputCount; i++) {
                    var offset = $(widgetElements["inputWidgets"][i]).offset();
                    positionSaveConfig["inputWidgets"][i] = { "x": offset.left, "y": offset.top };
                    // console.log("vInput "+String(i)+" X: "+String(offset.left)+"   Y: "+String(offset.top));
                    $(widgetElements["inputWidgets"][i]).draggable("destroy");
                }
                for (var i = 0; i < virtualButtonCount; i++) {
                    var offset = $(widgetElements["buttonWidgets"][i]).offset();
                    positionSaveConfig["buttonWidgets"][i] = { "x": offset.left, "y": offset.top };
                    // console.log("vButton "+String(i)+" X: "+String(offset.left)+"   Y: "+String(offset.top));
                    $(widgetElements["buttonWidgets"][i]).draggable("destroy");
                }
                for (var i = 0; i < virtualDisplayCount; i++) {
                    var offset = $(widgetElements["displayWidgets"][i]).offset();
                    positionSaveConfig["displayWidgets"][i] = { "x": offset.left, "y": offset.top };
                    // console.log("vDisplay "+String(i)+" X: "+String(offset.left)+"   Y: "+String(offset.top));
                    $(widgetElements["displayWidgets"][i]).draggable("destroy");
                }
                for (var i = 0; i < virtualConsoleCount; i++) {
                    var offset = $(widgetElements["consoleWidgets"][i]).offset();
                    positionSaveConfig["consoleWidgets"][i] = { "x": offset.left, "y": offset.top };
                    // console.log("vConsole "+String(i)+" X: "+String(offset.left)+"   Y: "+String(offset.top));
                    $(widgetElements["consoleWidgets"][i]).draggable("destroy");
                }
                localStorage.setItem("positionSaveConfig", JSON.stringify(positionSaveConfig));
            }
        } else {
            alert("Sorry, your browser doesn't support local web storage.");
        }
    });
    if (previousConfigurationExists) {
        for (var i = 0; i < gamepadCount; i++) {
            $(widgetElements["gamepadWidgets"][i]).css("position", "absolute");
            $(widgetElements["gamepadWidgets"][i]).css("left", previousConfigurationSave["gamepadWidgets"][i]["x"]);
            $(widgetElements["gamepadWidgets"][i]).css("top", previousConfigurationSave["gamepadWidgets"][i]["y"]);
        }
        for (var i = 0; i < virtualInputCount; i++) {
            $(widgetElements["inputWidgets"][i]).css("position", "absolute");
            $(widgetElements["inputWidgets"][i]).css("left", previousConfigurationSave["inputWidgets"][i]["x"]);
            $(widgetElements["inputWidgets"][i]).css("top", previousConfigurationSave["inputWidgets"][i]["y"]);
        }
        for (var i = 0; i < virtualDisplayCount; i++) {
            $(widgetElements["displayWidgets"][i]).css("position", "absolute");
            $(widgetElements["displayWidgets"][i]).css("left", previousConfigurationSave["displayWidgets"][i]["x"]);
            $(widgetElements["displayWidgets"][i]).css("top", previousConfigurationSave["displayWidgets"][i]["y"]);
        }
        for (var i = 0; i < virtualButtonCount; i++) {
            $(widgetElements["buttonWidgets"][i]).css("position", "absolute");
            $(widgetElements["buttonWidgets"][i]).css("left", previousConfigurationSave["buttonWidgets"][i]["x"]);
            $(widgetElements["buttonWidgets"][i]).css("top", previousConfigurationSave["buttonWidgets"][i]["y"]);
        }
        for (var i = 0; i < virtualConsoleCount; i++) {
            $(widgetElements["consoleWidgets"][i]).css("position", "absolute");
            $(widgetElements["consoleWidgets"][i]).css("left", previousConfigurationSave["consoleWidgets"][i]["x"]);
            $(widgetElements["consoleWidgets"][i]).css("top", previousConfigurationSave["consoleWidgets"][i]["y"]);
        }
    }
}

//This function can download a text file give the creation parameters
function downloadToFile(content, filename, contentType) {
    var a = document.createElement('a');
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}

//The function that checks and updates the values from virtual inputs
function handleVirtualInputs() {
    for (var i = 0; i < virtualInputCount; i++) {
        dashboardData["vInps"][i]["inpValue"] = document.getElementById("vInp" + i).value;
    }
}

//The function that updates the virtual displays on the dashboard
function handleVirtualDisplays() {
    for (var i = 0; i < virtualDisplayCount; i++) {
        document.getElementById("vDisp" + i).innerText = dashboardData["vDisps"][i]["dispMsg"];
    }
}

//The function that updates the virtual consoles on the dashboard
function handleVirtualConsoles() {
    for (var i = 0; i < virtualConsoleCount; i++) {
        var consoleObj = document.getElementById("vCons" + i);
        consoleObj.value = String((dashboardData["vCons"][i]["consMsg"]));
        consoleObj.scrollTop = consoleObj.scrollHeight;
    }
}

//The function that updates the driver dashboard with incoming messages
function updateDashboard() {
    for (var i = 0; i < virtualDisplayCount; i++) {
        dashboardData["vDisps"][i]["dispMsg"] = (arguments[0])["vDisps"][i];
    }
    for (var i = 0; i < virtualConsoleCount; i++) {
        if (typeof(arguments[0])["vCons"][i] !== "undefined") {
            dashboardData["vCons"][i]["consMsg"] += (arguments[0])["vCons"][i];
        }
    }
}

//The functions for the enable and disable buttons
function openWebsocket() {
    //Starts websocket pointed at given domain. This domain must be changed to the local IP if mDNS is not being used.
    ws = new WebSocket("ws://robot.local/");
    //Funtion to be used when the enable button is pressed
    ws.onopen = function() {
        $("#connectButton").text("Enabled").removeClass("btn-outline-success").addClass("btn-success").prop('disabled', true);
        $("#disconnectButton").text("Disable").removeClass("btn-danger").addClass("btn-outline-danger").prop('disabled', false);
        connectedToWebSocket = true;
    };

    //Function to be used when the disable button is pressed
    ws.onclose = function() {
        $("#connectButton").text("Enable").removeClass("btn-success").addClass("btn-outline-success").prop('disabled', false);
        $("#disconnectButton").text("Disabled").removeClass("btn-outline-danger").addClass("btn-danger").prop('disabled', true);
        connectedToWebSocket = false;
        dashIsInitialized = false;
        dashboardData = {};
        window.clearInterval(repVirtualInputs); //Stop updating virtual inputs
        window.clearInterval(repVirtualDisplays); //Stop updating virtual displays
        window.clearInterval(repVirtualConsoles); //Stop updating virtual consoles
        window.clearInterval(repSendData); //Stop the websocket processes
        location.reload();
        return false;
    };

    //Function to recive incoming messages
    ws.onmessage = function(event) {
        if (dashIsInitialized) {
            updateDashboard(JSON.parse(event.data));
        } else {
            initializeDashboard(event.data);
        }
    };
}

//These functions are for dealing with the websocket and controler api
function closeWebsocket() { ws.close(); }

function canGame() { return "getGamepads" in navigator; }
//The function that sends out going update messages
function sendData() {
    var dataPacketToSend = {};
    dataPacketToSend["gp"] = dashboardData["gp"];
    dataPacketToSend["vBtns"] = [];
    dataPacketToSend["vInps"] = [];
    for (var i = 0; i < virtualButtonCount; i++) { dataPacketToSend["vBtns"][i] = dashboardData["vBtns"][i]["Params"][1]; }
    for (var i = 0; i < virtualInputCount; i++) { dataPacketToSend["vInps"][i] = dashboardData["vInps"][i]["inpValue"]; }
    ws.send(JSON.stringify(dataPacketToSend));
    //console.log(JSON.stringify(((verboseConsoleLogs)? dashboardData: dataPacketToSend)));
}

//This function reads the controler, updates the webpage values, and puts values in json data
function reportOnGamepad() {
    var gp = navigator.getGamepads()[0]; //Get gamepad data
    if (dashIsInitialized) {
        for (var i = 0; i < gp.buttons.length; i++) { //Parse through the buttons to check their states
            dashboardData.gp.btns[i] = ((gp.buttons[i].pressed) ? (1) : (0));
        }
        for (var i = 0; i < gp.axes.length; i++) { //Parse throught the joysticks to check their states
            dashboardData.gp.axes[i] = Math.round(((gp.axes[i]).toFixed(2)) * 100);
        }
    }
    var htmlHeader = ""; //Create a variable to hold constructed header HTML
    var html = ""; //Create variable to hold constructed HTML output
    htmlHeader += gp.id; //Get the controler devices ID
    for (var i = 0; i < gp.buttons.length; i++) { //Parse through buttons
        var buttonNum = (i + 1);
        html += "Button " + buttonNum + ": ";
        if (gp.buttons[i].pressed) { //Check if button is pressed
            html += " pressed";
        }
        html += "<br/>"; //Add break to constructed HTML output
    }
    for (var i = 0; i < gp.axes.length; i += 2) { //Parse throught the joystics
        var joyNum = (Math.ceil(i / 2) + 1);
        var joyX = Math.round(((gp.axes[i]).toFixed(2)) * 100);
        var joyY = Math.round(((gp.axes[i + 1]).toFixed(2)) * 100);
        html += "Stick " + joyNum + ": " + joyX + "," + joyY + "<br/>"; //Add joystick data to the constructed HTML
    }
    document.getElementById("gamepadHeader").innerHTML = htmlHeader.replace(/ \([\s\S]*?\)/g, ''); //Display the constructed HTML header output
    document.getElementById("gamepadDisplay").innerHTML = html; //Display the constructed HTML output
}

//Runs at begining
$(document).ready(function() {
    $("#disconnectButton").text("Disabled").removeClass("btn-outline-danger").addClass("btn-danger").prop('disabled', true);
    document.getElementById("gamepadWidget").style.display = "none";
    if (canGame()) {
        $(window).on("gamepadconnected", function() {
            hasGP = true;
            document.getElementById("gamepadWidget").style.display = "block";
            repGP = window.setInterval(reportOnGamepad, 100); //Set interval for websocket data return rate
        });

        //This is the function run when the controller is disconnected
        $(window).on("gamepaddisconnected", function() {
            document.getElementById("gamepadWidget").style.display = "none";
            window.clearInterval(repGP); //Stop trying to update gamepad data
        });

        //setup an interval for Chrome
        var checkGP = window.setInterval(function() {
            if (navigator.getGamepads()[0]) {
                if (!hasGP) $(window).trigger("gamepadconnected");
                window.clearInterval(checkGP);
            }
        }, 500);
    }
});
