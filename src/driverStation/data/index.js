var repGP;
var repSendData;
var repVirtualInputs;
var repVirtualDisplays;
var repVirtualConsoles;
var ws = null;
var connectedToWebSocket = false;
var dashIsInitialized = false;
var hasGP = false;
var leftPower, rightPower;
var settingConfiguration;


//Variable to hold dashboard widget runtime data
var dashboardData = {};

//Array to hold the dashboard widget elements
var widgetElements = {
    "countList": {"buttonWidgets": 0, "inputWidgets": 0, "displayWidgets": 0, "consoleWidgets": 0, "gamepadWidgets": 1}, 
    "buttonWidgets": [],  
    "inputWidgets": [], 
    "displayWidgets": [], 
    "gamepadWidgets": [],
    "consoleWidgets": []
};

//The function that initializes the driver dashboard
function initializeDashboard() {
    dashboardData = JSON.parse(arguments[0]);
    widgetElements["countList"]["buttonWidgets"] = Object.keys(dashboardData["vBtns"]).length;
    widgetElements["countList"]["inputWidgets"] = Object.keys(dashboardData["vInps"]).length;
    widgetElements["countList"]["displayWidgets"] = Object.keys(dashboardData["vDisps"]).length;
    widgetElements["countList"]["consoleWidgets"] = Object.keys(dashboardData["vCons"]).length;
    var widgetBoardSpace = document.getElementById("widgetBoard");
    var previousConfigurationSave = {}; //Variable to hold the state of wether a previous widget position configuration exists
    var previousConfigurationExists = false;
    if(typeof(Storage) !== "undefined") {
        if(localStorage.saveConfig) {
            previousConfigurationExists = true;
            $("#posLock").toggleClass("unlocked");
            previousConfigurationSave = JSON.parse(localStorage.getItem("saveConfig"));
        }
        if(localStorage.settingsConfig) {
            settingConfiguration = JSON.parse(localStorage.getItem("settingsConfig"));
        } else {
            settingConfiguration = {"controlMode": "gpSelection", "invertedYAxis": false};
            localStorage.setItem("settingsConfig", JSON.stringify(settingConfigurationSave));
        }
    }

    for(let widgetType in widgetElements) {
        if(widgetType != "countList") {
            for(let widgetNum=0; widgetNum < widgetElements["countList"][widgetType]; widgetNum++) {
                widgetElements[widgetType][widgetNum] = {};
                widgetElements[widgetType][widgetNum]["widget"] = document.createElement("div");
                widgetElements[widgetType][widgetNum]["widget"].className = "widgetBlock";
                widgetElements[widgetType][widgetNum]["sizers"] = document.createElement("div");
                widgetElements[widgetType][widgetNum]["sizers"].className = "resizers";
                widgetElements[widgetType][widgetNum]["header"] = document.createElement("div");
                widgetElements[widgetType][widgetNum]["header"].className = "widgetHeader unselectable";
                widgetElements[widgetType][widgetNum]["sizers"].appendChild(widgetElements[widgetType][widgetNum]["header"]);
                widgetElements[widgetType][widgetNum]["content"] = document.createElement("div");
                widgetElements[widgetType][widgetNum]["content"].className = "widgetContent";
                widgetElements[widgetType][widgetNum]["sizers"].appendChild(widgetElements[widgetType][widgetNum]["content"]);
                let inputSizer1 = document.createElement("div");
                inputSizer1.className = 'resizer top-left';
                widgetElements[widgetType][widgetNum]["sizers"].appendChild(inputSizer1);
                let inputSizer2 = document.createElement("div");
                inputSizer2.className = 'resizer top-right';
                widgetElements[widgetType][widgetNum]["sizers"].appendChild(inputSizer2);
                let inputSizer3 = document.createElement("div");
                inputSizer3.className = 'resizer bottom-left';
                widgetElements[widgetType][widgetNum]["sizers"].appendChild(inputSizer3);
                let inputSizer4 = document.createElement("div");
                inputSizer4.className = 'resizer bottom-right';
                widgetElements[widgetType][widgetNum]["sizers"].appendChild(inputSizer4);
                widgetElements[widgetType][widgetNum]["widget"].appendChild(widgetElements[widgetType][widgetNum]["sizers"]);
                widgetBoardSpace.appendChild(widgetElements[widgetType][widgetNum]["widget"]);
            }
        }
    } 

    //Gamepad
    if(settingConfiguration["controlMode"] == "gpSelection") {
        widgetElements["gamepadWidgets"][0]["widget"].style.setProperty("min-height", "100px");
        dashboardData["gp"] = [];
        dashboardData["gp"] = { "btns": [], "axes": [] };
        for (var i = 0; i < 16; i++) {dashboardData["gp"]["btns"][i] = 0;}
        for (var i = 0; i < 4; i++) {dashboardData["gp"]["axes"][i] = 0;}
        widgetElements["gamepadWidgets"][0]["widget"].style.display = "none";
        widgetElements["gamepadWidgets"][0]["header"].appendChild(document.createTextNode(""));
        widgetElements["gamepadWidgets"][0]["header"].style.setProperty("padding", "5px 10px");
        widgetElements["gamepadWidgets"][0]["content"].style.setProperty("text-align", "left");
        if (canGame()) {
            //This is the function run when the controller is connected
            $(window).on("gamepadconnected", function() {
                hasGP = true;
                widgetElements["gamepadWidgets"][0]["header"].innerText = navigator.getGamepads()[0].id.replace(/ \([\s\S]*?\)/g, '');
                widgetElements["gamepadWidgets"][0]["widget"].style.display = "block";
                if($(".lock")[0].className == "lock unlocked") {
                    makeWidgetResizable("gamepadWidgets", 0, "y");
                    makeWidgetDraggable("gamepadWidgets", 0);
                }
                repGP = window.setInterval(handleGamepads, 50); //Set interval for websocket data return rate
            });
            //This is the function run when the controller is disconnected
            $(window).on("gamepaddisconnected", function() {
                hasGP = false;
                widgetElements["gamepadWidgets"][0]["widget"].style.display = "none";
                window.clearInterval(repGP); //Stop trying to update gamepad data
            });
            //setup interval for gamepad controller
            var checkGP = window.setInterval(function() {
                if (navigator.getGamepads()[0]) {
                    if (!hasGP) $(window).trigger("gamepadconnected");
                    window.clearInterval(checkGP);
                }
            }, 500);
        }
    } else {
        widgetElements["gamepadWidgets"][0]["header"].innerHTML = "Keyboard Input";
        widgetElements["gamepadWidgets"][0]["header"].style.setProperty("padding", "5px 10px");
        widgetElements["gamepadWidgets"][0]["widget"].style.height = "144px"; 
        widgetElements["gamepadWidgets"][0]["widget"].style.width = "173.89px";
        dashboardData["gp"] = [];
        dashboardData["gp"] = { "btns": [], "axes": [] };

        for (var i = 0; i < 16; i++) { dashboardData["gp"]["btns"][i] = 0; }
        for (var i = 0; i < 4; i++) { dashboardData["gp"]["axes"][i] = 0; }

        let topButtonRow = document.createElement("div");
        let bottomButtonsRow = document.createElement("div");
        let buttonList = [];

        function setJoyFromKey() {
            let num = arguments[0];
            switch(num) {
                case("0"):
                    dashboardData["gp"]["axes"][1] = ((!settingConfiguration["invertedYAxis"])? -100:100);
                    dashboardData["gp"]["axes"][3] = ((!settingConfiguration["invertedYAxis"])?-100:100);
                    break;
                case("1"):
                    dashboardData["gp"]["axes"][1] = ((!settingConfiguration["invertedYAxis"])? 100:-100);
                    dashboardData["gp"]["axes"][3] = ((!settingConfiguration["invertedYAxis"])? -100:100);
                    break;
                case("2"):
                    dashboardData["gp"]["axes"][1] = ((!settingConfiguration["invertedYAxis"])? 100:-100); 
                    dashboardData["gp"]["axes"][3] = ((!settingConfiguration["invertedYAxis"])? 100:-100);
                    break;
                case("3"):
                    dashboardData["gp"]["axes"][1] = ((!settingConfiguration["invertedYAxis"])? -100:100);
                    dashboardData["gp"]["axes"][3] = ((!settingConfiguration["invertedYAxis"])? 100:-100);
                    break;
            }
        }

        function resetJoyFromKey() {
            dashboardData["gp"]["axes"][1] = 0;
            dashboardData["gp"]["axes"][3] = 0;
        }

        for(let i=0; i<4; i++) { buttonList[i] = document.createElement("BUTTON"); }
        topButtonRow.className = "d-flex justify-content-center";
        topButtonRow.style = "margin: 0px 0px 10px 0px";
        bottomButtonsRow.classname = "d-flex justify-content-left";

        for(let num in buttonList) { 
            let whileBeingClicked;
            let movedOffWhileHeld = function() {
                buttonList[num].className = "btn btn-secondary";
                buttonList[num].style.setProperty("outline", "none");
                clearInterval(whileBeingClicked);
                resetJoyFromKey();
                buttonList[num].removeEventListener("mouseout", movedOffWhileHeld);
            };

            buttonList[num].className = "btn btn-secondary";
            buttonList[num].style.setProperty("box-shadow", "none");
            buttonList[num].onmouseup = function() { this.blur(); };
            buttonList[num].addEventListener("mousedown", function() {
                whileBeingClicked = setInterval(function() {
                    setJoyFromKey(num);
                }, 20);
                buttonList[num].className = "btn btn-secondary active";
                buttonList[num].addEventListener("mouseout", movedOffWhileHeld);
            });

            buttonList[num].addEventListener("mouseup", function() {
                buttonList[num].className = "btn btn-secondary";
                buttonList[num].removeEventListener("mouseout", movedOffWhileHeld);
                clearInterval(whileBeingClicked);
                resetJoyFromKey();
            }); 
        }

        topButtonRow.appendChild(buttonList[0]);
        for(let i=1; i<4; i++) {
            buttonList[i].style.setProperty("margin", "0px 5px 0px 5px");
            bottomButtonsRow.appendChild(buttonList[i]);
        }

        widgetElements["gamepadWidgets"][0]["content"].appendChild(topButtonRow);
        widgetElements["gamepadWidgets"][0]["content"].appendChild(bottomButtonsRow);
        let keyCodes = [];
        let lables = [];

        if(settingConfiguration["controlMode"] == "wasdSelection") {
            lables = ["W", "A", "S", "D"];
            for(let num in buttonList) { buttonList[num].style.setProperty("width", "41.3px"); }
            keyCodes = [87, 65, 83, 68];
        } else if(settingConfiguration["controlMode"] == "arrowsSelection") {
            lables = ["⮝", "⮜", "⮟", "⮞"];
            for(let num in buttonList) { buttonList[num].style.removeProperty("width"); }
            keyCodes = [38, 37, 40, 39];
        }

        for(let num in buttonList) { buttonList[num].innerHTML = lables[num]; }

        var checkForPress = function(e) {
            for(let num in buttonList) {
                if(e.keyCode == keyCodes[num]) {
                    buttonList[num].className = "btn btn-secondary active";
                    setJoyFromKey(num);
                }
            }
        };

        var checkForRelease = function(e) {
            for(let num in buttonList) {
                if(e.keyCode == keyCodes[num]) {
                    buttonList[num].className = "btn btn-secondary";
                }
            }
            resetJoyFromKey();
        };

        let cursorIsInside = false;
        widgetElements["gamepadWidgets"][0]["widget"].addEventListener("mouseover", function() { cursorIsInside = true });
        widgetElements["gamepadWidgets"][0]["widget"].addEventListener("mouseout", function() { cursorIsInside = false });

        document.addEventListener('click', function() {
            if(cursorIsInside) {
                document.addEventListener("keydown", checkForPress);
                document.addEventListener("keyup", checkForRelease);
            } else {
                document.removeEventListener("keydown", checkForPress);
                document.removeEventListener("keyup", checkForRelease);
                resetJoyFromKey();
            }
        });
    }

    //Virtual Inputs
    for (let i = 0; i < widgetElements["countList"]["inputWidgets"]; i++) {
        widgetElements["inputWidgets"][i]["widget"].style.setProperty("min-width", "97px");
        widgetElements["inputWidgets"][i]["widget"].style.setProperty("min-height", "56px");
        dashboardData["vInps"][i]["inpValue"] = 0.0;
        widgetElements["inputWidgets"][i]["header"].appendChild(document.createTextNode(dashboardData["vInps"][i]["Id"]));
        widgetElements["inputWidgets"][i]["input"] = document.createElement("INPUT");
        let inputField = widgetElements["inputWidgets"][i]["input"];
        inputField.setAttribute("type", "number");
        inputField.setAttribute("value", "0.00");
        inputField.style.width = "80px";
        widgetElements["inputWidgets"][i]["content"].appendChild(inputField);
    }

    //Virtual Displays
    for (let i = 0; i < widgetElements["countList"]["displayWidgets"]; i++) {
        widgetElements["displayWidgets"][i]["widget"].style.setProperty("min-width", "97px");
        widgetElements["displayWidgets"][i]["widget"].style.setProperty("min-height", "56px");
        dashboardData["vDisps"][i]["dispMsg"] = "";
        widgetElements["displayWidgets"][i]["header"].appendChild(document.createTextNode(dashboardData["vDisps"][i]["Id"]));
        let displayNode = document.createTextNode(" ");
        widgetElements["displayWidgets"][i]["content"].appendChild(displayNode);
    }

    //Virtual Consoles
    for (let i = 0; i < widgetElements["countList"]["consoleWidgets"]; i++) {
        widgetElements["consoleWidgets"][i]["widget"].style.setProperty("min-width", "180px");
        widgetElements["consoleWidgets"][i]["widget"].style.setProperty("min-height", "200px");
        widgetElements["consoleWidgets"][i]["content"].style.setProperty("padding", "15px 10px 5px 10px");
        dashboardData["vCons"][i]["consMsg"] = "";
        widgetElements["consoleWidgets"][i]["header"].appendChild(document.createTextNode(dashboardData["vCons"][i]["Id"]));
        widgetElements["consoleWidgets"][i]["textarea"] = document.createElement("TEXTAREA");
        widgetElements["consoleWidgets"][i]["textarea"].cols = 30;
        widgetElements["consoleWidgets"][i]["textarea"].rows = 10;
        widgetElements["consoleWidgets"][i]["textarea"].value = ">";
        widgetElements["consoleWidgets"][i]["textarea"].readOnly = true;
        widgetElements["consoleWidgets"][i]["textarea"].setAttribute("overflow", "auto");
        widgetElements["consoleWidgets"][i]["textarea"].style.setProperty("resize", "none");
        widgetElements["consoleWidgets"][i]["textarea"].style.setProperty("outline", "none");
        widgetElements["consoleWidgets"][i]["content"].appendChild(widgetElements["consoleWidgets"][i]["textarea"]);
        let buttonSpace = document.createElement("div");
        buttonSpace.style.setProperty("text-align", "right");
        let consoleClearBtn = document.createElement("BUTTON");
        consoleClearBtn.appendChild(document.createTextNode("Clear"));
        consoleClearBtn.className = "btn btn-secondary btn-sm";
        consoleClearBtn.style.setProperty("padding", "0px 5px");
        consoleClearBtn.style.setProperty("margin", "0px 5px 0px 0px");
        let clearLogData = function(index) { return function() { dashboardData["vCons"][index]["consMsg"] = ""; }}(i);
        consoleClearBtn.addEventListener("click", clearLogData);
        buttonSpace.appendChild(consoleClearBtn);
        let consoleSaveBtn = document.createElement("BUTTON");
        consoleSaveBtn.appendChild(document.createTextNode("Download"));
        consoleSaveBtn.className = "btn btn-secondary btn-sm";
        consoleSaveBtn.style.setProperty("padding", "0px 5px");
        let saveLogDataFile = function(index) { return function() { downloadToFile(dashboardData["vCons"][index]["consMsg"], 'LogSave.txt', 'text/plain'); }}(i);
        consoleSaveBtn.addEventListener("click", saveLogDataFile);
        buttonSpace.appendChild(consoleSaveBtn);
        widgetElements["consoleWidgets"][i]["content"].appendChild(buttonSpace);
    }

    //Virtual Buttons
    for (let i = 0; i < widgetElements["countList"]["buttonWidgets"]; i++) {
        widgetElements["buttonWidgets"][i]["header"].appendChild(document.createTextNode(dashboardData["vBtns"][i]["Id"]));
        widgetElements["buttonWidgets"][i]["widget"].style.setProperty("min-width", "98px");
        widgetElements["buttonWidgets"][i]["widget"].style.setProperty("min-height", "56px");
        widgetElements["buttonWidgets"][i]["button"] = document.createElement("BUTTON");
        widgetElements["buttonWidgets"][i]["button"].style.setProperty("box-shadow", "none");
        widgetElements["buttonWidgets"][i]["button"].onmouseup = function() { this.blur(); };
        if ((dashboardData["vBtns"][i]["Params"][1]) == 1) {
            widgetElements["buttonWidgets"][i]["button"].appendChild(document.createTextNode(dashboardData["vBtns"][i]["Params"][2]));
            widgetElements["buttonWidgets"][i]["button"].className = "btn btn-secondary active";
        } else {
            widgetElements["buttonWidgets"][i]["button"].appendChild(document.createTextNode(dashboardData["vBtns"][i]["Params"][3]));
            widgetElements["buttonWidgets"][i]["button"].className = "btn btn-secondary";
        }
        
        let handleVirtualButtons = function() {
            if (dashboardData["vBtns"][i]["Params"][1] == 1) {
                dashboardData["vBtns"][i]["Params"][1] = 0;
                widgetElements["buttonWidgets"][i]["button"].innerText = dashboardData["vBtns"][i]["Params"][3];
            } else {
                dashboardData["vBtns"][i]["Params"][1] = 1;
                widgetElements["buttonWidgets"][i]["button"].innerText = dashboardData["vBtns"][i]["Params"][2];
            }
            widgetElements["buttonWidgets"][i]["button"].classList.toggle("active");
        };
        
        let handleLetGo = function() { 
            handleVirtualButtons();
            widgetElements["buttonWidgets"][i]["button"].removeEventListener("mouseout", handleLetGo);
            widgetElements["buttonWidgets"][i]["button"].removeEventListener("mouseup", handleLetGo);
        };

        let handleVirtualButtonsMomentary = function() {
            handleVirtualButtons();
            widgetElements["buttonWidgets"][i]["button"].addEventListener("mouseout", handleLetGo);
            widgetElements["buttonWidgets"][i]["button"].addEventListener("mouseup", handleLetGo);
        };

        if (dashboardData["vBtns"][i]["Params"][0] == 1) {
            widgetElements["buttonWidgets"][i]["button"].addEventListener("mousedown", handleVirtualButtonsMomentary);
        } else { 
            widgetElements["buttonWidgets"][i]["button"].addEventListener("click", handleVirtualButtons);
        }

        widgetElements["buttonWidgets"][i]["button"].style.setProperty("float", "center")
        widgetElements["buttonWidgets"][i]["content"].appendChild(widgetElements["buttonWidgets"][i]["button"]);
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
                for(let widgetType in widgetElements) {
                    if(widgetType != "countList") {
                        for(let widgetNum in widgetElements[widgetType]) {
                            if(widgetType != "gamepadWidgets" || (hasGP == true && settingConfiguration["controlMode"] == "gpSelection")) {
                                widgetElements[widgetType][widgetNum]["widget"].style.borderRadius = "0px";
                                //Type dependent settings
                                if(widgetType != "consoleWidgets" && widgetType != "gamepadWidgets") {
                                    makeWidgetResizable(widgetType, widgetNum, "x");
                                } else if(widgetType == "gamepadWidgets") {
                                    makeWidgetResizable(widgetType, widgetNum, "y");
                                } else if(widgetType == "consoleWidgets") {
                                    makeWidgetResizable(widgetType, widgetNum, "both");
                                }
                                makeWidgetDraggable(widgetType, widgetNum);
                            } else if(widgetType == "gamepadWidgets" && (settingConfiguration["controlMode"] == "wasdSelection" || settingConfiguration["controlMode"] == "arrowsSelection")) {
                                makeWidgetResizable(widgetType, widgetNum, "neither");
                                makeWidgetDraggable(widgetType, widgetNum);
                            }
                        } 
                    }
                }
            } else {
                console.log("LOCKED\n");
                let saveConfig = {};
                if(previousConfigurationExists) {
                    saveConfig = previousConfigurationSave;
                } else {
                    saveConfig = {"gamepadWidgets": [], "inputWidgets": [], "buttonWidgets": [], "displayWidgets": [], "consoleWidgets": []};
                    for(let type in saveConfig) {
                        for(let num in widgetElements[type]) { saveConfig[type][num] = {"position": {}, "size": {}}; }
                    }
                }
                for(let widgetType in widgetElements) {
                    if(widgetType != "countList") {
                        for(let widgetNum in widgetElements[widgetType]) {
                            if(widgetType != "gamepadWidgets" || (hasGP == true && settingConfiguration["controlMode"] == "gpSelection")) {
                                widgetElements[widgetType][widgetNum]["widget"].style.borderRadius = "8px";
                                stopDragging(widgetType, widgetNum);
                                stopResizing(widgetType, widgetNum);
                                let positionBox = widgetElements[widgetType][widgetNum]["widget"].getBoundingClientRect();
                                saveConfig[widgetType][widgetNum]["position"] = {"x": ((positionBox.left)+"px"), "y": ((positionBox.top)+"px")};
                                switch(widgetType) {
                                    case("displayWidgets"):
                                        saveConfig[widgetType][widgetNum]["size"] = {"width": widgetElements[widgetType][widgetNum]["widget"].style.width}; 
                                        break;

                                    case("buttonWidgets"):
                                        saveConfig[widgetType][widgetNum]["size"] = {"width": widgetElements[widgetType][widgetNum]["widget"].style.width};
                                        break;

                                    case("inputWidgets"):
                                        saveConfig[widgetType][widgetNum]["size"] = {"width": widgetElements[widgetType][widgetNum]["widget"].style.width};
                                        break;

                                    case("gamepadWidgets"):
                                        saveConfig[widgetType][widgetNum]["size"] = {"height": widgetElements[widgetType][widgetNum]["content"].style.height};
                                        break;

                                    case("consoleWidgets"):
                                        saveConfig[widgetType][widgetNum]["size"] = {
                                            "height": widgetElements[widgetType][widgetNum]["widget"].style.height,
                                            "width": widgetElements[widgetType][widgetNum]["widget"].style.width
                                        }
                                        break;
                                }
                            } else if(widgetType == "gamepadWidgets" && (settingConfiguration["controlMode"] == "wasdSelection" || settingConfiguration["controlMode"] == "arrowsSelection")) {
                                stopDragging(widgetType, widgetNum);
                                stopResizing(widgetType, widgetNum);
                                let positionBox = widgetElements[widgetType][widgetNum]["widget"].getBoundingClientRect();
                                saveConfig[widgetType][widgetNum]["position"] = {"x": ((positionBox.left)+"px"), "y": ((positionBox.top)+"px")};
                            }
                        }
                    }
                }
                localStorage.setItem("saveConfig", JSON.stringify(saveConfig));
            }
        } else {
            alert("Sorry, your browser doesn't support local web storage.");
        }
    });
    if(previousConfigurationExists) {
        for(let widgetType in widgetElements) {
            if(widgetType != "countList") {
                for(let widgetNum in widgetElements[widgetType]) {
                    widgetElements[widgetType][widgetNum]["widget"].style.setProperty("position", "absolute");
                    switch(widgetType) {
                        case("displayWidgets"):
                            widgetElements[widgetType][widgetNum]["widget"].style.width = previousConfigurationSave[widgetType][widgetNum]["size"]["width"];
                            break;

                        case("buttonWidgets"):
                            widgetElements[widgetType][widgetNum]["widget"].style.width = previousConfigurationSave[widgetType][widgetNum]["size"]["width"];
                            widgetElements[widgetType][widgetNum]["button"].style.width = (parseFloat(widgetElements[widgetType][widgetNum]["widget"].style.width.replace("px", ""))-30+"px");
                            break;

                        case("inputWidgets"):
                            widgetElements[widgetType][widgetNum]["widget"].style.width = previousConfigurationSave[widgetType][widgetNum]["size"]["width"];
                            widgetElements[widgetType][widgetNum]["input"].style.width = (parseFloat(widgetElements[widgetType][widgetNum]["widget"].style.width.replace("px", ""))-20+"px");
                            break;

                        case("gamepadWidgets"):
                            if(settingConfiguration["controlMode"] == "gpSelection") { widgetElements[widgetType][widgetNum]["content"].style.height = previousConfigurationSave[widgetType][widgetNum]["size"]["height"]; }
                            break;

                        case("consoleWidgets"):
                            widgetElements[widgetType][widgetNum]["widget"].style.height = previousConfigurationSave[widgetType][widgetNum]["size"]["height"];
                            widgetElements[widgetType][widgetNum]["widget"].style.width = previousConfigurationSave[widgetType][widgetNum]["size"]["width"];
                            widgetElements[widgetType][widgetNum]["textarea"].style.height = (parseFloat(widgetElements[widgetType][widgetNum]["widget"].style.height.replace("px", ""))-82.7+"px");
                            widgetElements[widgetType][widgetNum]["textarea"].style.width = (parseFloat(widgetElements[widgetType][widgetNum]["widget"].style.width.replace("px", ""))-20+"px");
                            break;
                    }
                    widgetElements[widgetType][widgetNum]["widget"].style.setProperty("left", previousConfigurationSave[widgetType][widgetNum]["position"]["x"]);
                    widgetElements[widgetType][widgetNum]["widget"].style.setProperty("top", previousConfigurationSave[widgetType][widgetNum]["position"]["y"]);
                }
            }
        }
    } else {
        let placmentMatrix = {};
        let avgWidth = 0;
        let heights = {"buttonWidgets": 140, "inputWidgets": 248, "displayWidgets": 346, "consoleWidgets": 440, "gamepadWidgets": 754.7};
        for(let widgetType in widgetElements) {
            if(widgetType != "countList") {
                placmentMatrix[widgetType] = [];
                for(let widgetNum in widgetElements[widgetType]) {
                    if(widgetType != "consoleWidgets" && widgetType != "gamepadWidgets") {
                        makeWidgetResizable(widgetType, widgetNum, "x");
                    } else if(widgetType == "gamepadWidgets") {
                        if(settingConfiguration["controlMode"] == "gpSelection") {
                            makeWidgetResizable(widgetType, widgetNum, "y");
                        } else { 
                            makeWidgetResizable(widgetType, widgetNum, "neither");
                        }
                    } else if(widgetType == "consoleWidgets") {
                        makeWidgetResizable(widgetType, widgetNum, "both");
                    }
                    makeWidgetDraggable(widgetType, widgetNum);
                    avgWidth = (avgWidth + widgetElements[widgetType][widgetNum]["widget"].getBoundingClientRect().width);
                    placmentMatrix[widgetType][widgetNum] = {};
                }      
                avgWidth = (avgWidth / widgetElements[widgetType].length);
                for(let widgetNum in widgetElements[widgetType]) {
                    placmentMatrix[widgetType][widgetNum]["x"] = ((avgWidth + 10) * widgetNum);
                    placmentMatrix[widgetType][widgetNum]["y"] = heights[widgetType];
                }
                avgWidth = 0;
            }
        }
        for(let widgetType in widgetElements) {
            if(widgetType != "countList" && widgetType != "gamepadWidgets") {
                for(let widgetNum in widgetElements[widgetType]) {
                    widgetElements[widgetType][widgetNum]["widget"].style.setProperty("left", (placmentMatrix[widgetType][widgetNum]["x"]+"px"));
                    widgetElements[widgetType][widgetNum]["widget"].style.setProperty("top", (placmentMatrix[widgetType][widgetNum]["y"]+"px"));
                }
            } else if(widgetType == "gamepadWidgets" && (settingConfiguration["controlMode"] == "gpSelection")) {
                widgetElements[widgetType][0]["widget"].style.setProperty("left", (window.screen.width - 156.2813 + "px"));
                widgetElements[widgetType][0]["widget"].style.setProperty("top", (window.screen.height - 587 +"px"));
            } else if(widgetType == "gamepadWidgets" && (settingConfiguration["controlMode"] != "gpSelection")) {
                widgetElements[widgetType][0]["widget"].style.setProperty("left", (window.screen.width - 173.89 + "px"));
                widgetElements[widgetType][0]["widget"].style.setProperty("top", (window.screen.height - 587 +"px"));
            }
        }
    }
}

