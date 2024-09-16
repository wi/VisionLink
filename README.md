## What it does
VisionLink helps visually impaired people by using a camera on glasses. The camera detects objects and obstacles and gives feedback to the user via audio and haptic vibrations. It also uses Google API to help users to their walking destinations, by guiding them with directions and what is in front of them.

## How we built it
The first step we took was getting vision to work and putting the live feed through an AI object detection model called TensorFlow Lite Task Vision, which we implemented using a VisionCamera Frame Processor plugin. The next step was locating the phone and getting directions, which we implemented with the GoogleMaps API to locate places by name and trace the path to get from our starting position to our destination, all while giving directions along the way on which turns to take. We then implemented the haptic feedback using Expo Haptics to alert the user of obstacles that appear in front of them using the confidence interval from the object detection model, which we found consistently increased as the distance from the specified object decreased. This haptic feedback happens at different intervals, depending on the proximity, with more intense feedback as the user gets closer. The final step was making the whole app able to be controlled by speech and performing text-to-speech to notify the user of important tasks such as taking a left turn in 10 meters. The text-to-speech was implemented using Expo Speech.

## Challenges we ran into
A major challenge we ran into was when our hardware camera component got fried due to excessive overheating. We had to change the entire implementation of how the AI can view and process live footage. We decided to use what we all had access to, our phones. Although it is not a direct physical implementation of the project, the idea and functionality of the project remain the same.

## Accomplishments that we're proud of
We are very proud of bouncing back from a major setback and having a working prototype. Even though we had to change our plans along the way, we stayed focused on our goal. We tried to make VisionLink simple and very accessible to use for visually impaired people.

## What we learned
This Hackathon gave us the opportunity to learn that adaptability is key. We also learned how important it is to understand the needs of visually impaired people.

