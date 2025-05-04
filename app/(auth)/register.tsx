import { Alert, Pressable, StyleSheet, View, TextInput, TouchableOpacity } from 'react-native';
import React, { useRef, useState } from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import BackButton from '@/components/BackButton';
import { verticalScale } from '@/utils/styling';
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
    Easing
} from 'react-native-reanimated';
import { useAuth } from '@/contexts/authContext';
import CustomAlert from '@/components/CustomAlert';
import { LinearGradient } from 'expo-linear-gradient';

const Register = () => {
    // Form data and UI state
    const nameRef = useRef<string>("");
    const emailRef = useRef<string>("");
    const passwordRef = useRef<string>("");
    const confirmPasswordRef = useRef<string>("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({
        name: false,
        email: false,
        password: false,
        confirmPassword: false
    });
    const [validationMessages, setValidationMessages] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    
    // Animation values
    const buttonScale = useSharedValue(1);
    
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
    const { register: registerUser } = useAuth();

    // Animation styles
    const buttonAnimStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: buttonScale.value }]
        };
    });

    const animateButton = () => {
        buttonScale.value = withSequence(
            withTiming(0.95, { duration: 100, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 100, easing: Easing.inOut(Easing.ease) })
        );
    };

    // Validation functions
    const validateName = (name: string) => {
        if (!name || name.trim().length < 3) {
            setValidationErrors(prev => ({ ...prev, name: true }));
            setValidationMessages(prev => ({ ...prev, name: "Name must be at least 3 characters" }));
            return false;
        }
        setValidationErrors(prev => ({ ...prev, name: false }));
        setValidationMessages(prev => ({ ...prev, name: "" }));
        return true;
    };

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);
        
        setValidationErrors(prev => ({ ...prev, email: !isValid }));
        setValidationMessages(prev => ({ 
            ...prev, 
            email: isValid ? "" : "Please enter a valid email address" 
        }));
        
        return isValid;
    };

    const validatePassword = (password: string) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const errors: string[] = [];
        if (password.length < minLength) errors.push('at least 8 characters');
        if (!hasUpperCase) errors.push('an uppercase letter');
        if (!hasLowerCase) errors.push('a lowercase letter');
        if (!hasNumbers) errors.push('a number');
        if (!hasSpecialChar) errors.push('a special character');

        const isValid = errors.length === 0;
        
        setValidationErrors(prev => ({ ...prev, password: !isValid }));
        setValidationMessages(prev => ({ 
            ...prev, 
            password: isValid ? "" : `Password must contain ${errors.join(', ')}` 
        }));
        
        return {
            isValid,
            errors
        };
    };
    
    const validateConfirmPassword = (password: string, confirmPassword: string) => {
        const isValid = password === confirmPassword;
        
        setValidationErrors(prev => ({ ...prev, confirmPassword: !isValid }));
        setValidationMessages(prev => ({ 
            ...prev, 
            confirmPassword: isValid ? "" : "Passwords do not match" 
        }));
        
        return isValid;
    };

    const handleSubmit = async () => {
        // Validate all fields
        const nameValid = validateName(nameRef.current);
        const emailValid = validateEmail(emailRef.current);
        const passwordValid = validatePassword(passwordRef.current).isValid;
        const confirmPasswordValid = validateConfirmPassword(passwordRef.current, confirmPasswordRef.current);
        
        if (!nameValid || !emailValid || !passwordValid || !confirmPasswordValid) {
            animateButton();
            return;
        }

        setIsLoading(true);
        try {
            const res = await registerUser(emailRef.current, passwordRef.current, nameRef.current);
            
            if (!res.success) {
                setAlert({
                    visible: true,
                    title: 'Registration Failed',
                    message: res.msg || 'Something went wrong. Please try again.',
                    type: 'error'
                });
            } else {
                setAlert({
                    visible: true,
                    title: 'Success',
                    message: 'Your account has been created successfully! You can now login.',
                    type: 'success'
                });
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
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
        <ScreenWrapper>
            <LinearGradient 
                colors={[colors.neutral900, colors.neutral800, colors.neutral900]} 
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            
            <View style={styles.container}>
                <Animated.View entering={FadeInDown.duration(500).springify()}>
                    <BackButton iconSize={28} />
                </Animated.View>

                <Animated.View 
                    entering={FadeInDown.duration(600).springify()} 
                    style={styles.headerContainer}
                >
                    <Typo size={32} fontWeight={'800'} color={colors.primary}>
                        Create
                    </Typo>
                    <Typo size={32} fontWeight={'800'} color={colors.white}>
                        Account
                    </Typo>
                </Animated.View>

                {/* Form */}
                <Animated.View 
                    entering={FadeInDown.duration(700).springify()}
                    style={styles.form}
                >
                    <Typo size={16} color={colors.neutral300} style={styles.subtitle}>
                        Sign up now to manage your expenses
                    </Typo>
                    
                    <View style={styles.inputsContainer}>
                        <View>
                            <Input
                                onChangeText={(value) => {
                                    nameRef.current = value;
                                    validateName(value);
                                }}
                                placeholder="Enter your full name"
                                icon={<icon.User size={verticalScale(22)} color={colors.neutral400} weight="fill" />}
                                containerStyle={validationErrors.name ? styles.inputError : styles.input}
                            />
                            {validationErrors.name && (
                                <Animated.Text 
                                    entering={SlideInRight.duration(300)} 
                                    style={styles.errorText}
                                >
                                    {validationMessages.name}
                                </Animated.Text>
                            )}
                        </View>

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
                                    if (confirmPasswordRef.current) {
                                        validateConfirmPassword(value, confirmPasswordRef.current);
                                    }
                                }}
                                placeholder="Create password"
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

                        <View>
                            <Input
                                onChangeText={(value) => {
                                    confirmPasswordRef.current = value;
                                    validateConfirmPassword(passwordRef.current, value);
                                }}
                                placeholder="Confirm password"
                                icon={<icon.LockKey size={verticalScale(22)} color={colors.neutral400} weight="fill" />}
                                secureTextEntry={!isConfirmPasswordVisible}
                                containerStyle={validationErrors.confirmPassword ? styles.inputError : styles.input}
                                rightIcon={
                                    <Pressable onPress={() => setIsConfirmPasswordVisible(prevState => !prevState)}>
                                        {isConfirmPasswordVisible ? 
                                            <icon.Eye size={verticalScale(22)} color={colors.neutral400} /> :
                                            <icon.EyeSlash size={verticalScale(22)} color={colors.neutral400} />
                                        }
                                    </Pressable>
                                }
                            />
                            {validationErrors.confirmPassword && (
                                <Animated.Text 
                                    entering={SlideInRight.duration(300)} 
                                    style={styles.errorText}
                                >
                                    {validationMessages.confirmPassword}
                                </Animated.Text>
                            )}
                        </View>
                    </View>
                </Animated.View>

                <Animated.View 
                    entering={FadeInDown.duration(800).springify()}
                    style={styles.actionContainer}
                >
                    {/* Register Button */}
                    <Animated.View style={buttonAnimStyle}>
                        <Button loading={isLoading} onPress={handleSubmit} style={styles.button}>
                            <Typo fontWeight={'700'} color={colors.black} size={18}>
                                Create Account
                            </Typo>
                        </Button>
                    </Animated.View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Typo size={15} color={colors.neutral300}>Already have an account? </Typo>
                        <TouchableOpacity 
                            onPress={() => router.push("/(auth)/login")}
                            style={styles.loginLink}
                        >
                            <Typo size={15} fontWeight={'700'} color={colors.primary}>
                                Login
                            </Typo>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
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

export default Register;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        paddingHorizontal: spacingX._25,
        paddingTop: spacingY._10,
    },
    headerContainer: {
        gap: 5, 
        marginTop: spacingY._15
    },
    form: {
        marginTop: spacingY._25,
    },
    subtitle: {
        marginBottom: spacingY._20,
    },
    inputsContainer: {
        gap: spacingY._15,
    },
    input: {
        backgroundColor: colors.neutral800,
        borderWidth: 1,
        borderColor: 'transparent',
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
        backgroundColor: colors.neutral800,
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
    button: {
        height: verticalScale(56),
        borderRadius: radius._12,
        backgroundColor: colors.primary,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
        marginTop: spacingY._10,
    },
    loginLink: {
        padding: 4,
    }
});