function makeWidgetResizable(widgetType, widgetNum, axis) {
    let element = widgetElements[widgetType][widgetNum]["widget"];
    element.classList.add("resizable");
    element.style.borderRadius = '0px';
    let resizers = element.querySelectorAll(" .resizer");
    let minimum_size = 5;
    let original_width = 0;
    let original_height = 0;
    let original_x = 0;
    let original_y = 0;
    let original_mouse_x = 0;
    let original_mouse_y = 0;
    switch(widgetType) {
        case("consoleWidgets"): 
            var consWindow = widgetElements[widgetType][widgetNum]["textarea"]; 
            consWindow.style.width = (parseFloat(consWindow.style.width.replace("px", ""))-10+"px");
            consWindow.style.height = (parseFloat(element.style.height.replace("px", ""))-82.7+"px");
            widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "10px 10px 2px 10px");
            break;

        case("inputWidgets"):
            var inpWindow = widgetElements[widgetType][widgetNum]["input"];
            inpWindow.style.width = (parseFloat(inpWindow.style.width.replace("px", ""))-10+"px");
            widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "10px 10px");
            break;

        case("gamepadWidgets"):
            if(hasGP == true && settingConfiguration["controlMode"] == "gpSelection") {
                var gpWindow = widgetElements[widgetType][widgetNum]["content"];
                widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "10px 10px");
                gpWindow.style.height = (parseFloat(gpWindow.style.height.replace("px", ""))-10+"px")
                widgetElements[widgetType][widgetNum]["header"].style.setProperty("padding", "5px 5px");
            } else {
                widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "10px 5px 10px 5px");
            }    
            break;

        case("buttonWidgets"):
            var btnWindow = widgetElements[widgetType][widgetNum]["button"];
            widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "10px 10px");
            break;

        case("displayWidgets"):
            widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "10px 10px");
            break;
    }
    for (let i = 0;i < resizers.length; i++) {
        const currentResizer = resizers[i];
        currentResizer.addEventListener('mousedown', function(e) {
            e.preventDefault()
            original_width = parseFloat(getComputedStyle(element, null).getPropertyValue('width').replace('px', ''));
            original_height = parseFloat(getComputedStyle(element, null).getPropertyValue('height').replace('px', ''));
            original_x = element.getBoundingClientRect().left;
            original_y = element.getBoundingClientRect().top;
            original_mouse_x = e.pageX;
            original_mouse_y = e.pageY;
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResize);
        })
        function resize(e) {
            if (currentResizer.classList.contains('bottom-right')) {
                var width = original_width + (e.pageX - original_mouse_x);
                var height = original_height + (e.pageY - original_mouse_y);
                if (width > minimum_size && (axis=="x" || axis=="both")) {
                    element.style.width = width + 'px';
                    if(widgetType == "consoleWidgets" && width > 180) { consWindow.style.width = ((width-30)+"px"); }
                    if(widgetType == "inputWidgets" && width > 97) { inpWindow.style.width = ((width-30)+"px"); }
                    if(widgetType == "buttonWidgets"  && width > 98) { btnWindow.style.width = ((width-35)+"px"); }  
                }
                if (height > minimum_size && (axis=="y" || axis=="both")) {
                    element.style.height = height + 'px';
                    if(widgetType == "consoleWidgets" && height > 200) { consWindow.style.height = ((height-82.7)+"px"); }
                    if(widgetType == "gamepadWidgets" && height > 100) { gpWindow.style.height = ((height-42)+"px"); }
                }
            } else if (currentResizer.classList.contains('bottom-left')) {
                var height = original_height + (e.pageY - original_mouse_y);
                var width = original_width - (e.pageX - original_mouse_x);
                if (height > minimum_size && (axis=="y" || axis=="both")) {
                    element.style.height = height + 'px';
                    if(widgetType == "consoleWidgets" && height > 200) { consWindow.style.height = ((height-82.7)+"px"); }
                    if(widgetType == "gamepadWidgets" && height > 100) { gpWindow.style.height = ((height-42)+"px"); }
                }
                if (width > minimum_size && (axis=="x" || axis=="both")) {
                    element.style.width = width + 'px';
                    element.style.left = original_x + (e.pageX - original_mouse_x) + 'px';
                    if(widgetType == "consoleWidgets" && width > 180) { consWindow.style.width = ((width-30)+"px"); }
                    if(widgetType == "inputWidgets" && width > 97) { inpWindow.style.width = ((width-30)+"px"); }
                    if(widgetType == "buttonWidgets" && width > 98) { btnWindow.style.width = ((width-35)+"px"); }  
                }
            } else if (currentResizer.classList.contains('top-right')) {
                var width = original_width + (e.pageX - original_mouse_x);
                var height = original_height - (e.pageY - original_mouse_y);
                if (width > minimum_size && (axis=="x" || axis=="both")) {
                    element.style.width = width + 'px';
                    if(widgetType == "consoleWidgets" && width > 180) { consWindow.style.width = ((width-30)+"px"); }
                    if(widgetType == "inputWidgets" && width > 97) { inpWindow.style.width = ((width-30)+"px"); }
                    if(widgetType == "buttonWidgets" && width > 98) { btnWindow.style.width = ((width-35)+"px"); }  
                }
                if (height > minimum_size && (axis=="y" || axis=="both")) {
                    element.style.height = height + 'px';
                    element.style.top = original_y + (e.pageY - original_mouse_y) + 'px';
                    if(widgetType == "consoleWidgets" && height > 200) { consWindow.style.height = ((height-82.7)+"px"); }
                    if(widgetType == "gamepadWidgets" && height > 100) { gpWindow.style.height = ((height-42)+"px"); }
                }
            } else {
                var width = original_width - (e.pageX - original_mouse_x);
                var height = original_height - (e.pageY - original_mouse_y);
                if (width > minimum_size && (axis=="x" || axis=="both")) {
                    element.style.width = width + 'px';
                    element.style.left = original_x + (e.pageX - original_mouse_x) + 'px';
                    if(widgetType == "consoleWidgets" && width > 180) { consWindow.style.width = ((width-30)+"px"); }
                    if(widgetType == "inputWidgets" && width > 97) { inpWindow.style.width = ((width-30)+"px"); }
                    if(widgetType == "buttonWidgets" && width > 98) { btnWindow.style.width = ((width-35)+"px"); }  
                }
                if (height > minimum_size && (axis=="y" || axis=="both")) {
                    element.style.height = height + 'px';
                    element.style.top = original_y + (e.pageY - original_mouse_y) + 'px';
                    if(widgetType == "consoleWidgets" && height > 200) { consWindow.style.height = ((height-82.7)+"px"); }
                    if(widgetType == "gamepadWidgets" && height > 100) { gpWindow.style.height = ((height-42)+"px"); }
                }
            }
        }
        function stopResize() {window.removeEventListener("mousemove", resize)}
    }
}
function stopResizing(widgetType, widgetNum) {
    let widgetArea = widgetElements[widgetType][widgetNum]["widget"];
    widgetArea.classList.remove("resizable");
    widgetArea.style.borderRadius = '8px';
    switch(widgetType) {
        case("buttonWidgets"):
            widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "15px 10px");
            break;

        case("displayWidgets"): 
            widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "15px 10px");
            break;

        case("inputWidgets"):
            let inpSpace = widgetElements[widgetType][widgetNum]["input"];
            inpSpace.style.width = (parseFloat(widgetArea.style.width.replace("px", ""))-20+"px");
            widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "15px 10px");
            break;

        case("gamepadWidgets"):
            if(hasGP == true && settingConfiguration["controlMode"] == "gpSelection") {
                let gpWindow = widgetElements[widgetType][widgetNum]["content"];
                widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "15px 10px");
                gpWindow.style.height = (parseFloat(gpWindow.style.height.replace("px", ""))+10+"px")
                widgetElements[widgetType][widgetNum]["header"].style.setProperty("padding", "5px 10px");
            } else {
                widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "5px 5px 10px 5px");
                widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "15px 10px");
            }
            break;

        case("consoleWidgets"):
            let consWindow = widgetElements[widgetType][widgetNum]["textarea"];
            let consWindowSpace = widgetElements[widgetType][widgetNum]["content"];
            widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "15px 10px 7px 10px");
            consWindow.style.width = (parseFloat(consWindow.style.width.replace("px", ""))+10+"px");
            consWindowSpace.style.setProperty("height", "");
            consWindowSpace.style.setProperty("width", "");
            break;
    }
}

