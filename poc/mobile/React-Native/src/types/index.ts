export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
};

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message: string;
}

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
};

