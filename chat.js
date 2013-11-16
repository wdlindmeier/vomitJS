
// Compatibility shim
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

// Connection object;
var connection;


// UI Peer helper methods
function step1 () {
  // Get audio/video stream
  navigator.getUserMedia({audio: true, video: true}, function(stream){
    // Set your video displays
    $('#my-video').prop('src', URL.createObjectURL(stream));

    window.localStream = stream;
    step2();
  }, function(){ $('#step1-error').show(); });
}

function step2 () {
  $('#step1, #step3').hide();
  $('#step2').show();
}

function step3 (call) {
  // Hang up on an existing call if present
  if (window.existingCall) {
    window.existingCall.close();
  }

  // Wait for stream on the call, then set peer video display
  call.on('stream', function(stream){
    $('#their-video').prop('src', URL.createObjectURL(stream));
  });

  // UI stuff
  window.existingCall = call;
  $('#their-id').text(call.peer);
  call.on('close', step2);
  $('#step1, #step2').hide();
  $('#step3').show();
}


// PeerJS object
// Insert your own key here!
$PEER_API_KEY = "pwlykp1k1txirudi";
var peer = new Peer({ key: $PEER_API_KEY, debug: 3, config: {'iceServers': [
  { url: 'stun:stun.l.google.com:19302' } // Pass in optional STUN and TURN server for maximum network compatibility
]}});

peer.on('open', function(){
  $('#my-id').text(peer.id);
});

// Receiving a call
peer.on('call', function(call){
  // Answer the call automatically (instead of prompting user) for demo purposes
  call.answer(window.localStream);
  step3(call);
});

// Receiving a data connection
peer.on('connection', function(conn) { 
  connection = conn;
  attachConnListeners();
});

peer.on('error', function(err){
  alert(err.message);
  // Return to step 2 if error occurs
  step2();
});

function attachConnListeners() {
  connection.on('open', function() {
    console.log("CONNECTION OPENED");
    
    startTracking();
    
    // Receive messages
    connection.on('data', function(data) {
      console.log('Received', data);
    });

    // Send messages
    connection.send('Hello!');
  });
}

// Button cick handlers setup
$(function(){
  $('#make-call').click(function(){
    // Initiate a call!
    var id = $('#callto-id').val();
    var call = peer.call(id, window.localStream);
    connection = peer.connect(id);
    attachConnListeners();
    step3(call);
  });

  $('#end-call').click(function(){      
    stopTracking();
    window.existingCall.close();
    step2();
  });

  // Retry if getUserMedia fails
  $('#step1-retry').click(function(){
    $('#step1-error').hide();
    step1();
  });

  // Send message over data connection
  $('#send-data').click(function(){
    var msg = $('#data-msg').val();
    //console.log("sent ");
    connection.send(msg);
  });


  // Start speech
  $('#start-speech').click(function(){
    console.log("starting speech");
    startSpeech();
    $('#start-speech').hide();
  });

  // Start facetracking
  $('#start-tracking').click(function(){
    console.log("starting tracking");
    startTracking();
    $('#start-tracking').hide();
  });

  // Get things started
  step1();
});




// Chrome speech to text
// See github.com/yyx990803/Speech.js for more.
function startSpeech() {

  var speech = new Speech({
      // lang: 'cmn-Hans-CN', // Mandarin Chinese, default is English.
      // all boolean options default to false
      debugging: false, // true, - will console.log all results
      continuous: true, // will not stop after one sentence
      interimResults: true, // trigger events on iterim results
      autoRestart: true, // recommended when using continuous:true
                        // because the API sometimes stops itself
                        // possibly due to network error.
  });

  // simply listen to events
  // chainable API
  speech
      .on('start', function () {
          console.log('started')
      })
      .on('end', function () {
          console.log('ended')
      })
      .on('error', function (event) {
          console.log(event.error)
      })
      .on('interimResult', function (msg) {
      })
      .on('finalResult', function (msg) {
        // if (connection) connection.send(msg);
        console.log("sent: " + msg);
      })
      .start()
}


// CLM Facetracking 
// See github.com/auduno/clmtrackr for more.

var $CTrack = null;

function stopTracking() {
    if ($CTrack)
    {
        $CTrack.stop();
    }
    $CTrack = null;
}

function startTracking() {

    stopTracking();
    
  //var vid = document.getElementById('my-video');
  var vid = document.getElementById('their-video');
  //var overlay = document.getElementById('overlay');
 // var overlay = document.getElementById('them_overlay');
 // var overlayCC = overlay.getContext('2d');
  
  $CTrack = new clm.tracker({useWebGL : true});
  $CTrack.init(pModel);

  startVideo();

  function startVideo() {

    // start video
    vid.play();
    // start tracking
    $CTrack.start(vid);
    // start loop to draw face
    drawLoop();
  }
  
  function drawLoop() {
      if (!$CTrack)
      {
          return;
      }
    requestAnimationFrame(drawLoop);
      
    //overlayCC.clearRect(0, 0, overlay.width, overlay.height);
    //psrElement.innerHTML = "score :" + ctrack.getScore().toFixed(4);
    
    var positions = $CTrack.getCurrentPosition();
    if (positions) 
    {
        var topInnerLip = positions[60];
        var bottomInnerLip = positions[57];
        
        var topX = topInnerLip[0];
        var topY = topInnerLip[1];
        var bottomX = bottomInnerLip[0];
        var bottomY = bottomInnerLip[1];
        
        var xDelta = topX - bottomX;
        var yDelta = topY - bottomY;
        
        $MouthX = ((topX + bottomX) / 2) - 320;
        $MouthY = ((topY + bottomY) / 2) - 240;        
        
        var distance = Math.sqrt((xDelta*xDelta) + (yDelta*yDelta));
        if (distance > 4)
        {
            console.log("Dist " + distance);//+" "+$MouthX+" "+$MouthY+" "+$MouthZ);

            var x = map($MouthX, 0, $VidWidth, .5 , .9);
            var y = map($MouthY, 0, $VidHeight, .5 , .1);
            var z = .5;


            emitter.addParticle(x,y,z);

            //addCube($MouthX,$MouthY,$MouthZ);
        }
        // console.log("distance: "+distance);
        
        // $CTrack.draw(overlay);
    }
    
    animateVomit();
    
  }

}