function makeWidgetDraggable(widgetType, widgetNum) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    var elmnt = widgetElements[widgetType][widgetNum]["widget"];
    var head = widgetElements[widgetType][widgetNum]["header"];
    head.style.setProperty("cursor", "move");
    head.onmousedown = dragMouseDown;
    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }
    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }
    function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
    }
}
function stopDragging(widgetType, widgetNum) {
    widgetElements[widgetType][widgetNum]["header"].onmousedown = null;
    widgetElements[widgetType][widgetNum]["header"].style.setProperty("cursor", "default");
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
    for(let widgetNum in widgetElements["inputWidgets"]) {
        dashboardData["vInps"][widgetNum]["inpValue"] = widgetElements["inputWidgets"][widgetNum]["input"].value;
    }
}

//The function that updates the virtual displays on the dashboard
function handleVirtualDisplays() {
    for(let widgetNum in widgetElements["displayWidgets"]) {
        widgetElements["displayWidgets"][widgetNum]["content"].innerText = dashboardData["vDisps"][widgetNum]["dispMsg"];
    }
}

//The function that updates the virtual consoles on the dashboard
function handleVirtualConsoles() {
    for(let widgetNum in widgetElements["consoleWidgets"]) {
        widgetElements["consoleWidgets"][widgetNum]["textarea"].value = String((dashboardData["vCons"][widgetNum]["consMsg"]));
    }
}

