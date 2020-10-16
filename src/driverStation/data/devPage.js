var ws = null;
var connected = false;

//These functions are for dealing with the websocket and controler api
function closeWebsocket() {ws.close();}
function sendData(message) {ws.send(JSON.stringify(message));}
//The functions for the enable and disable buttons
function openWebsocket() {
  //Starts websocket pointed at given domain. This domain must be changed to the local IP if mDNS is not being used.
  ws = new WebSocket("ws://robot.local/");
  //Funtion to be used when the enable button is pressed
  ws.onopen = function() {
    $("#connectButton").text("Enabled").removeClass("btn-outline-success").addClass("btn-success").prop('disabled', true);
    $("#disconnectButton").text("Disable").removeClass("btn-danger").addClass("btn-outline-danger").prop('disabled', false);
    $("#developerDisplay").text("Connected! Waiting for data..."); //Display the ready message
    connected = true;
    //ws.send("DevPage:200");
  };
  //Function to be used when the disable button is pressed
  ws.onclose = function() {
    $("#connectButton").text("Enable").removeClass("btn-success").addClass("btn-outline-success").prop('disabled', false);
    $("#disconnectButton").text("Disabled").removeClass("btn-outline-danger").addClass("btn-danger").prop('disabled', true);
    $("#developerDisplay").text("Ready to connect!"); //Display the default message
    connected = false;
  };
  //Function to recive incoming messages
  ws.onmessage = function(event) {
    $("#developerDisplay").text(JSON.stringify(event.data));
    console.log(event);
  };
}

function closeWebsocket() {ws.close();}
function sendConsole() {
  if(connected) {
    var devConsoleMessage = $("#sendInput").val();
    ws.send(devConsoleMessage);
  }
}

//Runs at begining
$(document).ready(function() {
  $("#disconnectButton").text("Disabled").removeClass("btn-outline-danger").addClass("btn-danger").prop('disabled', true);
  $("#developerDisplay").text("Ready to connect!"); //Display the default message
});
