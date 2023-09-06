import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';

const colors = ['red', 'blue', 'green', 'yellow'];
const initialPair = [0, 1]; // Initial pair of box colors

const BoxSwitcher = () => {
  const [pair, setPair] = useState(initialPair);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let timer;
    if (!isPaused) {
      timer = setTimeout(() => {
        const newPair = generateNewPair();
        setPair(newPair);
      }, 1500);
    }
    return () => clearTimeout(timer);
  }, [pair, isPaused]);

  const generateNewPair = () => {
    const usedColors = new Set(pair.map((index) => colors[index]));
    const availableColors = colors.filter((color) => !usedColors.has(color));
    const randomColors = shuffle(availableColors).slice(0, 2);
    const newPair = randomColors.map((color) => colors.indexOf(color));
    return newPair;
  };

  const shuffle = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const togglePause = () => {
    setIsPaused((prevIsPaused) => !prevIsPaused);
  };

  return (
    <View style={styles.container}>
      <View style={styles.boxContainer}>
        {pair.map((index) => (
          <TouchableOpacity
            key={index}
            style={[styles.box, { backgroundColor: colors[index] }]}
          >
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.button} onPress={togglePause}>
        <Text style={styles.buttonText}>{isPaused ? 'Play' : 'Pause'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#272727',
    padding: '10%',
  },
  box: {
    width: '90%',
    aspectRatio: 1,
    marginVertical: '2%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '10%'
  },
  boxText: {
    color: 'white',
    fontWeight: 'bold',
  },
  button: {
    marginTop: '5%',
    paddingVertical: '2%',
    paddingHorizontal: '5%',
    backgroundColor: 'blue',
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default BoxSwitcher;
