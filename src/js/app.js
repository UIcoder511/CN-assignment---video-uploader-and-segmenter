import MP4Box from "mp4box";

// import WebMMuxer from "webm-muxer";

const streamWorker = new Worker(new URL("worker.js", import.meta.url), {
  type: "module",
});

const settings = {
  width: 1280,
  height: 720,
};

const options = (ssrc) => ({
  alpha: "discard",
  // codec: "vp09.00.10.08", //webm
  codec: "avc1.42002A", //H264
  // codec: "vp09.00.10.08", //H264
  // avc: { format: "annexb" },
  // pt: 1,
  framerate: 30, //30fps
  bitrate: 50000, // 5Mbps
  width: settings.width,
  height: settings.height,
  // type: "video/webm",
  ssrc: ssrc,
  bitrateMode: "constant",
  latencyMode: "realtime",
  keyInterval: 90, // 30frames for 3 seconds // i frame every 90 frames
  hardwareAcceleration: "prefer-hardware",

  // scalabilityMode: "L1T2",
});

async function captureVideo(videoInput) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });

  videoInput.srcObject = stream;
  videoInput.play();

  return stream;
}

const startCapture = async (track) => {
  // Start capturing frames at 30 fps

  // let ts = track.getSettings();
  const processor = new MediaStreamTrackProcessor(track);
  console.log(processor);
  const inputStream = processor.readable;
  // const reader = inputStream.getReader();
  // console.log(inputStream);

  // while (true) {
  //   const result = await reader.read();
  //   console.log(JSON.stringify(result));
  //   if (result.done) break;
  //   console.log(result.value);
  //   const frameFromCamera = result.value;
  //   result.value.close();
  // }

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

  // //   config;
  // //   config.pt = 1;
  // //   await encoder.configure(options);
  // //   encoder.encode(videoTrack, { startTime: performance.now() });
  // console.log("first");
  streamWorker.postMessage(
    {
      type: "stream",
      config: options(ssrc),
      streams: { input: inputStream, output: outputStream },
    },
    [inputStream, outputStream]
  );
};

const stopStream = () => {
  streamWorker.postMessage({
    type: "stop",
  });
};

streamWorker.addEventListener("message", async ({ data }) => {
  console.log("data", data);
  // let fileHandle = await window.showSaveFilePicker({
  //   suggestedName: `video.webm`,
  //   types: [
  //     {
  //       description: "Video File",
  //       accept: { "video/webm": [".webm"] },
  //     },
  //   ],
  // });

  // let fileWritableStream = await fileHandle.createWritable();

  // let muxer = new WebMMuxer({
  // target: (data, offset, done) => {
  //   // Do something with the data
  //   console.log(data, offset, done);
  // },
  //   video: {
  //     codec: "V_VP9",
  //     width: 1280,
  //     height: 720,
  //     frameRate: 30,
  //   },
  // });

  // data.encodedFramesArray.forEach(async (frame, index) => {
  //   muxer.addVideoChunk(frame, data.meta);
  // });

  // let buffer = muxer.finalize();
  // fileWritableStream.close();
  // console.log(buffer);
});

const init = async () => {
  const videoInput = document.getElementById("inputVideo");
  const stopBtn = document.getElementById("stopBtn");
  stopBtn.addEventListener("click", stopStream);
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

const captureFromEncoded = () => {
  var outputVideo = document.getElementById("outputVideo");
  outputVideo.onplay = function () {
    // Set the source of one <video> element to be a stream from another.
    var stream = outputVideo.captureStream();
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/mp4; codecs='avc1.424028, mp4a.40.2'", // specify the video codec
      // mimeType: "video/webm;codecs:h.264", // specify the video codec
      videoBitsPerSecond: 2000 * 1000, // set the video bitrate
    });

    mediaRecorder.ondataavailable = async function (event) {
      //  Pass each chunk to MP4Box
      console.log(event.data);

      // const ele = document.createElement("video");
      // ele.src = URL.createObjectURL(event.data);
      // // ele.setAttribute("id", s++);
      // ele.setAttribute("controls", "true");
      // ele.setAttribute("muted", "true");
      // document.body.appendChild(ele);
    };
    mediaRecorder.start(3000);
    // rightVideo.srcObject = stream;
  };
};

