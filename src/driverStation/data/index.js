var repGP;
var repSendData;
var repVirtualInputs;
var repVirtualDisplays;
var repVirtualConsoles;
var repVirtualGraphs;
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
    "countList": {"buttonWidgets": 0, "inputWidgets": 0, "displayWidgets": 0, "consoleWidgets": 0, "graphWidgets": 0, "gamepadWidgets": 1}, 
    "consoleWidgets": [], 
    "buttonWidgets": [],  
    "inputWidgets": [], 
    "displayWidgets": [],
    "graphWidgets": [],
    "gamepadWidgets": []
};

//The function to draw and redraw google graphs
startDrawingChart = function(graphNum) {
    google.load("visualization", "1", {packages:["corechart"],callback: function(){drawChart(graphNum)}});
    function drawChart(num) {
        widgetElements["graphWidgets"][num]["chart"] = new google.visualization.LineChart(widgetElements["graphWidgets"][num]["container"]);
        dashboardData["vGrfs"][num]["dataTable"] = google.visualization.arrayToDataTable(dashboardData["vGrfs"][num]["dataArray"]);  
        widgetElements["graphWidgets"][num]["chart"].draw(dashboardData["vGrfs"][num]["dataTable"], dashboardData["vGrfs"][num]["options"]);
    }
}

