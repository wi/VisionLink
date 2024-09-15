//import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import React, { useEffect, useState, useRef } from 'react';
//import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { GOOGLE_API_KEY } from "./env";
import Constants from "expo-constants";
//import MapViewDirections from "react-native-maps-directions";
import { Platform, Dimensions, PermissionsAndroid, Button, StyleSheet, Text, View, TextInput, SafeAreaView, Image, TouchableOpacity, ScrollView } from 'react-native';
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

/*
const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const INITIAL_POSITION = {
  latitude: 37.231756262604094,
  longitude: -80.42716213866885,
  latitudeDelta: LATITUDE_DELTA,
  longitudeDelta: LONGITUDE_DELTA,
};

function InputAutocomplete({ label, placeholder, onPlaceSelected }) {
  return (
    <>
      <Text>{label}</Text>
      <GooglePlacesAutocomplete
        styles={{ textInput: styles.input }}
        placeholder={placeholder || ""}
        fetchDetails
        onPress={(data, details = null) => {
          onPlaceSelected(details);
        }}
        query={{
          key: GOOGLE_API_KEY,
          language: "pt-BR",
        }}
      />
    </>
  );
}

const formatManeuver = (maneuver) => {
  switch (maneuver) {
    case "turn-left":
      return "Turn left";
    case "turn-right":
      return "Turn right";
    case "uturn-left":
      return "Make a U-turn (left)";
    case "uturn-right":
      return "Make a U-turn (right)";
    case "STRAIGHT":
      return "Continue straight";
    case "merge":
      return "Merge onto the road";
    case "ramp-left":
      return "Take the ramp to the left";
    case "ramp-right":
      return "Take the ramp to the right";
    case "fork-left":
      return "Keep left at the fork";
    case "fork-right":
      return "Keep right at the fork";
    default:
      return "Proceed straight"; // Fallback for unknown or missing maneuvers
  }
};
*/
export default function App() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [messages, setMessages] = useState([]);
  const labels = useSharedValue([]);
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
/*
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [showDirections, setShowDirections] = useState(false);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [steps, setSteps] = useState([]); // store the steps
  const mapRef = useRef(null);

  const moveTo = async (position) => {
    const camera = await mapRef.current?.getCamera();
    if (camera) {
      camera.center = position;
      mapRef.current?.animateCamera(camera, { duration: 1000 });
    }
  };

  const edgePaddingValue = 70;
  const edgePadding = {
    top: edgePaddingValue,
    right: edgePaddingValue,
    bottom: edgePaddingValue,
    left: edgePaddingValue,
  };

  const traceRouteOnReady = (result) => {
    if (result) {
      setDistance(result.distance);
      setDuration(result.duration);
  
      // Log the result to further inspect the structure
      console.log(result);
  
      // Access the steps from the first leg (if available)
      const routeSteps = result.legs[0]?.steps || [];
  
      // Update steps state to display in UI
      setSteps(routeSteps);
    }
  };

  const traceRoute = () => {
    if (origin && destination) {
      setShowDirections(true);
      mapRef.current?.fitToCoordinates([origin, destination], { edgePadding });
    }
  };

  const onPlaceSelected = (details, flag) => {
    const set = flag === "origin" ? setOrigin : setDestination;
    const position = {
      latitude: details?.geometry.location.lat || 0,
      longitude: details?.geometry.location.lng || 0,
    };
    set(position);
    moveTo(position);
  };
*/
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
  map: {
    //width: Dimensions.get("window").width,
    //height: Dimensions.get("window").height,
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
  searchContainer: {
    position: "absolute",
    width: "90%",
    backgroundColor: "white",
    shadowColor: "black",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
    padding: 8,
    borderRadius: 8,
    top: Constants.statusBarHeight,
  },
  stepsContainer: {
    marginTop: 10,
    maxHeight: 150,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
  },
  stepText: {
    fontSize: 14,
    marginBottom: 8,
  },
});