const init2 = async () => {
  const videoInput = document.getElementById("inputVideo");

  // const outputFilePath = "/path/to/output/video_%d.mp4";

  // Set video codec settings
  const videoCodecSettings = {
    width: 640,
    height: 480,
    fps: 30,
    bitrate: 1000,
  };

  // // Set fragmentation settings
  // const fragmentationSettings = {
  //   fragmentDuration: 3000, // length of each chunk in milliseconds
  // };

  // // Create a new MP4Box instance
  // const mp4box = MP4Box.createFile();

  // // Set fragmentation settings
  // mp4box.setSegmentOptions({
  //   fragment_duration: fragmentationSettings.fragmentDuration,
  //   fragmented: true,
  //   segment_name_template: outputFilePath,
  // });

  // // Handle errors
  // mp4box.onError = function (err) {
  //   console.log(`An error occurred: ${err}`);
  // };

  // mp4box.onMoovStart = function (err) {
  //   console.log(`An error occurred: ${err}`);
  // };

  // // Handle completion
  // mp4box.onComplete = function () {
  //   console.log("Video fragmentation complete.");
  // };

  // // // Start the fragmentation process
  // mp4box.start();

  // // Start capturing the video stream from the camera

  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(function (stream) {
      // Create a new MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs:h.264", // specify the video codec
        videoBitsPerSecond: videoCodecSettings.bitrate * 1000, // set the video bitrate
      });

      const init = {
        output: (f) => console.log(f),
        error: (e) => {
          console.log(e.message);
        },
      };
      const config = {
        codec: "vp8",
        width: 640,
        height: 480,
        bitrate: 2_000_000, // 2 Mbps
        framerate: 30,
      };

      // const videoEncoder = new VideoEncoder(init);
      // videoEncoder.configure(config);
      let s = 0;
      // Handle data available event
      mediaRecorder.ondataavailable = async function (event) {
        //  Pass each chunk to MP4Box
        console.log(event.data);
        const webMBlob = event.data;
        const fd = new FormData();
        fd.set("file", webMBlob, "seg-" + Date.now() + ".webm");
        fetch("http://localhost:3000/upload", {
          method: "post",
          body: fd,
        });
        // const ele = document.createElement("video");
        // ele.src = URL.createObjectURL(event.data);
        // ele.setAttribute("id", s++);
        // ele.setAttribute("controls", "true");
        // ele.setAttribute("muted", "true");
        // document.body.appendChild(ele);

        // if (s === 5) {
        //   mediaRecorder.stop();
        // }
        // videoEncoder.encode(event.data);
        // const buffer = await event.data.arrayBuffer();
        // buffer.fileStart = s;
        // s += buffer.byteLength;

        // mp4box.appendBuffer(buffer);
        // console.log(mp4box.getBuffer());
        // console.log(mp4box.getInfo());
      };

      // videoEncoder.onframe = function (event) {
      //   // Do something with the encoded video frame
      //   const frame = event.frame;
      //   console.log(frame);
      // };
      // Handle stop event
      mediaRecorder.onstop = function () {
        // Finish the MP4Box fragmentation process
        // mp4box.flush();
      };

      // Start the MediaRecorder
      mediaRecorder.start(3000);
      // videoEncoder.
      videoInput.srcObject = stream;
      videoInput.play();
      // Attach the stream to the video element
      // video.srcObject = stream;
      // Start the video playback
      // video.play();
    })
    .catch(function (err) {
      console.log(`An error occurred while capturing the video: ${err}`);
    });
};

init();
// captureFromEncoded();
// init2();
