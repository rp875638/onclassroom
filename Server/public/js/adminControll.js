let is_recording = false;
let pendingConfirmation = {}
$('#lockButton').on("click", function() {
    if (is_locked) {
        socket.emit('unlock', { roomId });
    } else {
        socket.emit('lock', { roomId });
    }

});
function enableAdminButton(){

}

function disableAdminButton(){
    
}
$('#recording').on('click', function() {
    if (is_recording) {
        socket.emit("stopRecording", { roomId: roomId, clientId: clientId });
        is_recording = false;
        setRecordButton();
    } else {
        socket.emit("startRecording", { roomId: roomId, clientId: clientId });
        is_recording = true;
        setStopRecordButton()
    }
});
$('#endMeeting').on('click',function(){
   socket.emit('endMeeting');
   window.location.replace(`http://localhost:3030/meeting/${roomId}`);
})

const setUnlockButton = () => {
    const html = `<i class="fa fa-unlock-alt"></i`;
    document.getElementById("lockButton").innerHTML = html;
};
const setLockButton = () => {
    const html = `<i class="fa fa-lock"></i>`;
    document.getElementById("lockButton").innerHTML = html;
};
const setStopRecordButton = () => {
    const html = `<i class="fa fa-stop-circle" style="color:red;"></i>`;
    document.getElementById("recording").innerHTML = html;
};
const setRecordButton = () => {
    const html = `<i class="fa fa-play-circle"></i>`;
    document.getElementById("recording").innerHTML = html;
};

//socket.on('admit')