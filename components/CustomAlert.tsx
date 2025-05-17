import { Modal, Pressable, StyleSheet, View } from 'react-native';
import React from 'react';
import { colors, radius, spacingX, spacingY } from '@/constants/theme';
import Typo from './Typo';
import * as icon from 'phosphor-react-native';
import { verticalScale } from '@/utils/styling';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import ScreenWrapper from './ScreenWrapper';

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning';
    onClose: () => void;
    onConfirm?: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
    visible,
    title,
    message,
    type = 'error',
    onClose,
    onConfirm
}) => {
    const getAlertStyle = () => {
        switch (type) {
            case 'success':
                return {
                    icon: <icon.CheckCircle size={verticalScale(45)} color={colors.green} weight="fill" />,
                    color: colors.green
                };
            case 'warning':
                return {
                    icon: <icon.Warning size={verticalScale(45)} color={colors.rose} weight="fill" />,
                    color: colors.rose
                };
            default:
                return {
                    icon: <icon.XCircle size={verticalScale(45)} color={colors.rose} weight="fill" />,
                    color: colors.rose
                };
        }
    };

    const alertStyle = getAlertStyle();

    if (!visible) return null;

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        }
        onClose();
    };

    return (
        <ScreenWrapper>
        <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
            <View style={styles.overlay}>
                <Pressable style={styles.overlayBackground} onPress={onClose} />

                <Animated.View
                    entering={ZoomIn.duration(300)}
                    exiting={ZoomOut.duration(300)}
                    style={styles.alertContainer}
                >
                    <View style={styles.iconContainer}>{alertStyle.icon}</View>

                    <View style={styles.content}>
                        <Typo size={20} fontWeight="700" style={styles.title}>
                            {title}
                        </Typo>
                        <Typo size={15} color={colors.white} style={styles.message}>
                            {message}
                        </Typo>
                    </View>

                    <View style={styles.buttonContainer}>
                        <Pressable
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                        >
                            <Typo size={16} color={colors.white} fontWeight="600">
                                Cancel
                            </Typo>
                        </Pressable>

                        <Pressable
                            style={[styles.button, { backgroundColor: alertStyle.color }]}
                            onPress={handleConfirm}
                        >
                            <Typo size={16} color={colors.white} fontWeight="600">
                                Confirm
                            </Typo>
                        </Pressable>
                    </View>
                </Animated.View>
            </View>
        </Modal>
        </ScreenWrapper>
    );
};

export default CustomAlert;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    overlayBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    alertContainer: {
        width: '85%',
        backgroundColor: colors.neutral800,
        borderRadius: radius._20,
        padding: spacingX._20,
        alignItems: 'center',
        gap: spacingY._15,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    iconContainer: {
        width: verticalScale(80),
        height: verticalScale(80),
        borderRadius: verticalScale(40),
        backgroundColor: colors.neutral700,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        width: '100%',
        alignItems: 'center',
        gap: spacingY._10,
    },
    title: {
        textAlign: 'center',
        color: 'white',
    },
    message: {
        textAlign: 'center',
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: spacingX._10,
        width: '100%',
        marginTop: spacingY._5,
    },
    button: {
        flex: 1,
        height: verticalScale(48),
        borderRadius: radius._12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: colors.neutral700,
    },
});
