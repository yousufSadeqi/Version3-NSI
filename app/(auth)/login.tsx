import { Alert, Pressable, StyleSheet, View, TextInput, TouchableOpacity } from 'react-native';
import React, { useRef, useState, useEffect } from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import BackButton from '@/components/BackButton';
import { verticalScale, scale } from '@/utils/styling';
import Input from '@/components/input';
import * as icon from 'phosphor-react-native';
import Button from '@/components/Button';
import { useRouter } from 'expo-router';
import Animated, { 
    FadeInDown, 
    FadeIn,
    SlideInRight,
    useAnimatedStyle, 
    useSharedValue, 
    withSequence, 
    withTiming, 
    withSpring,
    withDelay,
    Easing,
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import { useAuth } from '@/contexts/authContext';
import CustomAlert from '@/components/CustomAlert';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const Login = () => {
    // Form data and UI state
    const emailRef = useRef<string>("");
    const passwordRef = useRef<string>("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({
        email: false,
        password: false
    });
    const [validationMessages, setValidationMessages] = useState({
        email: "",
        password: ""
    });
    
    // Animation values
    const buttonScale = useSharedValue(1);
    const buttonOpacity = useSharedValue(0);
    const forgotPasswordOpacity = useSharedValue(0);
    const titleOpacity = useSharedValue(0);
    const headerOffset = useSharedValue(20);
    const logoOpacity = useSharedValue(0);
    
    // Alert state
    const [alert, setAlert] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type?: 'success' | 'error' | 'warning';
    }>({
        visible: false,
        title: '',
        message: '',
        type: 'error'
    });

    const router = useRouter();
    const { login: loginUser } = useAuth();

    // Initialize animations
    useEffect(() => {
        // Logo animation
        logoOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
        
        // Header animations
        titleOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
        headerOffset.value = withDelay(400, withTiming(0, { duration: 800, easing: Easing.out(Easing.quad) }));
        
        // Form animations
        forgotPasswordOpacity.value = withDelay(1000, withTiming(1, { duration: 500 }));
        buttonOpacity.value = withDelay(800, withTiming(1, { duration: 800 }));
    }, []);

    // Animation styles
    const logoAnimStyle = useAnimatedStyle(() => {
        return {
            opacity: logoOpacity.value,
            transform: [
                { scale: interpolate(logoOpacity.value, [0, 1], [0.8, 1], Extrapolate.CLAMP) }
            ]
        };
    });
    
    const headerAnimStyle = useAnimatedStyle(() => {
        return {
            opacity: titleOpacity.value,
            transform: [
                { translateY: headerOffset.value }
            ]
        };
    });
    
    const buttonAnimStyle = useAnimatedStyle(() => {
        return {
            opacity: buttonOpacity.value,
            transform: [
                { scale: buttonScale.value }
            ]
        };
    });
    
    const forgotPasswordAnimStyle = useAnimatedStyle(() => {
        return {
            opacity: forgotPasswordOpacity.value
        };
    });

    const animateButton = () => {
        buttonScale.value = withSequence(
            withTiming(0.95, { duration: 100, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 100, easing: Easing.inOut(Easing.ease) })
        );
    };

    // Validation functions
    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);
        
        setValidationErrors(prev => ({ ...prev, email: !isValid && email.length > 0 }));
        setValidationMessages(prev => ({ 
            ...prev, 
            email: (!isValid && email.length > 0) ? "Please enter a valid email address" : "" 
        }));
        
        return isValid || email.length === 0;
    };

    const validatePassword = (password: string) => {
        const isValid = password.length >= 6;
        
        setValidationErrors(prev => ({ ...prev, password: !isValid && password.length > 0 }));
        setValidationMessages(prev => ({ 
            ...prev, 
            password: (!isValid && password.length > 0) ? "Password must be at least 6 characters" : "" 
        }));
        
        return isValid || password.length === 0;
    };

    const handleSubmit = async () => {
        // Final validation before submission
        if (!emailRef.current || !passwordRef.current) {
            setAlert({
                visible: true,
                title: 'Missing Information',
                message: 'Please enter both email and password.',
                type: 'warning'
            });
            animateButton();
            return;
        }

        const isEmailValid = validateEmail(emailRef.current);
        const isPasswordValid = validatePassword(passwordRef.current);

        if (!isEmailValid || !isPasswordValid) {
            animateButton();
            return;
        }

        setIsLoading(true);
        try {
            const res = await loginUser(emailRef.current, passwordRef.current);
            
            if (!res.success) {
                setAlert({
                    visible: true,
                    title: 'Login Failed',
                    message: res.msg || 'Invalid credentials. Please try again.',
                    type: 'error'
                });
            }
        } catch (error) {
            setAlert({
                visible: true,
                title: 'Error',
                message: 'An unexpected error occurred. Please try again.',
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScreenWrapper style={styles.screenWrapper}>
            <View style={styles.backgroundPattern}>
                <Animated.View style={[styles.patternCircle, styles.patternCircle1]} />
                <Animated.View style={[styles.patternCircle, styles.patternCircle2]} />
            </View>
            
            <View style={styles.container}>
                <View style={styles.topSection}>
                    <Animated.View entering={FadeInDown.duration(500).springify()}>
                        <BackButton iconSize={28} />
                    </Animated.View>
                    
                    <Animated.View style={logoAnimStyle}>
                        <View style={styles.logoContainer}>
                            <icon.ChartPieSlice size={28} color={colors.primary} weight="fill" />
                            <Typo size={20} fontWeight={'700'} color={colors.primary}>Expensify</Typo>
                        </View>
                    </Animated.View>
                </View>

                <Animated.View 
                    style={[styles.headerContainer, headerAnimStyle]}
                >
                    <Typo size={34} fontWeight={'800'} color={colors.primary}>
                        Hey,
                    </Typo>
                    <Typo size={34} fontWeight={'800'} color={colors.white}>
                        Welcome Back
                    </Typo>
                </Animated.View>

                {/* Form */}
                <Animated.View 
                    entering={FadeInDown.duration(700).springify()}
                    style={styles.form}
                >
                    <Typo size={16} color={colors.neutral300} style={styles.subtitle}>
                        Log in to take back control of your finances
                    </Typo>
                    
                    <View style={styles.formCard}>
                        <View style={styles.inputsContainer}>
                            <View>
                                <Input
                                    onChangeText={(value) => {
                                        emailRef.current = value;
                                        validateEmail(value);
                                    }}
                                    placeholder="Enter your email"
                                    icon={<icon.At size={verticalScale(22)} color={colors.neutral400} weight="fill" />}
                                    containerStyle={validationErrors.email ? styles.inputError : styles.input}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                                {validationErrors.email && (
                                    <Animated.Text 
                                        entering={SlideInRight.duration(300)} 
                                        style={styles.errorText}
                                    >
                                        {validationMessages.email}
                                    </Animated.Text>
                                )}
                            </View>

                            <View>
                                <Input
                                    onChangeText={(value) => {
                                        passwordRef.current = value;
                                        validatePassword(value);
                                    }}
                                    placeholder="Enter your password"
                                    icon={<icon.Lock size={verticalScale(22)} color={colors.neutral400} weight="fill" />}
                                    secureTextEntry={!isPasswordVisible}
                                    containerStyle={validationErrors.password ? styles.inputError : styles.input}
                                    rightIcon={
                                        <Pressable onPress={() => setIsPasswordVisible(prevState => !prevState)}>
                                            {isPasswordVisible ? 
                                                <icon.Eye size={verticalScale(22)} color={colors.neutral400} /> :
                                                <icon.EyeSlash size={verticalScale(22)} color={colors.neutral400} />
                                            }
                                        </Pressable>
                                    }
                                />
                                {validationErrors.password && (
                                    <Animated.Text 
                                        entering={SlideInRight.duration(300)} 
                                        style={styles.errorText}
                                    >
                                        {validationMessages.password}
                                    </Animated.Text>
                                )}
                            </View>
                        </View>
                    </View>
                </Animated.View>

                <View style={styles.actionContainer}>
                    {/* Forgot password */}
                    <Animated.View style={forgotPasswordAnimStyle}>
                        <TouchableOpacity
                            style={styles.forgotPasswordButton}
                            onPress={() => {
                                setAlert({
                                    visible: true,
                                    title: 'Reset Password',
                                    message: 'Password reset functionality is coming soon.',
                                    type: 'warning'
                                });
                            }}
                        >
                            <Typo size={14} color={colors.primary} style={styles.forgotPassword}>
                                Forgot Password?
                            </Typo>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Login Button */}
                    <AnimatedTouchable 
                        style={[styles.loginButton, buttonAnimStyle]}
                        onPress={handleSubmit}
                        activeOpacity={0.85}
                    >
                        <Animated.View 
                            style={styles.buttonContent}
                            entering={FadeIn.duration(300)}
                        >
                            {isLoading ? (
                                <Animated.View>
                                    <icon.CircleNotch size={24} color={colors.neutral900} weight="bold" />
                                </Animated.View>
                            ) : (
                                <>
                                    <Typo fontWeight={'700'} color={colors.neutral900} size={18}>
                                        Login
                                    </Typo>
                                    <icon.ArrowRight weight="bold" size={20} color={colors.neutral900} />
                                </>
                            )}
                        </Animated.View>
                    </AnimatedTouchable>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Typo size={15} color={colors.neutral300}>Don't have an account? </Typo>
                        <TouchableOpacity 
                            onPress={() => router.push("/(auth)/register")}
                            style={styles.signupLink}
                        >
                            <Typo size={15} fontWeight={'700'} color={colors.primary}>
                                Sign Up
                            </Typo>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            
            <CustomAlert
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                type={alert.type}
                onClose={() => setAlert(prev => ({ ...prev, visible: false }))}
            />
        </ScreenWrapper>
    );
};

export default Login;

const styles = StyleSheet.create({
    screenWrapper: {
        backgroundColor: colors.neutral900,
    },
    backgroundPattern: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 0.1,
    },
    patternCircle: {
        position: 'absolute',
        borderRadius: 400,
        opacity: 0.2,
    },
    patternCircle1: {
        width: 500,
        height: 500,
        backgroundColor: colors.primary,
        top: -250,
        right: -100,
    },
    patternCircle2: {
        width: 400,
        height: 400,
        backgroundColor: colors.primaryDark,
        bottom: -150,
        left: -100,
    },
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        paddingHorizontal: spacingX._25,
        paddingTop: spacingY._10,
    },
    topSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacingY._10,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerContainer: {
        gap: 5, 
        marginTop: spacingY._20
    },
    form: {
        marginTop: spacingY._25,
    },
    subtitle: {
        marginBottom: spacingY._20,
    },
    formCard: {
        borderRadius: radius._20,
        marginVertical: spacingY._10,
    },
    inputsContainer: {
        gap: spacingY._15,
    },
    input: {
        backgroundColor: 'rgba(30, 30, 33, 0.7)',
        borderWidth: 1,
        borderColor: 'rgba(80, 80, 90, 0.3)',
        borderRadius: radius._12,
        shadowColor: colors.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    inputError: {
        backgroundColor: 'rgba(30, 30, 33, 0.7)',
        borderWidth: 1,
        borderColor: colors.rose,
        borderRadius: radius._12,
        shadowColor: colors.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    errorText: {
        color: colors.rose,
        fontSize: 12,
        marginTop: 4,
        marginLeft: 8,
    },
    actionContainer: {
        marginTop: spacingY._25,
        gap: spacingY._15,
    },
    loginButton: {
        height: verticalScale(56),
        borderRadius: radius._12,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primaryDark,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    forgotPasswordButton: {
        alignSelf: 'flex-end',
        padding: 4,
    },
    forgotPassword: {
        textAlign: 'right',
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
        marginTop: spacingY._10,
    },
    signupLink: {
        padding: 4,
    }
});
