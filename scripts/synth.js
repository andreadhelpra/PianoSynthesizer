//https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API#

window.onload = function () {
  let wavePicker = document.querySelector("select[name='waveform']");
  let wavePicker2 = document.querySelector("select[name='waveform2']");
  let volumeControl = document.querySelector("input[name='volume']");
  let customWaveform = null;
  let sineTerms = null;
  let cosineTerms = null;
  let distCheck = document.querySelector("input[name= 'dist']");

  let real1 = document.querySelector("input[name='first']");
  let real2 = document.querySelector("input[name='second']");
  let real3 = document.querySelector("input[name='third']");
  let real4 = document.querySelector("input[name='fourth']");
  let real5 = document.querySelector("input[name='fifth']");

  var keyboard = new QwertyHancock({
    id: "keyboard",
    width: 600,
    height: 150,
    octaves: 2,
  });
  var context = new AudioContext();

  var distortionGainNode = context.createGain();
  var distortion = context.createWaveShaper();

  volumeControl.addEventListener("change", changeVolume, false);
  masterVolume = context.createGain();
  masterVolume.gain.value = volumeControl.value;
  masterVolume.connect(context.destination);
  console.log(distCheck.checked);
  var oscillators = {};

  //Create custom waveform

  //attach event listener to each real (or img) value
  real1.addEventListener("change", changeReals, false);
  real2.addEventListener("change", changeReals, false);
  real3.addEventListener("change", changeReals, false);
  real4.addEventListener("change", changeReals, false);
  real5.addEventListener("change", changeReals, false);

  //create array of values chosen by the user
  sineTerms = new Float32Array([
    real1.value,
    real2.value,
    real3.value,
    real4.value,
    real5.value,
  ]);

  //initialized to 0
  cosineTerms = new Float32Array(sineTerms.length);

  //this creates the customised waveform
  customWaveform = context.createPeriodicWave(cosineTerms, sineTerms);

  //Function triggers when key is pressed
  keyboard.keyDown = function (note, frequency) {
    var osc = context.createOscillator(),
      osc2 = context.createOscillator();

    let type = wavePicker.options[wavePicker.selectedIndex].value;
    let type2 = wavePicker2.options[wavePicker2.selectedIndex].value;

    //TYPE SELECTOR
    if (type == "custom" && type2 != "custom") {
      osc.setPeriodicWave(customWaveform);
      osc2.type = type2;
    } else if (type2 == "custom" && type != "custom") {
      osc.type = type;
      osc2.setPeriodicWave(customWaveform);
    } else if (type == "custom" && type2 == "custom") {
      osc.setPeriodicWave(customWaveform);
      osc2.setPeriodicWave(customWaveform);
    } else {
      osc.type = type;
      osc2.type = type2;
    }

    distortion.curve = makeDistortionCurve(800);
    distortion.oversample = "4x";

    osc.connect(masterVolume);
    osc2.connect(masterVolume);

    masterVolume.connect(context.destination);
    /*  masterVolume.connect(distortionGainNode);
    distortionGainNode.connect(distortion);

    distortion.connect(context.destination);
 */

    /*  if (context.currentTime + 2 == true) {
      masterVolume.gain.linearRampToValueAtTime(0, context.currentTime);
    }
 */
    osc.frequency.value = frequency;
    osc2.frequency.value = frequency;
    oscillators[frequency] = [osc, osc2];

    //CHORUS
    osc.detune.value = -20;
    osc2.detune.value = 20;

    //DISTORTION
    // WaveShaperNode
    //IIFR filter

    osc.start(context.currentTime);
    osc2.start(context.currentTime);
  };
  keyboard.keyUp = function (note, frequency) {
    oscillators[frequency].forEach(function (oscillator) {
      oscillator.stop(context.currentTime);
      /*    masterVolume.gain.setValueAtTime(
        volumeControl.value,
        context.currentTime
      ); */
    });
  };
  function changeVolume(event) {
    masterVolume.gain.value = volumeControl.value;
  }
  function changeReals(event) {
    sineTerms = new Float32Array([
      real1.value,
      real2.value,
      real3.value,
      real4.value,
      real5.value,
    ]);
    cosineTerms = new Float32Array(sineTerms.length);
    customWaveform = context.createPeriodicWave(cosineTerms, sineTerms);
  }

  function makeDistortionCurve(amount) {
    var k = typeof amount === "number" ? amount : 50,
      n_samples = 44100,
      curve = new Float32Array(n_samples),
      deg = Math.PI / 180,
      i = 0,
      x;
    for (; i < n_samples; ++i) {
      x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  //manipulates distortion
  distCheck.onclick = function () {
    if (distCheck.checked == true) {
      masterVolume.connect(distortionGainNode);
      distortionGainNode.connect(distortion);
      distortion.connect(context.destination);
    } else {
      masterVolume.disconnect(distortionGainNode);
      distortionGainNode.disconnect(distortion);
      masterVolume.connect(context.destination);
    }
  };
};