//This function reads the controler, updates the webpage values, and puts values in json data
function handleGamepads() {
    let gp = navigator.getGamepads()[0]; //Get gamepad data
    let inputData = "";
    for (let i = 0; i < gp.buttons.length; i++) {
        dashboardData["gp"]["btns"][i] = ((gp.buttons[i].pressed) ? (1) : (0));
        inputData += "Button " + (i + 1) + ": ";
        if (gp.buttons[i].pressed) { inputData += " pressed"; }
        inputData += "<br/>";
    }
    for (let i = 0; i < gp.axes.length; i += 2) {
        dashboardData["gp"]["axes"][i] = Math.round(((gp.axes[i]).toFixed(2)) * 100);
        dashboardData["gp"]["axes"][i+1] = Math.round(((gp.axes[i+1]).toFixed(2)) * 100);
        if(settingConfiguration["invertedYAxis"]) { dashboardData["gp"]["axes"][i+1] = -(dashboardData["gp"]["axes"][i+1]); }
        inputData += "Stick " + (Math.ceil(i / 2) + 1) + ": " + dashboardData["gp"]["axes"][i] + "," + dashboardData["gp"]["axes"][i+1] + "<br/>";
    }
    widgetElements["gamepadWidgets"][0]["content"].innerHTML = inputData;
}