//The function that initializes the driver dashboard
function initializeDashboard() {
    dashboardData = JSON.parse(arguments[0]);
    widgetElements["countList"]["buttonWidgets"] = Object.keys(dashboardData["vBtns"]).length;
    widgetElements["countList"]["inputWidgets"] = Object.keys(dashboardData["vInps"]).length;
    widgetElements["countList"]["displayWidgets"] = Object.keys(dashboardData["vDisps"]).length;
    widgetElements["countList"]["consoleWidgets"] = Object.keys(dashboardData["vCons"]).length;
    widgetElements["countList"]["graphWidgets"] = Object.keys(dashboardData["vGrfs"]).length;
    var widgetBoardSpace = document.getElementById("widgetBoard");
    var previousConfigurationSave = {}; //Variable to hold the state of wether a previous widget position configuration exists
    var previousConfigurationExists = "none";
    var changedSinceSave = false;
    if(typeof(Storage) !== "undefined") {
        if(localStorage.saveConfig) {
            previousConfigurationSave = JSON.parse(localStorage.getItem("saveConfig"));
            for(let type in widgetElements) {
                if(type != "countList") {
                    for(let num=0; num<widgetElements["countList"][type]; num++) {
                        if(!(num in previousConfigurationSave[type])) { 
                            changedSinceSave = true;
                        }
                    }
                }
            }
            if(changedSinceSave) { 
                previousConfigurationExists = "modified";
            } else {
                $("#posLock").toggleClass("unlocked");
                previousConfigurationExists = "found";
            }
        }
        if(localStorage.settingsConfig) {
            settingConfiguration = JSON.parse(localStorage.getItem("settingsConfig"));
        } else {
            settingConfiguration = {"controlMode": "gpSelection", "invertedYAxis": false, "widgetGrid": false, "gridSize": 1, "widgetSnap": true};
            localStorage.setItem("settingsConfig", JSON.stringify(settingConfiguration));
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
                $(widgetElements[widgetType][widgetNum]["widget"]).draggable({
                    handle: $(widgetElements[widgetType][widgetNum]["header"]),
                    containment: widgetBoardSpace,
                    scroll: false,
                });
                if(settingConfiguration["widgetGrid"]) {
                    let gridSize = settingConfiguration["gridSize"];
                    $(widgetElements[widgetType][widgetNum]["widget"]).draggable({ grid: [gridSize, gridSize] });
                }
                if(settingConfiguration["widgetSnap"]) {
                    $(widgetElements[widgetType][widgetNum]["widget"]).draggable({ snap: true });
                }
                $(widgetElements[widgetType][widgetNum]["widget"]).draggable("disable");
                widgetElements[widgetType][widgetNum]["widget"].style.setProperty("position", "absolute");
                widgetBoardSpace.appendChild(widgetElements[widgetType][widgetNum]["widget"]);
            }
        }
    } 

    //Gamepad
    if(settingConfiguration["controlMode"] == "gpSelection") {
        widgetElements["gamepadWidgets"][0]["widget"].style.setProperty("width", "158.28px");
        dashboardData["gp"] = [];
        dashboardData["gp"] = { "btns": [], "axes": [] };
        for(var i = 0; i < 16; i++) {dashboardData["gp"]["btns"][i] = 0;}
        for(var i = 0; i < 4; i++) {dashboardData["gp"]["axes"][i] = 0;}
        widgetElements["gamepadWidgets"][0]["widget"].style.display = "none";
        widgetElements["gamepadWidgets"][0]["header"].appendChild(document.createTextNode(""));
        widgetElements["gamepadWidgets"][0]["header"].style.setProperty("padding", "5px 10px");
        widgetElements["gamepadWidgets"][0]["content"].style.setProperty("text-align", "left");
        if(canGame()) {
            //This is the function run when the controller is connected
            $(window).on("gamepadconnected", function() {
                hasGP = true;
                widgetElements["gamepadWidgets"][0]["header"].innerText = navigator.getGamepads()[0].id.replace(/ \([\s\S]*?\)/g, '');
                widgetElements["gamepadWidgets"][0]["widget"].style.display = "inline-block";
                handleGamepads();
                widgetElements["gamepadWidgets"][0]["header"].style.setProperty("height", "32px");
                widgetElements["gamepadWidgets"][0]["widget"].style.setProperty("min-height", widgetElements["gamepadWidgets"][0]["widget"].getBoundingClientRect().height+"px");
                if($(".lock")[0].className == "lock unlocked") {
                    makeWidgetResizable("gamepadWidgets", 0, "y");
                    $(widgetElements["gamepadWidgets"][0]["widget"]).draggable("enable");
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
                if(navigator.getGamepads()[0]) {
                    if(!hasGP) $(window).trigger("gamepadconnected");
                    window.clearInterval(checkGP);
                }
            }, 500);
        }
    } else {
        widgetElements["gamepadWidgets"][0]["header"].innerHTML = "Keyboard Input";
        widgetElements["gamepadWidgets"][0]["header"].style.setProperty("padding", "5px 10px");
        widgetElements["gamepadWidgets"][0]["widget"].style.height = "146px"; 
        widgetElements["gamepadWidgets"][0]["widget"].style.width = "175.89px";
        dashboardData["gp"] = [];
        dashboardData["gp"] = { "btns": [], "axes": [] };

        for(var i = 0; i < 16; i++) { dashboardData["gp"]["btns"][i] = 0; }
        for(var i = 0; i < 4; i++) { dashboardData["gp"]["axes"][i] = 0; }

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
            if(!/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)) {
                lables = ["⮝", "⮜", "⮟", "⮞"];
            } else {
                lables = ["▲", "◄", "▼", "►"];
            }
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
    for(let i = 0; i < widgetElements["countList"]["inputWidgets"]; i++) { 
        widgetElements["inputWidgets"][i]["widget"].style.setProperty("max-height", "100px");
        widgetElements["inputWidgets"][i]["widget"].style.setProperty("width", "auto");
        widgetElements["inputWidgets"][i]["header"].innerText = (dashboardData["vInps"][i]["Id"]);
        widgetElements["inputWidgets"][i]["header"].style.setProperty("width", "auto");
        widgetElements["inputWidgets"][i]["header"].style.setProperty("height", "32px");
        dashboardData["vInps"][i]["inpValue"] = dashboardData["vInps"][i]["val"];
        widgetElements["inputWidgets"][i]["input"] = document.createElement("INPUT");
        let inputField = widgetElements["inputWidgets"][i]["input"];
        inputField.style.setProperty("width", "30px");
        inputField.setAttribute("type", "number");
        inputField.setAttribute("value", dashboardData["vInps"][i]["val"]);
        widgetElements["inputWidgets"][i]["content"].style.setProperty("padding", "20px 0px");
        widgetElements["inputWidgets"][i]["content"].appendChild(inputField);
    }

    //Virtual Displays
    for(let i = 0; i < widgetElements["countList"]["displayWidgets"]; i++) {
        widgetElements["displayWidgets"][i]["widget"].style.setProperty("height", "100px");
        dashboardData["vDisps"][i]["dispMsg"] = "";
        widgetElements["displayWidgets"][i]["header"].appendChild(document.createTextNode(dashboardData["vDisps"][i]["Id"]));
        let displayNode = document.createTextNode(" ");
        widgetElements["displayWidgets"][i]["content"].appendChild(displayNode);
    }

    //Virtual Consoles
    for(let i = 0; i < widgetElements["countList"]["consoleWidgets"]; i++) {
        widgetElements["consoleWidgets"][i]["widget"].style.setProperty("min-width", "187px");
        widgetElements["consoleWidgets"][i]["widget"].style.setProperty("min-height", "213px");
        widgetElements["consoleWidgets"][i]["content"].style.setProperty("padding", "15px 10px 7px");
        widgetElements["consoleWidgets"][i]["content"].style.setProperty("min-width", "175px");
        widgetElements["consoleWidgets"][i]["content"].style.setProperty("min-height", "168px");
        dashboardData["vCons"][i]["consMsg"] = "";
        widgetElements["consoleWidgets"][i]["header"].appendChild(document.createTextNode(dashboardData["vCons"][i]["Id"]));
        widgetElements["consoleWidgets"][i]["textarea"] = document.createElement("TEXTAREA");
        widgetElements["consoleWidgets"][i]["textarea"].style.setProperty("min-width", "155px");
        widgetElements["consoleWidgets"][i]["textarea"].style.setProperty("min-height", "128px");
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
    for(let i = 0; i < widgetElements["countList"]["buttonWidgets"]; i++) {
        widgetElements["buttonWidgets"][i]["header"].innerText = (dashboardData["vBtns"][i]["Id"]);
        widgetElements["buttonWidgets"][i]["header"].style.setProperty("width", "auto");
        widgetElements["buttonWidgets"][i]["widget"].style.setProperty("max-height", "100px");
        widgetElements["buttonWidgets"][i]["button"] = document.createElement("BUTTON");
        widgetElements["buttonWidgets"][i]["button"].style.setProperty("box-shadow", "none");
        widgetElements["buttonWidgets"][i]["button"].onmouseup = function() { this.blur(); };
        widgetElements["buttonWidgets"][i]["button"].style.setProperty("max-height", "36px");
        if((dashboardData["vBtns"][i]["Params"][1]) == 1) {
            widgetElements["buttonWidgets"][i]["button"].appendChild(document.createTextNode(dashboardData["vBtns"][i]["Params"][2]));
            widgetElements["buttonWidgets"][i]["button"].className = "btn btn-secondary active";
        } else {
            widgetElements["buttonWidgets"][i]["button"].appendChild(document.createTextNode(dashboardData["vBtns"][i]["Params"][3]));
            widgetElements["buttonWidgets"][i]["button"].className = "btn btn-secondary";
        }
        
        let handleVirtualButtons = function() {
            if(dashboardData["vBtns"][i]["Params"][1] == 1) {
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

        if(dashboardData["vBtns"][i]["Params"][0] == 1) {
            widgetElements["buttonWidgets"][i]["button"].addEventListener("mousedown", handleVirtualButtonsMomentary);
        } else { 
            widgetElements["buttonWidgets"][i]["button"].addEventListener("click", handleVirtualButtons);
        }
        widgetElements["buttonWidgets"][i]["button"].style.setProperty("float", "center")
        widgetElements["buttonWidgets"][i]["content"].appendChild(widgetElements["buttonWidgets"][i]["button"]);
    }

    //Virtual Graphs
    for(let i = 0; i < widgetElements["countList"]["graphWidgets"]; i++) {
        widgetElements["graphWidgets"][i]["widget"].style.setProperty("min-height", "199px");
        widgetElements["graphWidgets"][i]["widget"].style.setProperty("min-width", "205px");
        widgetElements["graphWidgets"][i]["header"].appendChild(document.createTextNode(dashboardData["vGrfs"][i]["Id"]));
        widgetElements["graphWidgets"][i]["content"].style.setProperty("padding", "5px 5px");
        widgetElements["graphWidgets"][i]["container"] = document.createElement("div");
        widgetElements["graphWidgets"][i]["container"].style.display = "inline-block";
        widgetElements["graphWidgets"][i]["container"].setAttribute("overflow", "auto");
        widgetElements["graphWidgets"][i]["container"].style.setProperty("min-height", "145px");
        widgetElements["graphWidgets"][i]["container"].style.setProperty("min-width", "180px");
        widgetElements["graphWidgets"][i]["content"].appendChild(widgetElements["graphWidgets"][i]["container"]);
        dashboardData["vGrfs"][i]["x"] = [];
        dashboardData["vGrfs"][i]["y"] = [];
        dashboardData["vGrfs"][i]["dataArray"] = [[dashboardData["vGrfs"][i]["xLbl"], dashboardData["vGrfs"][i]["yLbl"]], [0, 0]];
        dashboardData["vGrfs"][i]["options"] = {
            'width':'100%',
            'series': {
                0: {'targetAxisIndex': 0}
            },
            'hAxis': {
                'title': dashboardData["vGrfs"][i]["xLbl"],
                "gridlines": {"count": 10},
                'textStyle': {'bold': true}
            },
            'vAxis': {
                0: {
                    'title': dashboardData["vGrfs"][i]["yLbl"],
                    "gridlines": {"count": 10}
                }
            },
            'chartArea': {'width': '98%'},
            'legend': 'none',
            'colors': ['#1759ff']
        };
        startDrawingChart(i);
    }


    dashIsInitialized = true;
    repVirtualInputs = window.setInterval(handleVirtualInputs, 20); //Set interval to update virtual inputs
    repVirtualDisplays = window.setInterval(handleVirtualDisplays, 20); //Set interval to update virtual displays
    repVirtualConsoles = window.setInterval(handleVirtualConsoles, 10); //Set interval to update virtual consoles
    repVirtualGraphs = window.setInterval(handleVirtualGraphs, 10); //Set interval to update virtual graphs
    repSendData = window.setInterval(sendData, 10); //Set interval for the json websocket transmission

    $(".lock").click(function() {
        if(typeof(Storage) !== "undefined") {
            $(this).toggleClass("unlocked");
            if(document.getElementById("posLock").className == "lock unlocked") {
                console.log("UNLOCKED");
                for(let widgetType in widgetElements) {
                    if(widgetType != "countList") {
                        for(let widgetNum in widgetElements[widgetType]) {
                            if(widgetType != "gamepadWidgets" || (hasGP == true && settingConfiguration["controlMode"] == "gpSelection")) {
                                //Type dependent settings
                                if(widgetType != "consoleWidgets" && widgetType != "gamepadWidgets") {
                                    makeWidgetResizable(widgetType, widgetNum, "x");
                                } else if(widgetType == "gamepadWidgets") {
                                    makeWidgetResizable(widgetType, widgetNum, "y");
                                } else if(widgetType == "consoleWidgets" || widgetType == "graphWidgets") {
                                    makeWidgetResizable(widgetType, widgetNum, "both");
                                }
                                $(widgetElements[widgetType][widgetNum]["widget"]).draggable("enable");
                            } else if(widgetType == "gamepadWidgets" && (settingConfiguration["controlMode"] == "wasdSelection" || settingConfiguration["controlMode"] == "arrowsSelection")) {
                                makeWidgetResizable(widgetType, widgetNum, "neither");
                                $(widgetElements[widgetType][widgetNum]["widget"]).draggable("enable");
                            }
                        } 
                    }
                }
            } else {
                console.log("LOCKED\n");
                let saveConfig = {};
                if(previousConfigurationExists == "found") {
                    saveConfig = previousConfigurationSave;
                } else if(previousConfigurationExists == "none") {
                    saveConfig = {"gamepadWidgets": [], "inputWidgets": [], "buttonWidgets": [], "displayWidgets": [], "consoleWidgets": [], "graphWidgets": []};
                    for(let type in saveConfig) {
                        for(let num in widgetElements[type]) { saveConfig[type][num] = {"position": {}, "size": {}}; }
                    }
                } else if(previousConfigurationExists == "modified") {
                    saveConfig = previousConfigurationSave;
                    for(let type in widgetElements) {
                        if(type != "countList") {
                            for(let num in widgetElements[type]) {
                                if(!(num in previousConfigurationSave[type])) {
                                    saveConfig[type][num] = {"position": {}, "size": {}};
                                }
                            }
                        }
                    }
                }
                for(let widgetType in widgetElements) {
                    if(widgetType != "countList") {
                        for(let widgetNum in widgetElements[widgetType]) {
                            if(widgetType != "gamepadWidgets" || (hasGP == true && settingConfiguration["controlMode"] == "gpSelection")) {
                                let positionBox = widgetElements[widgetType][widgetNum]["widget"].getBoundingClientRect();
                                $(widgetElements[widgetType][widgetNum]["widget"]).draggable("disable");
                                let absolutePosX = $(widgetElements[widgetType][widgetNum]["widget"]).offset().left+"px";
                                let absolutePosY = $(widgetElements[widgetType][widgetNum]["widget"]).offset().top+"px";
                                widgetElements[widgetType][widgetNum]["widget"].style.setProperty("left", absolutePosX);
                                widgetElements[widgetType][widgetNum]["widget"].style.setProperty("top", absolutePosY);
                                widgetElements[widgetType][widgetNum]["widget"].style.setProperty("position", "absolute");
                                stopResizing(widgetType, widgetNum);
                                saveConfig[widgetType][widgetNum]["position"] = {"x": absolutePosX, "y": absolutePosY};
                                switch(widgetType) {
                                    case("displayWidgets"):
                                        saveConfig[widgetType][widgetNum]["size"] = {"width": positionBox.width}; 
                                        break;

                                    case("buttonWidgets"):
                                        saveConfig[widgetType][widgetNum]["size"] = {"width": positionBox.width};
                                        break;

                                    case("inputWidgets"):
                                        saveConfig[widgetType][widgetNum]["size"] = {"width": positionBox.width};
                                        break;

                                    case("gamepadWidgets"):
                                        saveConfig[widgetType][widgetNum]["size"] = {"height": widgetElements[widgetType][widgetNum]["content"].getBoundingClientRect().height};
                                        break;

                                    case("consoleWidgets"):
                                        saveConfig[widgetType][widgetNum]["size"] = {
                                            "height": positionBox.height,
                                            "width": positionBox.width
                                        }
                                        break;
                                    case("graphWidgets"):
                                        saveConfig[widgetType][widgetNum]["size"] = {
                                            "height": positionBox.height,
                                            "width": positionBox.width
                                        }
                                        break;
                                }
                            } else if(widgetType == "gamepadWidgets" && (settingConfiguration["controlMode"] == "wasdSelection" || settingConfiguration["controlMode"] == "arrowsSelection")) {
                                $(widgetElements[widgetType][widgetNum]["widget"]).draggable("disable");
                                let absolutePosX = widgetElements[widgetType][widgetNum]["widget"].offsetLeft+"px";
                                let absolutePosY = widgetElements[widgetType][widgetNum]["widget"].offsetTop+"px";
                                widgetElements[widgetType][widgetNum]["widget"].style.setProperty("left", absolutePosX);
                                widgetElements[widgetType][widgetNum]["widget"].style.setProperty("top", absolutePosY);
                                widgetElements[widgetType][widgetNum]["widget"].style.setProperty("position", "absolute");
                                stopResizing(widgetType, widgetNum);
                                saveConfig[widgetType][widgetNum]["position"] = {"x": absolutePosX, "y": absolutePosY};
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

    function setupWidgetsFromSave(type, num) {
        widgetElements[type][num]["widget"].style.setProperty("position", "absolute");
        let heightHolder = previousConfigurationSave[type][num]["size"]["height"];
        let widthHolder = previousConfigurationSave[type][num]["size"]["width"];
        switch(type) {
            case("displayWidgets"):
                widgetElements[type][num]["widget"].style.setProperty("min-width", widgetElements[type][num]["header"].getBoundingClientRect().width+12+"px");
                widgetElements[type][num]["content"].style.setProperty("padding", "17px 0px");
                widgetElements[type][num]["widget"].style.width = widthHolder+"px";
                break;

            case("buttonWidgets"):
                let longestLen;
                widgetElements[type][num]["button"].innerText = dashboardData["vBtns"][num]["Params"][2];
                longestLen = widgetElements[type][num]["button"].getBoundingClientRect().width+35;
                if(widgetElements[type][num]["header"].getBoundingClientRect().width+10 > longestLen) { longestLen = widgetElements[type][num]["header"].getBoundingClientRect().width+10; }
                widgetElements[type][num]["button"].innerText = dashboardData["vBtns"][num]["Params"][3];
                if(widgetElements[type][num]["header"].getBoundingClientRect().width+10 > longestLen) { longestLen = widgetElements[type][num]["header"].getBoundingClientRect().width+10; }
                if(widgetElements[type][num]["button"].getBoundingClientRect().width+35 > longestLen) { longestLen = widgetElements[type][num]["button"].getBoundingClientRect().width+35; }
                widgetElements[type][num]["button"].style.setProperty("width", (longestLen-35+"px"));
                widgetElements[type][num]["button"].style.setProperty("min-width", (longestLen-35+"px"));
                widgetElements[type][num]["widget"].style.setProperty("width", (longestLen+2+"px"));
                widgetElements[type][num]["widget"].style.setProperty("min-width", (longestLen+2+"px"));
                widgetElements[type][num]["button"].innerText = ((dashboardData["vBtns"][num]["Params"][1]==1)? dashboardData["vBtns"][num]["Params"][2] : dashboardData["vBtns"][num]["Params"][3]);  
                widgetElements[type][num]["widget"].style.width = widthHolder+"px";
                widgetElements[type][num]["button"].style.width = (parseFloat(widgetElements[type][num]["widget"].style.width.replace("px", ""))-32+"px");
                break;

            case("inputWidgets"):
                widgetElements[type][num]["content"].style.setProperty("width", (widgetElements[type][num]["header"].getBoundingClientRect().width+"px"));
                widgetElements[type][num]["input"].style.setProperty("width", (widgetElements[type][num]["content"].getBoundingClientRect().width-10+"px"));
                widgetElements[type][num]["widget"].style.setProperty("width", (widgetElements[type][num]["input"].getBoundingClientRect().width+22+"px"));
                widgetElements[type][num]["widget"].style.setProperty("min-width", (widgetElements[type][num]["widget"].getBoundingClientRect().width+"px"));
                widgetElements[type][num]["content"].style.setProperty("min-width", (widgetElements[type][num]["content"].getBoundingClientRect().width+"px"));
                widgetElements[type][num]["input"].style.setProperty("min-width", (widgetElements[type][num]["input"].getBoundingClientRect().width+"px"));
                widgetElements[type][num]["content"].style.setProperty("width", "auto");
                widgetElements[type][num]["widget"].style.width = widthHolder+"px";
                widgetElements[type][num]["input"].style.setProperty("width", (widgetElements[type][num]["widget"].getBoundingClientRect().width-22+"px"));
                break;

            case("gamepadWidgets"):
                if(settingConfiguration["controlMode"] == "gpSelection") { widgetElements[type][num]["content"].style.height = heightHolder+"px"; }
                break;

            case("consoleWidgets"):
                widgetElements[type][num]["widget"].style.height = heightHolder+"px";
                widgetElements[type][num]["widget"].style.width = widthHolder+"px";
                widgetElements[type][num]["textarea"].style.height = (parseFloat(widgetElements[type][num]["widget"].style.height.replace("px", ""))-84.7+"px");
                widgetElements[type][num]["textarea"].style.width = (parseFloat(widgetElements[type][num]["widget"].style.width.replace("px", ""))-22+"px");
                break;
            
            case("graphWidgets"):
                widgetElements[type][num]["widget"].style.height = heightHolder+"px";
                widgetElements[type][num]["widget"].style.width = widthHolder+"px";
                widgetElements[type][num]["container"].style.height = (parseFloat(widgetElements[type][num]["widget"].style.height.replace("px", ""))-44+"px");
                widgetElements[type][num]["container"].style.width = (parseFloat(widgetElements[type][num]["widget"].style.width.replace("px", ""))-12+"px");
                makeWidgetResizable(type, num, "both");
                stopResizing(type, num);
                break;
        }
        widgetElements[type][num]["widget"].style.setProperty("left", previousConfigurationSave[type][num]["position"]["x"]);
        widgetElements[type][num]["widget"].style.setProperty("top", previousConfigurationSave[type][num]["position"]["y"]);
    }

    var position = {"gamepadWidgets":{"x":[],"y":[]}, "inputWidgets":{"x":[],"y":[]}, "buttonWidgets":{"x":[],"y":[]}, "displayWidgets":{"x":[],"y":[]}, "consoleWidgets":{"x":[],"y":[]}, "graphWidgets":{"x":[], "y":[]}};
    function setupWidgetsAsNew(type, num, stage, storage) {
        if(stage==0) {
            if(type != "consoleWidgets" && type != "gamepadWidgets" && type != "graphWidgets") {
                if(type == "buttonWidgets") {
                    let longestLen;
                    widgetElements[type][num]["button"].innerText = dashboardData["vBtns"][num]["Params"][2];
                    longestLen = widgetElements[type][num]["button"].getBoundingClientRect().width+35;
                    if(widgetElements[type][num]["header"].getBoundingClientRect().width+10 > longestLen) { longestLen = widgetElements[type][num]["header"].getBoundingClientRect().width+10; }
                    widgetElements[type][num]["button"].innerText = dashboardData["vBtns"][num]["Params"][3];
                    if(widgetElements[type][num]["header"].getBoundingClientRect().width+10 > longestLen) { longestLen = widgetElements[type][num]["header"].getBoundingClientRect().width+10; }
                    if(widgetElements[type][num]["button"].getBoundingClientRect().width+35 > longestLen) { longestLen = widgetElements[type][num]["button"].getBoundingClientRect().width+35; }
                    widgetElements[type][num]["button"].style.setProperty("width", (longestLen-35+"px"));
                    widgetElements[type][num]["button"].style.setProperty("min-width", (longestLen-35+"px"));
                    widgetElements[type][num]["widget"].style.setProperty("width", (longestLen+2+"px"));
                    widgetElements[type][num]["widget"].style.setProperty("min-width", (longestLen+2+"px"));
                    widgetElements[type][num]["button"].innerText = ((dashboardData["vBtns"][num]["Params"][1]==1)? dashboardData["vBtns"][num]["Params"][2] : dashboardData["vBtns"][num]["Params"][3]);  
                } else if(type == "displayWidgets") {
                    widgetElements[type][num]["content"].style.setProperty("padding", "17px 0px");
                    widgetElements[type][num]["widget"].style.setProperty("min-width", widgetElements[type][num]["header"].getBoundingClientRect().width+12+"px");
                } else if(type == "inputWidgets") {
                    widgetElements[type][num]["content"].style.setProperty("width", (widgetElements[type][num]["header"].getBoundingClientRect().width+"px"));
                    widgetElements[type][num]["input"].style.setProperty("width", (widgetElements[type][num]["content"].getBoundingClientRect().width-10+"px"));
                    widgetElements[type][num]["widget"].style.setProperty("width", (widgetElements[type][num]["input"].getBoundingClientRect().width+22+"px"));
                    widgetElements[type][num]["widget"].style.setProperty("min-width", (widgetElements[type][num]["widget"].getBoundingClientRect().width+"px"));
                    widgetElements[type][num]["content"].style.setProperty("min-width", (widgetElements[type][num]["content"].getBoundingClientRect().width+"px"));
                    widgetElements[type][num]["input"].style.setProperty("min-width", (widgetElements[type][num]["input"].getBoundingClientRect().width+"px"));
                    widgetElements[type][num]["content"].style.setProperty("width", "auto");
                }
                makeWidgetResizable(type, num, "x");
            } else if(type == "gamepadWidgets") {
                if(settingConfiguration["controlMode"] == "gpSelection") {
                    makeWidgetResizable(type, num, "y");
                } else { 
                    makeWidgetResizable(type, num, "neither");
                }
            } else if(type == "consoleWidgets") {
                widgetElements[type][num]["widget"].style.setProperty("width", parseFloat(widgetElements[type][num]["widget"].style.minWidth)+1+"px"); 
                widgetElements[type][num]["widget"].style.setProperty("height", parseFloat(widgetElements[type][num]["widget"].style.minHeight)+1+"px");
                widgetElements[type][num]["textarea"].style.setProperty("width", parseFloat(widgetElements[type][num]["textarea"].style.minWidth)+1+"px");
                widgetElements[type][num]["textarea"].style.setProperty("height", parseFloat(widgetElements[type][num]["textarea"].style.minHeight)+1+"px");
                makeWidgetResizable(type, num, "both");
            } else if(type == "graphWidgets") {
                widgetElements[type][num]["widget"].style.setProperty("width", parseFloat(widgetElements[type][num]["widget"].style.minWidth)+1+"px"); 
                widgetElements[type][num]["widget"].style.setProperty("height", parseFloat(widgetElements[type][num]["widget"].style.minHeight)+1+"px");
                widgetElements[type][num]["container"].style.setProperty("width", parseFloat(widgetElements[type][num]["container"].style.minWidth)+1+"px");
                widgetElements[type][num]["container"].style.setProperty("height", parseFloat(widgetElements[type][num]["container"].style.minHeight)+5+"px");
                makeWidgetResizable(type, num, "both");
            }
            $(widgetElements[type][num]["widget"]).draggable("enable");
            widgetElements[type][num]["widget"].style.setProperty("position", "relative");
            widgetElements[type][num]["widget"].style.setProperty("left", ("0px"));
            widgetElements[type][num]["widget"].style.setProperty("top", ("0px"));
        } else if(stage==1) {
            storage[type]["x"][num] = widgetElements[type][num]["widget"].offsetLeft+"px";
            storage[type]["y"][num] = widgetElements[type][num]["widget"].offsetTop+"px";
        } else if(stage==2) {
            widgetElements[type][num]["widget"].style.setProperty("position", "absolute");
            widgetElements[type][num]["widget"].style.setProperty("left", storage[type]["x"][num]);
            widgetElements[type][num]["widget"].style.setProperty("top", storage[type]["y"][num]);
        }
        return storage;
    }

    if(previousConfigurationExists == "found") {
        for(let type in widgetElements) {
            if(type != "countList") {
                for(let num in widgetElements[type]) {
                    setupWidgetsFromSave(type, num);
                }
            }
        }
    } else if(previousConfigurationExists == "none") {
        for(let i=0; i<3; i++) {
            for(let type in widgetElements) {
                if(type != "countList") {
                    for(let num in widgetElements[type]) {
                        position = setupWidgetsAsNew(type, num, i, position);
                    }      
                }
            }
        }
    } else if(previousConfigurationExists == "modified") {
        for(let type in previousConfigurationSave) {
            for(let num in previousConfigurationSave[type]) {
                setupWidgetsFromSave(type, num);
            }
        }
        for(let i=0; i<3; i++) {
            for(let type in widgetElements) {
                if(type != "countList") {
                    for(let num in widgetElements[type]) {
                        if(!(num in previousConfigurationSave[type])) {
                            position = setupWidgetsAsNew(type, num, i, position);
                        }
                    }
                }
            }
        }
    }
}

function makeWidgetResizable(widgetType, widgetNum, axis) {
    let element = widgetElements[widgetType][widgetNum]["widget"];
    element.classList.add("resizable");
    let resizers = element.querySelectorAll(" .resizer");
    let minimum_width = parseFloat(element.style.minWidth);
    let minimum_height = parseFloat(element.style.minHeight);
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
            widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "10px 10px 2px 10px");
            break;

        case("inputWidgets"):
            var inpWindow = widgetElements[widgetType][widgetNum]["input"];
            widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "15px 5px");
            break;

        case("gamepadWidgets"):
            if(hasGP == true && settingConfiguration["controlMode"] == "gpSelection") {
                var gpWindow = widgetElements[widgetType][widgetNum]["content"];
                widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "10px 5px");
                gpWindow.style.height = (parseFloat(gpWindow.style.height.replace("px", ""))-10+"px")
                widgetElements[widgetType][widgetNum]["header"].style.setProperty("padding", "5px 0px");
            } else {
                widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "10px 5px 10px 5px");
            }    
            break;

        case("buttonWidgets"):
            var btnWindow = widgetElements[widgetType][widgetNum]["button"];
            widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "10px 10px");
            btnWindow.style.setProperty("width", (element.getBoundingClientRect().width-37+"px"));
            break;

        case("displayWidgets"):
            widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "17px 0px");
            widgetElements[widgetType][widgetNum]["header"].style.setProperty("padding", "5px 5px");
            break;

        case("graphWidgets"):
            var grfsWindow = widgetElements[widgetType][widgetNum]["container"];
            var grfsContent = widgetElements[widgetType][widgetNum]["content"];
            grfsWindow.style.setProperty("width", parseFloat(grfsWindow.style.width.replace("px", ""))-12+"px");
            grfsWindow.style.setProperty("height", parseFloat(grfsWindow.style.height.replace("px", ""))-12+"px");
            grfsContent.style.setProperty("height", (element.getBoundingClientRect().height-44+"px"));
            // grfsContent.style.setProperty("width", parseFloat(grfsContent.style.width.replace("px", ""))-10+"px");
            // grfsContent.style.setProperty("height", parseFloat(grfsContent.style.height.replace("px", ""))-5+"px");
            startDrawingChart(widgetNum);
            break;
    }
    for(let i = 0;i < resizers.length; i++) {
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
            if(currentResizer.classList.contains('bottom-right')) {
                var width = original_width + (e.pageX - original_mouse_x);
                var height = original_height + (e.pageY - original_mouse_y);
                if(width > minimum_width && (axis=="x" || axis=="both")) {
                    element.style.width = width + 'px';
                    if(widgetType == "consoleWidgets") { consWindow.style.width = ((width-32)+"px"); }
                    if(widgetType == "inputWidgets") { inpWindow.style.width = ((width-22)+"px"); }
                    if(widgetType == "buttonWidgets") { btnWindow.style.width = ((width-37)+"px"); }  
                    if(widgetType == "graphWidgets") {
                        grfsWindow.style.width = ((width-25)+"px");
                        startDrawingChart(widgetNum);
                    }
                }
                if(height > minimum_height && (axis=="y" || axis=="both")) {
                    element.style.height = height + 'px';
                    if(widgetType == "consoleWidgets") { consWindow.style.height = ((height-84.7)+"px"); }
                    if(widgetType == "gamepadWidgets") { gpWindow.style.height = ((height-44)+"px"); }
                    if(widgetType == "graphWidgets") { 
                        grfsContent.style.setProperty('height', ((height-44)+"px"));
                        grfsWindow.style.setProperty('height', ((height-56)+"px"));  
                        startDrawingChart(widgetNum);
                    }
                }
            } else if(currentResizer.classList.contains('bottom-left')) {
                var height = original_height + (e.pageY - original_mouse_y);
                var width = original_width - (e.pageX - original_mouse_x);
                if(height > minimum_height && (axis=="y" || axis=="both")) {
                    element.style.height = height + 'px';
                    if(widgetType == "consoleWidgets") { consWindow.style.height = ((height-84.7)+"px"); }
                    if(widgetType == "gamepadWidgets") { gpWindow.style.height = ((height-44)+"px"); }
                    if(widgetType == "graphWidgets") { 
                        grfsContent.style.setProperty('height', ((height-44)+"px"));
                        grfsWindow.style.setProperty('height', ((height-56)+"px")); 
                        startDrawingChart(widgetNum);
                    }
                }
                if(width > minimum_width && (axis=="x" || axis=="both")) {
                    element.style.width = width + 'px';
                    element.style.left = original_x + (e.pageX - original_mouse_x) + 'px';
                    if(widgetType == "consoleWidgets") { consWindow.style.width = ((width-32)+"px"); }
                    if(widgetType == "inputWidgets") { inpWindow.style.width = ((width-22)+"px"); }
                    if(widgetType == "buttonWidgets") { btnWindow.style.width = ((width-37)+"px"); }  
                    if(widgetType == "graphWidgets") {
                        grfsWindow.style.width = ((width-25)+"px");
                        startDrawingChart(widgetNum);
                    }
                }
            } else if(currentResizer.classList.contains('top-right')) {
                var width = original_width + (e.pageX - original_mouse_x);
                var height = original_height - (e.pageY - original_mouse_y);
                if(width > minimum_width && (axis=="x" || axis=="both")) {
                    element.style.width = width + 'px';
                    if(widgetType == "consoleWidgets") { consWindow.style.width = ((width-32)+"px"); }
                    if(widgetType == "inputWidgets") { inpWindow.style.width = ((width-22)+"px"); }
                    if(widgetType == "buttonWidgets") { btnWindow.style.width = ((width-37)+"px"); }  
                    if(widgetType == "graphWidgets") {
                        grfsWindow.style.width = ((width-25)+"px");
                        startDrawingChart(widgetNum);
                    }
                }
                if(height > minimum_height && (axis=="y" || axis=="both")) {
                    element.style.height = height + 'px';
                    element.style.top = original_y + (e.pageY - original_mouse_y) + 'px';
                    if(widgetType == "consoleWidgets") { consWindow.style.height = ((height-84.7)+"px"); }
                    if(widgetType == "gamepadWidgets") { gpWindow.style.height = ((height-44)+"px"); }
                    if(widgetType == "graphWidgets") { 
                        grfsContent.style.setProperty('height', ((height-44)+"px"));
                        grfsWindow.style.setProperty('height', ((height-56)+"px")); 
                        startDrawingChart(widgetNum);
                    }
                }
            } else {
                var width = original_width - (e.pageX - original_mouse_x);
                var height = original_height - (e.pageY - original_mouse_y);
                if(width > minimum_width && (axis=="x" || axis=="both")) {
                    element.style.width = width + 'px';
                    element.style.left = original_x + (e.pageX - original_mouse_x) + 'px';
                    if(widgetType == "consoleWidgets") { consWindow.style.width = ((width-32)+"px"); }
                    if(widgetType == "inputWidgets") { inpWindow.style.width = ((width-22)+"px"); }
                    if(widgetType == "buttonWidgets") { btnWindow.style.width = ((width-37)+"px"); }  
                    if(widgetType == "graphWidgets") {
                        grfsWindow.style.width = ((width-25)+"px");
                        startDrawingChart(widgetNum);
                    }
                }
                if(height > minimum_height && (axis=="y" || axis=="both")) {
                    element.style.height = height + 'px';
                    element.style.top = original_y + (e.pageY - original_mouse_y) + 'px';
                    if(widgetType == "consoleWidgets") { consWindow.style.height = ((height-84.7)+"px"); }
                    if(widgetType == "gamepadWidgets") { gpWindow.style.height = ((height-44)+"px"); }
                    if(widgetType == "graphWidgets") { 
                        grfsContent.style.setProperty('height', ((height-44)+"px"));
                        grfsWindow.style.setProperty('height', ((height-56)+"px")); 
                        startDrawingChart(widgetNum);
                    }
                }
            }
        }
        function stopResize() {window.removeEventListener("mousemove", resize)}
    }
}
function stopResizing(widgetType, widgetNum) {
    let widgetArea = widgetElements[widgetType][widgetNum]["widget"];
    widgetArea.classList.remove("resizable");
    switch(widgetType) {
        case("buttonWidgets"):
            widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "15px 10px");
            widgetElements[widgetType][widgetNum]["button"].style.setProperty("width", (widgetArea.getBoundingClientRect().width-37+"px"));
            break;

        case("displayWidgets"):
            widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "17px 0px");
            widgetElements[widgetType][widgetNum]["header"].style.setProperty("padding", "5px 10px");
            break;

        case("inputWidgets"):
            let inpSpace = widgetElements[widgetType][widgetNum]["input"];
            inpSpace.style.width = (widgetArea.getBoundingClientRect().width-22+"px");
            widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "20px 0px");
            break;

        case("gamepadWidgets"):
            if(hasGP == true && settingConfiguration["controlMode"] == "gpSelection") {
                let gpWindow = widgetElements[widgetType][widgetNum]["content"];
                widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "15px 10px");
                gpWindow.style.height = (gpWindow.getBoundingClientRect().height+10+"px");
                widgetElements[widgetType][widgetNum]["header"].style.setProperty("padding", "5px 10px");
            } else {
                widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "5px 5px 10px 5px");
                widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "15px 10px");
            }
            break;

        case("consoleWidgets"):
            let consWindow = widgetElements[widgetType][widgetNum]["textarea"];
            let consWindowSpace = widgetElements[widgetType][widgetNum]["content"];
            consWindow.style.width = (parseFloat(consWindow.style.width.replace("px", ""))+10+"px");
            widgetElements[widgetType][widgetNum]["content"].style.setProperty("padding", "15px 10px 7px 10px");
            consWindowSpace.style.setProperty("height", "");
            consWindowSpace.style.setProperty("width", "");
            break;

        case("graphWidgets"):
            let grfsWindow = widgetElements[widgetType][widgetNum]["container"];
            var grfsContent = widgetElements[widgetType][widgetNum]["content"];
            grfsContent.style.height = "";
            grfsWindow.style.setProperty("width", parseFloat(grfsWindow.style.width.replace("px", ""))+12+"px");
            grfsWindow.style.setProperty("height", parseFloat(grfsWindow.style.height.replace("px", ""))+12+"px");
            startDrawingChart(widgetNum);
            break;
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

