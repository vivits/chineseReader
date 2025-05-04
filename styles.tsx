import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 30,
    marginBottom: 30,
  },
  button: {
    width: "45%",
    borderRadius: 10,
    borderWidth: 4,
    borderColor: "darkolivegreen",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "olivedrab",
  },
  buttonPressed: {
    backgroundColor: "darkseagreen",
    borderColor: "olivedrab",

  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  popover: {
    marginVertical: 10,
    marginHorizontal: 10,
  },
  container: {
    flex: 1,
    backgroundColor: "darkslategray",
  },
  scrollContentContainer: {
    padding: 20,
    alignItems: "center",
  },
  wordBlock: {
    alignItems: "center",
    marginHorizontal: 2,
  },

  contentContainer: {
    flex: 1,
    padding: 36,
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 18,
    color: "rosybrown",
    textAlign: "center",
  },
  toggleButton: {
    width: 40,
    height: 40,
    right: 0,
    top: 0,
    position: "absolute",
    borderRadius: 20, // half of width/height = makes a perfect circle
    borderColor: "saddlebrown",
    borderWidth: 2,
    backgroundColor: "lightgoldenrodyellow",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  rightPageTurn: {
    position: "absolute",
    zIndex: 2,
    top: 0,
    bottom: 0,
    right: 0,
    width: "45%",
    //       backgroundColor: 'rgba(255, 255, 0, 0.3)'
  },
  leftPageTurn: {
     position: "absolute",
     zIndex: 2,
     top: 0,
     bottom: 0,
     left: 0,
     width: "45%",
     //       backgroundColor: 'rgba(255, 255, 0, 0.3)'
   },
   pageTurnHolder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "moccasin",
    },
  romButton: {
    fontWeight: "bold",
    fontSize: 20,
    color: "saddlebrown",
    },
  loadingContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },

});
export default styles;