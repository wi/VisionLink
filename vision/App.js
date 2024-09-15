import React, { useEffect, useState } from 'react';
import { Platform, PermissionsAndroid, Button, StyleSheet, Text, View, TextInput, SafeAreaView, Image, TouchableOpacity, ScrollView } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useFrameProcessor,
  useCameraPermission,
  getCameraDevice,
} from 'react-native-vision-camera';
import { useImageLabeler } from 'react-native-vision-camera-v3-image-labeling';
import { useSharedValue, Worklets } from 'react-native-worklets-core';
import Voice from '@react-native-voice/voice';


export default function App() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [messages, setMessages] = useState([]);
  const labels = useSharedValue([]);
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = error => console.log('onSpeechError', error);
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = stopListening;

    const androidPremissionChecking = async () => {
      if(Platform.OS === 'android'){
        const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        console.log('hasPermission', hasPermission);
        const getService = await Voice.getSpeechRecognitionServices();
        console.log('getService', getService);
      }
    }
    androidPremissionChecking();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechResults = event => {
    setRecognizedText(event.value[0]);
  }

  const onSpeechStart = event => {
    setIsListening(true);
  }

  const startListening = async() => {
    setIsListening(true);
    try {
      await Voice.start('en-US');
    } catch (e) {
      console.error(e);
    }
  }

  const stopListening = async() => {
    try {
      await Voice.stop();
      Voice.removeAllListeners();
      setIsListening(false);
    } catch (e) {
      console.error(e);
    }
  }

  const sendMessage = () => {
    if (recognizedText) {
      setMessages([...messages, {text: recognizedText, sender: 'user'}]);
      setRecognizedText('');
    }
  };
  

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
    <View style={styles.container}>
      <SafeAreaView />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          value={recognizedText}
          onChangeText={text => setRecognizedText(text)}
        />
        <TouchableOpacity
          onPress={() => (isListening ? stopListening() : startListening())}
          style={styles.voiceButton}>
          {isListening ? (
            <Text style={styles.voiceButtonText}>•••</Text>
          ) : (
            <Image
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/512/4980/4980251.png',
              }}
              style={{width: 45, height: 45}}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
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
  },
  messagesContainer: {
    padding: 10,
  },
  messageBubble: {
    maxWidth: '70%',
    marginVertical: 5,
    borderRadius: 10,
    padding: 10,
  },
  messageText: {
    color: 'white',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#EFEFEF',
  },
  voiceButton: {
    marginLeft: 10,
    fontSize: 24,
  },
  voiceButtonText: {
    fontSize: 24,
    height: 45,
  },
  sendButton: {
    marginLeft: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FF6969',
    borderRadius: 20,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
  },
});
