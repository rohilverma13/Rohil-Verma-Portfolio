import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, FlatList, Dimensions, TouchableOpacity, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Carousel from 'react-native-snap-carousel';
import BoxSwitcher from './BoxSwitcher';
import CarouselColumn from './CarouselColumn';

const darkTheme = {
    background: '#1E1E1E',
    text: '#FFFFFF',
    primary: '#4ED9F9',
};


const HomeScreen = () => {
  const { width } = Dimensions.get('window');
  const [activeIndexes, setActiveIndexes] = useState([0, 0, 0]);
  const [modalVisible, setModalVisible] = useState(false);

  const circles = [
    { id: 'add', icon: 'plus', color: darkTheme.primary },
    { id: '1', icon: 'circle', color: '#8E8E8E' },
    { id: '2', icon: 'circle', color: '#8E8E8E' },
    { id: '3', icon: 'circle', color: '#8E8E8E' },
    { id: '4', icon: 'circle', color: '#8E8E8E' },
    { id: '5', icon: 'circle', color: '#8E8E8E' },
    { id: '6', icon: 'circle', color: '#8E8E8E' },
    { id: '7', icon: 'circle', color: '#8E8E8E' },
  ];

  const carouselData = [
    { id: '1', image: require('../assets/dielit.png'), title: 'Die Lit', artist: 'Playboi Carti' },
    { id: '2', image: require('../assets/graduation.png'), title: 'Graduation', artist: 'Kanye West' },
    { id: '3', image: require('../assets/currents.png'), title: 'Currents', artist: 'Tame Impala' },
    { id: '4', image: require('../assets/nwts.png'), title: 'Nothing Was The Same', artist: 'Drake' },
    { id: '5', image: require('../assets/darkside.png'), title: 'Dark Side of the Moon', artist: 'Pink Floyd' },
  ];

  const circleWidth = 50;
  const spacing = (width - circleWidth * circles.length) / (circles.length + 1);

  const handleCirclePress = (id) => {
    console.log(`Circle ${id} pressed`);
  };

  const handleCarouselPress = (item) => {
    console.log(item.title);
  }

  const renderCircle = ({ item }) => {
    const { id, icon, color } = item;

    if (icon === 'plus') {
      return (
        <TouchableOpacity
          style={[styles.circle, styles.add, { backgroundColor: color }]}
          onPress={() => handleCirclePress(id)}
        >
          <FontAwesome name={icon} size={20} color="#FFFFFF" />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.circle, { backgroundColor: color }]}
        onPress={() => handleCirclePress(id)}
      />
    );
  };


  const chartBoxes = [
    { id: '1', color: 'blue' },
    { id: '2', color: 'red' },
    { id: '3', color: 'green' },
    { id: '4', color: 'yellow' },
  ];

  const renderChartBox = ({ item }) => {
    return <View style={[styles.chartBox, { backgroundColor: item.color }]} />;
  };

  const cycleChartBoxes = () => {
    setActiveIndexes((prevState) => {
      const updatedIndexes = [...prevState];
      const lastIndex = updatedIndexes[3];
      updatedIndexes[2] = lastIndex;
      updatedIndexes[3] = (lastIndex + 1) % chartBoxes.length;
      return updatedIndexes;
    });
  };

  const renderCarouselItem = ({ item, index }, carouselIndex) => {
    if (!item || !item.image) {
      return null;
    }

    const isActive = index === activeIndexes[carouselIndex];
    const zIndex = isActive ? 1 : 0;

    return (
      <TouchableOpacity
        onPress={() => handleCarouselPress(item)}
      >
        <View style={[styles.carouselCard, { zIndex }]}>
          {isActive && (
            <View style={styles.carouselItemTextContainer}>
              <Text style={styles.carouselItemTitle} numberOfLines={1} ellipsizeMode="tail">
                {item.title}
              </Text>
              <Text style={styles.carouselItemArtist} numberOfLines={1} ellipsizeMode="tail">
                {item.artist}
              </Text>
            </View>
          )}
          <Image source={item.image} style={styles.carouselImage} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.circlesContainer}>
        <FlatList
          data={circles}
          renderItem={renderCircle}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing,
          }}
        />
      </View>
      <View style={styles.containerWithBorder}>
        <View style={styles.usernameHolder}>
            <Text style={styles.usernameText}>
              Rohil Verma
            </Text>
            
        </View>
        <View style={styles.usernameDivider}>

            </View>
        <View style={styles.row}>
          <CarouselColumn
            carouselData={carouselData}
            activeIndexes={activeIndexes}
            setActiveIndexes={setActiveIndexes}
            handleCarouselPress={(item) => console.log(item.title)}
          />
          <View style={styles.divider}>
            <View style={styles.verticalLine}></View>
          </View>
          <View style={styles.columnContainer}>
            <BoxSwitcher></BoxSwitcher>
          </View>
        </View>
        
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black'
  },
  circlesContainer: {
    paddingTop: '4%',
    backgroundColor: 'black',

  },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  add: {
    backgroundColor: '#FF0000',
  },
  carouselContainer: {
    flex: 1,
    alignItems: 'center',
    marginBottom: '10%',
    marginLeft: '5%',
  },
  carouselContentContainer: {
    alignItems: 'center',
  },
  divider: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  columnContainer: {
    flex: 6,
  },
  row: {
    flexDirection: 'row',
    flex: 1,
  },
  verticalLine: {
    width: 0.5,
    height: '95%',
    backgroundColor: 'white',
  },
  usernameHolder: {
    alignItems: 'center',
    backgroundColor: 'black',
    width: '40%',
    marginTop: '2%',
    marginBottom: '0%',
    borderRadius: '10%',
    marginLeft: '2%',
    marginRight: '2%'
  },
  usernameText: {
    color: darkTheme.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  userPage: {
    borderWidth: 2,
    borderColor: 'white',
  },
  containerWithBorder: {
    flex: 1,
    borderTopWidth: 0.5,
    borderTopColor: 'white',
    marginTop: 15,
    backgroundColor: '#0A0A0A',
  },
  lastActiveText: {
    color: '#FDFFFC',
    fontSize: 16,
    fontStyle: 'italic',
  },
  usernameDivider: {
    borderColor: 'white',
    width: '95%',
    alignSelf: 'center',
    borderTopWidth: '0.5%',
    marginBottom: '2%',
    marginTop: '2%',
  }

});

export default HomeScreen;