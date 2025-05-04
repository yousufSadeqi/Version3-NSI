import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import React from 'react';
import { ImageUploadProps } from '@/types';
import * as Icons from 'phosphor-react-native';
import { colors, radius } from '@/constants/theme';
import Typo from './Typo';
import { scale, verticalScale } from '@/utils/styling';
import * as ImagePicker from 'expo-image-picker';

const ImageUpload = ({
  file = null, 
  onClear,
  onSelect,
  containerStyle,
  imageStyle,
  placeholder = ''
}: ImageUploadProps) => {
  
    const onPickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          aspect: [4, 3],
          quality: 0.5,
        });
      
        console.log(result); // Check what the result contains
      
        if (!result.canceled && result.assets?.length > 0) {
          onSelect(result.assets[0].uri);
        }
      };
      

  return (
    <View>
      {!file ? (
        <TouchableOpacity 
          style={[styles.inputContainer, containerStyle]} 
          onPress={onPickImage}
        >
          <Icons.UploadSimple color={colors.neutral200} />
          {placeholder && <Typo size={15}>{placeholder}</Typo>}
        </TouchableOpacity>
      ) : (
        <View style={[styles.imageContainer, imageStyle]}>
          <Image 
            style={styles.image}
            source={{ uri: file }} 
            resizeMode="cover"
          />
          <TouchableOpacity onPress={onClear} style={styles.deleteIcon}>
            <Icons.XCircle color={colors.white} size={24} weight="fill" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ImageUpload;

const styles = StyleSheet.create({
  inputContainer: {
    height: verticalScale(54),
    backgroundColor: colors.neutral700,
    justifyContent: 'center', 
    gap: 10, 
    borderWidth: 1,
    borderColor: colors.neutral500,
    borderRadius: radius._15,
    flexDirection: 'row', 
    borderStyle: 'dashed',
    alignItems: 'center',
    paddingHorizontal: 10
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: scale(150),
    height: scale(150),
    borderRadius: radius._15,
    overflow: 'hidden',
  },
  deleteIcon: {
    position: 'absolute',
    top: scale(6),
    right: 5,
    backgroundColor: colors.neutral700,
    borderRadius: 15,
    padding: 5,
    shadowColor: colors.white,
    shadowOffset:{width:0, height:0,},
    shadowOpacity:1,
    shadowRadius:10,
  }
});
