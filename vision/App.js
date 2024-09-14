import React, { useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  Camera,
  useCameraDevice,
  useFrameProcessor,
  useCameraPermission,
} from "react-native-vision-camera";
import { useImageLabeler } from "react-native-vision-camera-v3-image-labeling";
import { runOnJS } from 'react-native-reanimated';


export default function App() {
  const { hasPermission, requestPermission } = useCameraPermission();

  const device = useCameraDevice("back");
  
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

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet'
    const x = scanImage(frame)
    console.log(`${x})`)
  }, [])
  

  const [messages, setMessages] = useState(["test", "test2"]);

  console.log("dsadsa")

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
                  device={device}
                  isActive={true}
                  frameProcessor={frameProcessor}
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
        {messages?.map((message, index) => (
          <Text key={index} style={{marginLeft: 10}}>{message}</Text>
        ))}

        <Button onPress={e => console.log("click")} title='lol' style={styles.debugButton} />
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