//The function that updates the virtual graphs on the dashboard
function handleVirtualGraphs() {
    for(let widgetNum in widgetElements["graphWidgets"]) {
        if(dashboardData["vGrfs"][widgetNum]["x"].length > 0) {
            for(let i=0; i<dashboardData["vGrfs"][widgetNum]["x"].length; i++) {
                dashboardData["vGrfs"][widgetNum]["dataArray"].push([
                    parseFloat(dashboardData["vGrfs"][widgetNum]["x"][i]), 
                    parseFloat(dashboardData["vGrfs"][widgetNum]["y"][i])
                    // parseFloat(dashboardData["vGrfs"][widgetNum]["y"][0][i]), 
                    // parseFloat(dashboardData["vGrfs"][widgetNum]["y"][1][i]), 
                    // parseFloat(dashboardData["vGrfs"][widgetNum]["y"][2][i]), 
                    // parseFloat(dashboardData["vGrfs"][widgetNum]["y"][3][i])
                ]);
            }
            dashboardData["vGrfs"][widgetNum]["x"] = []
            // dashboardData["vGrfs"][widgetNum]["y"] = [[], [], [], []]
            dashboardData["vGrfs"][widgetNum]["y"] = []
            startDrawingChart(widgetNum);
        }
    }
}

//This function reads the controler, updates the webpage values, and puts values in json data
function handleGamepads() {
    let gp = navigator.getGamepads()[0]; //Get gamepad data
    let inputData = "";
    for(let i = 0; i < gp.buttons.length; i++) {
        dashboardData["gp"]["btns"][i] = ((gp.buttons[i].pressed) ? (1) : (0));
        inputData += "Button " + (i + 1) + ": ";
        if(gp.buttons[i].pressed) { inputData += " pressed"; }
        inputData += "<br/>";
    }
    for(let i = 0; i < gp.axes.length; i += 2) {
        dashboardData["gp"]["axes"][i] = Math.round(((gp.axes[i]).toFixed(2)) * 100);
        dashboardData["gp"]["axes"][i+1] = Math.round(((gp.axes[i+1]).toFixed(2)) * 100);
        if(settingConfiguration["invertedYAxis"]) { dashboardData["gp"]["axes"][i+1] = -(dashboardData["gp"]["axes"][i+1]); }
        inputData += "Stick " + (Math.ceil(i / 2) + 1) + ": " + dashboardData["gp"]["axes"][i] + "," + dashboardData["gp"]["axes"][i+1] + "<br/>";
    }
    widgetElements["gamepadWidgets"][0]["content"].innerHTML = inputData;
}

