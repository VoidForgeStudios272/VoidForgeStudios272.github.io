import React, {useState, useEffect, useRef} from 'react';
import socketService from '../services/socket';
import styles from './room.module.css';
import { apiUrl } from '../utils/urls.js';
import {Button} from '../components/Button.jsx';

/**
 * @param {{onJoinGame: (roomId: string) => void}} props
 */
export function Menu({onJoinGame}) {
  const [playerName, setPlayerName] = useState('');
  const [selectedColor, setSelectedColor] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const isRegisteredRef = useRef(false);
  const [error, setError] = useState('');
  const [rooms, setRooms] = useState({});

  const socket = socketService.getSocket();

  useEffect(() => {
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  useEffect(() => {
    const onRoomCreated = (data) => {
      console.log('Room created (broadcast):', data);
      setRooms(prev => ({...prev, [data.roomId]: data.room}));
    };

    const onRoomDeleted = (data) => {
      console.log('Room deleted (broadcast):', data);
      setRooms(prev => {
        const updated = {...prev};
        delete updated[data.roomId];
        return updated;
      });
    };

    const onRoomJoined = (data) => {
      console.log('Joined room:', data);
      const playerId = getPlayerId()
      // let color;
      // color = getRandomColor();
      // const available_colors = Object.values(data.room.players).map(p => p.color);
      // if (!selectedColor) {
      //   while (!available_colors.includes(color)) {
      //     color = getRandomColor();
      //   }
      // }
      onJoinGame({roomId: data.roomId, playerId, isHost: data.room.host.id === playerId});
    };

    const onPlayerRegistered = () => {
      console.log('Player registered');
      isRegisteredRef.current = true;
      setIsRegistered(true);
    };

    const onPlayerUnregistered = () => {
      console.log('Player unregistered');
      isRegisteredRef.current = false;
      setIsRegistered(false);
    };

    const handleCantJoin = (data) => {
      setError(data.message || 'Cannot join room');
    };

    socket.on('room:created', onRoomCreated);
    socket.on('room:deleted', onRoomDeleted);
    socket.on('room:joined', onRoomJoined);
    socket.on('player:registered', onPlayerRegistered);
    socket.on('player:unregistered', onPlayerUnregistered);
    socket.on('room:join:error', handleCantJoin);

    fetchRooms()
      .then(setRooms)
      .catch((error) => console.error('Error fetching rooms:', error));

    return () => {
      socket.off('room:created', onRoomCreated);
      socket.off('room:deleted', onRoomDeleted);
      socket.off('room:joined', onRoomJoined);
      socket.off('player:registered', onPlayerRegistered);
      socket.off('player:unregistered', onPlayerUnregistered);
      socket.off('room:join:error', handleCantJoin);
    };

  }, [socket, onJoinGame]);

  const handleRegister = () => {
    if (!playerName.trim()) {
      setError('Please enter a name');
      return;
    }

    if (!socket.id) {
      setError('Not connected to server');
      return;
    }
    const playerId = getPlayerId();

    localStorage.setItem('playerName', playerName.trim());

    // Use selected color or random color if none selected
    const playerColor = selectedColor || getRandomColor();
    console.log('Registering player with color:', playerColor, 'Selected:', selectedColor);

    socket.emit('player:register', {
      id: playerId, name: playerName.trim(), color: playerColor,
    });

    setError('');
  };
  const handleBackToRegister = () => {
    const playerId = getPlayerId();
    socket.emit('player:unregister', {playerId});
  }
  const handleCreateRoom = () => {
    if (!isRegisteredRef.current) {
      setError('Please register first');
      return;
    }

    const newRoomId = generateRoomId();
    const playerId = getPlayerId();
    socket.emit('room:create', {
      hostId: playerId, roomId: newRoomId,
    });
  };

  const handleFetchRooms = () => {
    fetchRooms()
      .then(setRooms)
      .catch((error) => console.error('Error fetching rooms:', error));
  };

  const handleJoinRoom = (roomId) => {
    if (!isRegisteredRef.current) {
      setError('Please register first');
      return;
    }
    console.log('Joining room:', roomId);
    fetch(apiUrl(`/rooms/${roomId}`))
      .then((response) => {
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        console.log(data);
        if (data?.players) {
          const taken_colors = Object.values(data.players).map((p) => p.color);
          const taken_names = Object.values(data.players).map((p) => p.name);
          if (taken_names.includes(playerName)) {
            setError('Name already taken in this room');
            return;
          }
          if (selectedColor && taken_colors.includes(selectedColor)) {
            setError('Color already taken in this room');
            return;
          }
        }
        const playerId = getPlayerId();
        socket.emit('room:join', {
          playerId: playerId,
          roomId: roomId,
        });
      })
      .catch((error) => {
        console.error('Error fetching room data:', error);
        setError('Could not join room — is the server running?');
      });
  };

  return (<div className={styles.container}>
    {isRegistered && (<Button onClick={handleBackToRegister} children="Back" className={styles.backBtn}/>)}
    <div className={styles.card}>
      <h1 className={styles.title}>Among Us</h1>
      {!isRegistered ? (<div className={styles.section}>
        <h2 className={styles.subtitle}>Enter Your Name</h2>
        <input
          type="text"
          placeholder="Your name..."
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className={styles.input}
          maxLength={20}
        />

        <div className={styles.colorPickerSection}>
          <p className={styles.colorLabel}>Choose your color (optional):</p>
          <div className={styles.colorGrid}>
            {getAvailableColors().map((color) => (
              <div
                key={color}
                className={`${styles.colorOption} ${selectedColor === color ? styles.colorOptionSelected : ''}`}
                style={{backgroundColor: color}}
                onClick={() => setSelectedColor(color)}
                title={color}
              />
            ))}
          </div>
          {selectedColor && (
            <button
              onClick={() => setSelectedColor(null)}
              className={styles.clearColorButton}
            >
              Clear Selection (Random)
            </button>
          )}
        </div>

        <Button onClick={handleRegister} children="Continue"/>
      </div>) : (<div className={styles.section}>
        <p className={styles.welcome}>Welcome, {playerName}!</p>
        <div>
          {Object.keys(rooms).length > 0 ? ( <div>
            <h3 className={styles.subtitle}>Available Rooms:</h3>
            <ul className={styles.roomList}>
              {Object.values(rooms).map((room) => (
                <li className={styles.lobbyCard} key={room.id} onClick={() => handleJoinRoom(room.id)}>
                  <span className={styles.roomId}>{room.id}</span> - Host: <span className={styles.highlight}>{room.host.name}</span> - Players: <span className={styles.highlight}>{Object.keys(room.players).length}</span>
                </li>
              ))}
            </ul>
          </div>) : (<p className={styles.noRooms}>No available rooms. Create one!</p>)}
        </div>
        <Button onClick={handleCreateRoom} children="Create Room"/>
      </div>)}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  </div>);
}

/**
 * Backend returns an array of rooms; UI stores them keyed by id.
 * @param {unknown} data
 * @returns {Record<string, object>}
 */
function roomsToMap(data) {
  if (Array.isArray(data)) {
    return Object.fromEntries(data.map((room) => [room.id, room]));
  }
  if (data && typeof data === 'object') {
    return data;
  }
  return {};
}

async function fetchRooms() {
  const response = await fetch(apiUrl('/rooms'));
  if (!response.ok) {
    throw new Error(`Failed to fetch rooms: ${response.status}`);
  }
  const data = await response.json();
  return roomsToMap(data);
}

function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateUserId() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
const getPlayerId = () => {
  const playerId = sessionStorage.getItem('playerId');
  if (!playerId) {
    const id = generateUserId();
    sessionStorage.setItem('playerId', id);
    return id;
  }
  return playerId;
};
/**
 * Available Among Us colors
 */
const PLAYER_COLORS = [
  '#c51111', // red
  '#132ed1', // blue
  '#117f2d', // green
  '#ed54ba', // pink
  '#ef7d0d', // orange
  '#f5f557', // yellow
  '#3f474e', // black
  '#d6e0f0', // white
  '#6b2fbc', // purple
  '#71491e', // brown
  '#38fedc', // cyan
  '#50ef39', // lime
];

function getRandomColor() {
  return PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];
}

function getAvailableColors() {
  return PLAYER_COLORS;
}

export default Menu;
