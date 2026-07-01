import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../contexts/AuthContext';

import LoginScreen        from '../screens/LoginScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import DashboardScreen    from '../screens/DashboardScreen';
import ProjectsScreen     from '../screens/ProjectsScreen';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import InventoryScreen    from '../screens/InventoryScreen';
import ProfileScreen      from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const INDIGO = '#4F46E5';
const DARK   = '#1E1B4B';

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: INDIGO,
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#E5E7EB', height: 60, paddingBottom: 8 },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Dashboard: focused ? 'grid' : 'grid-outline',
            Projects:  focused ? 'folder' : 'folder-outline',
            Inventory: focused ? 'cube' : 'cube-outline',
            Profile:   focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Projects"  component={ProjectsStack}   />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Profile"   component={ProfileScreen}   />
    </Tab.Navigator>
  );
}

function ProjectsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProjectsList"   component={ProjectsScreen}      />
      <Stack.Screen name="ProjectDetail"  component={ProjectDetailScreen} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"          component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: DARK }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