//The function that updates the driver dashboard with incoming messages
function updateDashboard() {
    for (let widgetNum in widgetElements["displayWidgets"]) { dashboardData["vDisps"][widgetNum]["dispMsg"] = (arguments[0])["vDisps"][widgetNum]; }
    for (let widgetNum in widgetElements["consoleWidgets"]) {
        if (typeof(arguments[0])["vCons"][widgetNum] !== "undefined") {
            let lastChar;
            for(let i=0; i<(arguments[0])["vCons"][widgetNum].length; i++) {
                let thisChar = (arguments[0])["vCons"][widgetNum][i];
                if((lastChar == "\n") && (thisChar == " ")) { 
                    (arguments[0])["vCons"][widgetNum] = (arguments[0]["vCons"][widgetNum].slice(0, i)+arguments[0]["vCons"][widgetNum].slice((i+1), arguments[0]["vCons"][widgetNum].length));
                    i = (i-1);
                } else { lastChar = thisChar; }
            }
            dashboardData["vCons"][widgetNum]["consMsg"] += (arguments[0])["vCons"][widgetNum];
            widgetElements["consoleWidgets"][widgetNum]["textarea"].scrollTop = widgetElements["consoleWidgets"][widgetNum]["textarea"].scrollHeight;
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
        if(typeof(repGP) !== "undefined") {
            window.clearInterval(repGP); //Stop updating gamepad controller
        }
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

//Dont scroll with arrow keys
window.addEventListener("keydown", function(e) { 
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1){ 
        e.preventDefault(); 
    } 
}, false); 

//These functions are for dealing with the websocket and controler api
function closeWebsocket() { ws.close(); }

function canGame() { return "getGamepads" in navigator; }
//The function that sends out going update messages
function sendData() {
    let dataPacketToSend = {};
    dataPacketToSend["gp"] = dashboardData["gp"];
    dataPacketToSend["vBtns"] = [];
    dataPacketToSend["vInps"] = [];
    for(let widgetNum in widgetElements["buttonWidgets"]) { dataPacketToSend["vBtns"][widgetNum] = dashboardData["vBtns"][widgetNum]["Params"][1]; }
    for(let widgetNum in widgetElements["inputWidgets"]) { dataPacketToSend["vInps"][widgetNum] = dashboardData["vInps"][widgetNum]["inpValue"]; }
    ws.send(JSON.stringify(dataPacketToSend));
}
