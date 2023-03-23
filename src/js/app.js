// import MP4Box from "mp4box";

const streamWorker = new Worker("worker.js");

async function captureVideo(videoInput) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });

  videoInput.srcObject = stream;
  videoInput.play();

  return stream;
}

const startCapture = async (track, settings) => {
  // Start capturing frames at 30 fps

  let ts = track.getSettings();
  const processor = new MediaStreamTrackProcessor(track);
  console.log(processor);
  const inputStream = processor.readable;

  console.log(inputStream);

  // Create a MediaStreamTrackGenerator, which exposes a track from a
  // WritableStream of VideoFrames, using non-standard Chrome API.
  const generator = new MediaStreamTrackGenerator({ kind: "video" });
  const outputStream = generator.writable;
  document.getElementById("outputVideo").srcObject = new MediaStream([
    generator,
  ]);

  let ssrcArr = new Uint32Array(1);
  window.crypto.getRandomValues(ssrcArr);
  const ssrc = ssrcArr[0];

  //   const captureStream = new MediaStream();
  //   const videoTrack = captureStream.addTrack(track.clone());
  //   const encoder = new VideoEncoder({
  //     output: (chunk) => {
  //       console.log(chunk);
  //       // Send the encoded chunk to the server (or do something else with it)
  //     },
  //     error: (error) => {
  //       // Handle any encoding errors
  //     },
  //   });
  const options = {
    codec: "avc1.42002A", //H264
    avc: { format: "annexb" },
    pt: 1,
    framerate: 30,
    bitrate: 5000000, // 5Mbps
    height: settings.height,
    width: settings.width,
    ssrc: ssrc,
    bitrateMode: "constant",
    keyInterval: 3000,
  };
  //   config;
  //   config.pt = 1;
  //   await encoder.configure(options);
  //   encoder.encode(videoTrack, { startTime: performance.now() });
  streamWorker.postMessage(
    {
      type: "stream",
      config: options,
      streams: { input: inputStream, output: outputStream },
    },
    [inputStream, outputStream]
  );

  //   return options;
};

const init = async () => {
  const settings = {
    width: 1280,
    height: 720,
  };

  const videoInput = document.getElementById("inputVideo");
  const stream = await captureVideo(videoInput);
  const track = stream.getVideoTracks()[0];
  //  const imageCapture=new ImageCapture(track);
  //  imageCapture.
  const capabilties = track.getCapabilities();

  if (capabilties.width) {
    settings.width = Math.min(capabilties.width.max, settings.width);
  }
  if (capabilties.height) {
    settings.height = Math.min(capabilties.height.max, settings.height);
  }

  await track.applyConstraints({
    width: settings.width,
    height: settings.height,
  });

  startCapture(track, settings);
};

init();
