import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Carousel from 'react-native-snap-carousel';

const CarouselColumn = ({ carouselData, activeIndexes, setActiveIndexes, handleCarouselPress }) => {
  const renderCarouselItem = ({ item, index }, carouselIndex) => {
    if (!item || !item.image) {
      return null;
    }

    const isActive = index === activeIndexes[carouselIndex];
    const zIndex = isActive ? 1 : 0;

    return (
      <TouchableOpacity onPress={() => handleCarouselPress(item)}>
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
    <View style={styles.carouselColumn}>
      <View style={styles.carouselCardContainer}>
        <Text style={styles.carouselHeaderText}>last 5</Text>
        <Carousel
          style={styles.carousel}
          data={carouselData}
          renderItem={({ item, index }) => renderCarouselItem({ item, index }, 0)}
          sliderWidth={120}
          itemWidth={100}
          contentContainerStyle={styles.carouselContentContainer}
          onSnapToItem={(index) => {
            setActiveIndexes((prevState) => {
              const updatedIndexes = [...prevState];
              updatedIndexes[0] = index;
              return updatedIndexes;
            });
          }}
        />
      </View>
      <View style={styles.carouselCardContainer}>
        <Text style={styles.carouselHeaderText}>top 5</Text>
        <Carousel
          style={styles.carousel}
          data={carouselData}
          renderItem={({ item, index }) => renderCarouselItem({ item, index }, 1)}
          sliderWidth={120}
          itemWidth={100}
          contentContainerStyle={styles.carouselContentContainer}
          onSnapToItem={(index) => {
            setActiveIndexes((prevState) => {
              const updatedIndexes = [...prevState];
              updatedIndexes[1] = index;
              return updatedIndexes;
            });
          }}
        />
      </View>
      <View style={styles.carouselCardContainer}>
        <Text style={styles.carouselHeaderText}>top artists</Text>
        <Carousel
          style={styles.carousel}
          data={carouselData}
          renderItem={({ item, index }) => renderCarouselItem({ item, index }, 2)}
          sliderWidth={120}
          itemWidth={100}
          contentContainerStyle={styles.carouselContentContainer}
          onSnapToItem={(index) => {
            setActiveIndexes((prevState) => {
              const updatedIndexes = [...prevState];
              updatedIndexes[2] = index;
              return updatedIndexes;
            });
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    carouselColumn: {
      flex: 4,
    },
    carouselCardContainer: {
      flex: 1,
      alignItems: 'center',
      marginBottom: '5%',
      backgroundColor: '#272727',
      borderRadius: '15%',
      padding: '5%',
      width: '100%',
      marginLeft: '5%'
    },
    carouselContentContainer: {
      alignItems: 'center',
    },
    carouselCard: {
      width: '100%',
      height: '100%',
      borderRadius: 7,
      backgroundColor: '#FFFFFF',
      borderWidth: 2,
      borderColor: 'white',
    },
    carouselImage: {
      width: '100%',
      height: '100%',
      borderRadius: 10,
    },
    carouselItemTextContainer: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      padding: '5%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 2,
    },
    carouselItemTitle: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    carouselItemArtist: {
      color: 'white',
      fontSize: 10,
      textAlign: 'center',
    },
    carouselHeaderText: {
      color: 'white',
      fontSize: 14,
      alignSelf: 'left',
      fontWeight: 'bold',
      marginBottom: '4%',
    },
  });
  
  export default CarouselColumn;

