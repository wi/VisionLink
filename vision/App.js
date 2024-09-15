import React, { useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useFrameProcessor,
  useCameraPermission,
  getCameraDevice,
} from 'react-native-vision-camera';
import { useImageLabeler } from 'react-native-vision-camera-v3-image-labeling';
import { useSharedValue, Worklets } from 'react-native-worklets-core';


export default function App() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [messages, setMessages] = useState([]);
  const labels = useSharedValue([]);

  const [previousLabels, setPreviousLabels] = useState([]);
  
  const devices = Camera.getAvailableCameraDevices();
  let device = getCameraDevice(devices, 'back');
  let usbCamera = devices.find((d) => d.position === "external");
  
  //const device = useCameraDevice('external');
  
  const options = {minConfidence : 0.5}
  const {scanImage} = useImageLabeler(options)
  /* 
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet'
    console.log('frame...')
    //const data = scanImage(frame)
	  //console.log(data, 'data')
  }, [])
  */

  const mapLabel = (label) => {
    const labels = {
      "shirt": "Person",
      "standing": "Person",
      "clothing": "Person",
      "fun": "Person",
      "jacket": "Person",
      "jeans": "Person",
      "sitting": "Person",

      "metal": "Hazard",
      "desk": "Hazard",
      "chair": "Hazard",

      "bumper": "Vehicle",
      "vehicle": "Vehicle",
      "car": "Vehicle",
      
    };
    return labels[label.toLowerCase()] || label;
  }

  const updateLabels = Worklets.createRunOnJS((frame) => {
    let netAmount = {};
  
    // Combine current labels with previous labels
    const combinedFrames = [frame.labels, ...previousLabels];
  
    // Accumulate confidence scores
    combinedFrames.forEach((labelsArray) => {
      labelsArray.forEach((labelObj) => {
        const { label, confidence } = labelObj;
        const realLabel = mapLabel(label);
        if (!netAmount[realLabel]) {
          netAmount[realLabel] = 0;
        }
        netAmount[realLabel] += confidence;
      });
    });
  
    // Convert netAmount object into an array of { label, confidence }
    const labelsWithConfidence = Object.keys(netAmount).map((label) => ({
      label,
      confidence: netAmount[label],
    }));
  
    // Sort the array by confidence in descending order
    labelsWithConfidence.sort((a, b) => b.confidence - a.confidence);
  
    // Update messages with sorted labels and their confidence percentages
    setMessages(
      labelsWithConfidence.map(
        (item) => `${item.label}: ${(item.confidence * 100).toFixed(2)}%`
      )
    );
  
    // Update previousLabels
    setPreviousLabels(combinedFrames.slice(0, 100));
  });    
    
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const labels = scanImage(frame);
  
    // Extract label names to pass to the JS thread
    labels.value = labels.map((label) => label.label);

    updateLabels({labels: labels})
  
  }, [labels]);

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <View style={styles.container}>
      <View style={styles.halfScreen}>
        <Camera 
                  style={StyleSheet.absoluteFill}
                  device={usbCamera ?? device}
                  isActive={true}
                  frameProcessor={frameProcessor}
                  frameProcessorFps={0}
        >
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
              <Text style={styles.text}>Flip Camera</Text>
            </TouchableOpacity>
          </View>
        </Camera>
      </View>

      <View style={styles.halfScreen}>
        <Text style={styles.message}>Camera is ready!</Text>
        <Text style={styles.message}>Detected labels:</Text>
        {messages?.map((message, index) => (
          <Text key={index} style={{marginLeft: 10}} >{message}</Text>
        ))}

        <Button onPress={e => console.log(labels.value)} title='lol' style={styles.debugButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  halfScreen: {
    flex: 1,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  debugButton: {
    position: 'absolute',
    bottom: 0,
    right: 20,
  }
});
