import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Button,
  Image,
  View,
  Platform,
  Pressable,
  Text,
  ActivityIndicator,
  BackHandler,
  InteractionManager,
  Alert,
} from "react-native";
import {
  launchImageLibrary as _launchImageLibrary,
  launchCamera as _launchCamera,
} from "react-native-image-picker";
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";
import BottomSheet, {
  BottomSheetView,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { runOnJS } from "react-native-reanimated";
import { pinyin, segment } from "pinyin-pro";
import ToJyutping from "to-jyutping";
import { addDict } from "pinyin-pro";
import ModernChineseDict from "@pinyin-pro/data/modern";
import { cedict, getGloss, getEntries } from "chinese-lexicon";
import Popover from "react-native-popover-view";
import TextRecognition, {
  TextRecognitionScript,
} from "@react-native-ml-kit/text-recognition";
import styles from "./styles";

addDict(ModernChineseDict);

let launchImageLibrary = _launchImageLibrary;
let launchCamera = _launchCamera;

const App = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [text, setText] = useState("");
  const [textBlocks, setTextBlocks] = useState([]);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [layoutSize, setLayoutSize] = useState({ width: 1, height: 1 });
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(null);
  const wordTappedRef = useRef(false);
  const [openPhraseIndex, setOpenPhraseIndex] = useState<number | null>(null);
  const [can, setCan] = useState(false); //toggle canto and mando
  const [romButton, setRomButton] = useState("j");
  const [dictLoading, setDictLoading] = useState(true);
  const initialized = useRef(false);
  const isMounted = useRef(true);

  const LoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#00ff00" />
      <Text style={{ fontSize: 15, color: "white" }}>Loading data...</Text>
    </View>
  );

  useEffect(() => {
    const initialize = async () => {
      try {
        // show loading immediately
        setDictLoading(true);

        // force dict load
        await getEntries("测试");
      } finally {
        // ensure component is still mounted
        if (isMounted.current) {
          // force state update in next frame
          requestAnimationFrame(() => {
            setDictLoading(false);
          });
        }
      }
    };

    // Start initialization after first paint
    requestAnimationFrame(initialize);

    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (selectedImage) {
      Image.getSize(selectedImage, (width, height) => {
        setImageSize({ width, height });
      });
    }
  }, [selectedImage]);

  useEffect(() => {
    if (selectedBlockIndex === null) bottomSheetRef.current?.close();
  }, [selectedBlockIndex]);

  useEffect(() => {
    const backAction = () => {
      if (selectedBlockIndex !== null) {
        setSelectedBlockIndex(null);
        return true;
      } else {
        Alert.alert("Exit the app?", "", [
          {
            text: "Cancel",
            onPress: () => null,
            style: "cancel",
          },
          { text: "YES", onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      }
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [selectedBlockIndex]);

  const prevBlock = () => {
    if (selectedBlockIndex > 0) {
      setSelectedBlockIndex(selectedBlockIndex - 1);
    }
  };
  const nextBlock = () => {
    if (selectedBlockIndex < textBlocks.length - 1) {
      setSelectedBlockIndex(selectedBlockIndex + 1);
    }
  };

  const toggleRom = () => {
    setCan(can ? false : true);
    setRomButton((current) => (current === "p" ? "j" : "p"));
    wordTappedRef.current = true;
  };

  const onPhrasePress = (index) => {
    setOpenPhraseIndex((prevIndex) => (prevIndex === index ? null : index));
    wordTappedRef.current = true;
  };

  const scrollGesture = Gesture.Native();

  const bottomSheetRef = useRef<BottomSheet>(null);

  const RubyText = ({ text, openPhraseIndex }) => {
    const d = segment(text);
    const words = d.map((item) => item.origin);

    const onTogglePress = Gesture.Tap()
      .onEnd(() => {
        runOnJS(toggleRom)();
      })
      .maxDuration(300)
      // and don’t let the sheet’s handlers steal it
      .shouldCancelWhenOutside(false);
    return (
      <View style={{ flexDirection: "column", flex: 1, width: "90%" }}>
        <View
          style={{
            height: 40,
            position: "relative",
            width: "100%",
          }}
        >
          <GestureDetector gesture={onTogglePress}>
            <View style={styles.toggleButton}>
              <Text style={styles.romButton}>{romButton}</Text>
            </View>
          </GestureDetector>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {words.map((phrase, i) => {
            const viewRef = useRef(null);
            const isSelected = openPhraseIndex === i;
            const tap = Gesture.Tap()
              .onEnd(() => {
                runOnJS(onPhrasePress)(i);
              })
              // make sure short taps only
              .maxDuration(300)
              // and don’t let the sheet’s handlers steal it
              .shouldCancelWhenOutside(false);
            return (
              <GestureDetector key={i} gesture={tap}>
                <View //phrase holder
                  ref={viewRef}
                  style={{
                    flexDirection: "row",
                    flexWrap: "nowrap",
                    backgroundColor: isSelected
                      ? "lemonchiffon"
                      : "transparent",
                    borderColor: isSelected ? "tan" : "transparent",
                    borderWidth: 3,
                    borderRadius: 12,
                  }}
                >
                  <Popover
                    from={viewRef}
                    isVisible={openPhraseIndex === i}
                    onRequestClose={() => setOpenPhraseIndex(null)}
                  >
                    <View style={styles.popover}>
                      <Text>
                        {getEntries(phrase)[0]
                          ? getEntries(phrase)[0].definitions.join("\n")
                          : " "}
                      </Text>
                    </View>
                  </Popover>
                  {Array.from(phrase).map((char, j) => {
                    const pin =
                      pinyin(char, { toneType: "symbol", type: "string" }) ??
                      " ";
                    const jyut =
                      ToJyutping.getJyutpingText(char) &&
                      ToJyutping.getJyutpingText(char) !== "[...]"
                        ? ToJyutping.getJyutpingText(char)
                        : " ";
                    return (
                      <View style={{ alignItems: "center" }} key={j}>
                        <Text style={{ color: "saddlebrown", fontSize: 14 }}>
                          {can ? jyut : pin}
                        </Text>
                        <Text style={{ color: "saddlebrown", fontSize: 28 }}>
                          {char}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </GestureDetector>
            );
          })}
        </View>
      </View>
    );
  };

  const imgToLayout = (layoutSize, imageSize, top, left, width, height) => {
    // Calculate scale factors
    const layoutAspect = layoutSize.width / layoutSize.height;
    const imageAspect = imageSize.width / imageSize.height;
    const scaleX = layoutSize.width / imageSize.width;
    const scaleY = layoutSize.height / imageSize.height;

    let offsetX = 0;
    let offsetY = 0;
    let scale = 1;

    if (layoutAspect > imageAspect) {
      // Padding on sides (image is height-bound)
      scale = layoutSize.height / imageSize.height;
      offsetX = (layoutSize.width - imageSize.width * scale) / 2;
    } else {
      // Padding on top/bottom (image is width-bound)
      scale = layoutSize.width / imageSize.width;
      offsetY = (layoutSize.height - imageSize.height * scale) / 2;
    }
    // Convert image coordinates to layout coordinates
    return {
      convertedTop: top * scale + offsetY,
      convertedLeft: left * scale + offsetX,
      convertedWidth: width * scale,
      convertedHeight: height * scale,
    };
  };

  const openImagePicker = useCallback(() => {
    const options = {
      mediaType: "photo",
      includeBase64: false,
      maxWidth: 2000,
      maxHeight: 2000,
      cameraType: "back", // ← ask for back-facing
    };
    launchImageLibrary(options, handleResponse);
  }, [handleResponse]);

  const handleCameraLaunch = useCallback(() => {
    const options = {
      mediaType: "photo",
      includeBase64: false,
      maxWidth: 2000,
      maxHeight: 2000,
      cameraType: "back", // ← ask for back-facing
    };
    launchCamera(options, handleResponse);
  }, [handleResponse]);

  const handleTextRecognition = async (imagePath) => {
    try {
      const result = await TextRecognition.recognize(
        imagePath,
        TextRecognitionScript.CHINESE
      );
      setText(result.text);
      setTextBlocks(result.blocks);
    } catch (error) {
      console.error("Text recognition failed:", error);
    }
  };

  const handleResponse = async (response) => {
    if (response.didCancel) {
      console.log("User cancelled image picker");
    } else if (response.error) {
      console.log("Image picker error: ", response.error);
    } else {
      let imageUri = response.uri || response.assets?.[0]?.uri;
      setSelectedImage(imageUri);
    }
  };

  return dictLoading ? (
    <LoadingScreen />
  ) : (
    <GestureHandlerRootView style={styles.container}>
      <View style={{ flex: 1, width: "100%", height: "100%" }}>
        {selectedImage ? (
          <View
            style={{ flex: 1 }}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              setLayoutSize({ width, height });
            }}
          >
            <Image
              source={{ uri: selectedImage }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
              onLoadEnd={() => handleTextRecognition(selectedImage)}
            />
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: layoutSize.width,
                height: layoutSize.height,
              }}
            >
              {textBlocks.map((block, idx) => {
                const { top, left, width, height } = block.frame;
                const {
                  convertedTop,
                  convertedLeft,
                  convertedWidth,
                  convertedHeight,
                } = imgToLayout(
                  layoutSize,
                  imageSize,
                  top,
                  left,
                  width,
                  height
                );

                return (
                  <Pressable
                    key={idx}
                    onPress={() => {
                      setSelectedBlockIndex(
                        selectedBlockIndex === idx ? null : idx
                      );
                      if (bottomSheetRef.current) {
                        bottomSheetRef.current.snapToIndex(0); // Snap to the top (open)
                      }
                    }}
                    style={{
                      position: "absolute",
                      top: convertedTop - 5,
                      left: convertedLeft - 5,
                      width: convertedWidth + 10,
                      height: convertedHeight + 10,
                      backgroundColor:
                        selectedBlockIndex === idx
                          ? "rgba(255, 255, 0, 0.4)"
                          : "transparent",
                      borderRadius: 5,
                    }}
                  />
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              📷 No image selected{"\n"}
              Tap “Upload” or “Camera” to start
            </Text>
          </View>
        )}
        <View style={styles.buttonRow}>
          <Pressable
            onPress={openImagePicker}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>Upload</Text>
          </Pressable>

          <Pressable
            onPress={handleCameraLaunch}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>Camera</Text>
          </Pressable>
        </View>

        <BottomSheet
          ref={bottomSheetRef}
          index={-1} // closed by default
          snapPoints={["15%", "50%", "80%"]}
        >
          <View style={styles.pageTurnHolder} pointerEvents="box-none">
            <Pressable
              onPress={() => {
                if (wordTappedRef.current) {
                  wordTappedRef.current = false;
                } else prevBlock();
              }}
              style={styles.leftPageTurn}
              pointerEvents="auto"
            />
            <Pressable
              onPress={() => {
                if (wordTappedRef.current) {
                  wordTappedRef.current = false;
                } else nextBlock();
              }}
              style={styles.rightPageTurn}
              pointerEvents="auto"
            />
          </View>
          <BottomSheetScrollView
            contentContainerStyle={styles.scrollContentContainer}
          >
            {selectedBlockIndex !== null &&
            textBlocks[selectedBlockIndex]?.text ? (
              <RubyText
                text={textBlocks[selectedBlockIndex].text}
                openPhraseIndex={openPhraseIndex}
              />
            ) : (
              <Text style={{ fontSize: 18 }}>no block selected</Text>
            )}
          </BottomSheetScrollView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
};

export default App;
