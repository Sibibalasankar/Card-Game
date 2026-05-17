import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { MainMenu } from './components/MainMenu';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainMenu />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