//The function that updates the driver dashboard with incoming messages
function updateDashboard() {
    for(let widgetNum in widgetElements["displayWidgets"]) { dashboardData["vDisps"][widgetNum]["dispMsg"] = (arguments[0])["vDisps"][widgetNum]; }
    for(let widgetNum in widgetElements["consoleWidgets"]) {
        if(typeof(arguments[0])["vCons"][widgetNum] !== "undefined") {
            let lastChar;
            for(let i=0; i<arguments[0]["vCons"][widgetNum].length; i++) {
                let thisChar = arguments[0]["vCons"][widgetNum][i];
                if((lastChar == "\n") && (thisChar == " ")) { 
                    arguments[0]["vCons"][widgetNum] = (arguments[0]["vCons"][widgetNum].slice(0, i)+arguments[0]["vCons"][widgetNum].slice((i+1), arguments[0]["vCons"][widgetNum].length));
                    i = (i-1);
                } else { lastChar = thisChar; }
            }
            dashboardData["vCons"][widgetNum]["consMsg"] += arguments[0]["vCons"][widgetNum];
            widgetElements["consoleWidgets"][widgetNum]["textarea"].scrollTop = widgetElements["consoleWidgets"][widgetNum]["textarea"].scrollHeight;
        }
    }
    for(let widgetNum in widgetElements["graphWidgets"]) {
        if(arguments[0]["vGrfs"][widgetNum]["x"].length > 0) {
            // for(let i=0; i<arguments[0]["vGrfs"][widgetNum]["x"].length; i++) {
            //     arguments[0]["vGrfs"][widgetNum]["x"][i] = parseFloat(arguments[0]["vGrfs"][widgetNum]["x"][i]);
            //     arguments[0]["vGrfs"][widgetNum]["y"][i] = parseFloat(arguments[0]["vGrfs"][widgetNum]["y"][i]);
            // }
            dashboardData["vGrfs"][widgetNum]["x"] = dashboardData["vGrfs"][widgetNum]["x"].concat(arguments[0]["vGrfs"][widgetNum]["x"]);
            dashboardData["vGrfs"][widgetNum]["y"] = dashboardData["vGrfs"][widgetNum]["y"].concat(arguments[0]["vGrfs"][widgetNum]["y"]);
            // for(let i=0; i<4; i++) {
            //     dashboardData["vGrfs"][widgetNum]["y"][i] = dashboardData["vGrfs"][widgetNum]["y"].concat(arguments[0]["vGrfs"][widgetNum]["y"][i]);
            // }
        }
    }
}

//The functions for the enable and disable buttons
function openWebsocket() {
    //Starts websocket pointed at given domain. This domain must be changed to the local IP if mDNS is not being used.
    ws = new WebSocket("ws://"+ipAddress+"/");
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
        window.clearInterval(repVirtualGraphs); //Stop updating virtual graphs
        if(typeof(repGP) !== "undefined") {
            window.clearInterval(repGP); //Stop updating gamepad controller
        }
        window.clearInterval(repSendData); //Stop the websocket processes
        location.reload();
        return false;
    };

    //Function to recive incoming messages
    ws.onmessage = function(event) {
        if(dashIsInitialized) {
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
