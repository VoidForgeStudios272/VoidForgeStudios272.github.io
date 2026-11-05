import {useState, useEffect, useRef} from 'react';
import {PhaserGame} from './PhaserGame';
import socketService from './services/socket';
import Menu from './pages/Menu.jsx';
import styles from './App.module.css';
import Button from "./components/Button.jsx";
import Meeting from "./components/Meeting.jsx";
import EndGame from "./components/EndGame.jsx";
import {EventBus} from './game/EventBus';
import RoleIndicator from "./components/RoleIndicator.jsx";
import { ToastContainer } from "./components/Toast.jsx";
const PAGES = {MENU: 'lobby', WAITING: 'waiting', GAME: 'game', GAMEEND: 'gameend'};

function App() {
  const [currentPage, setCurrentPage] = useState(PAGES.MENU);
  const [roomId, setRoomId] = useState(null);
  const roomIdRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const playerIdRef = useRef(null);
  const [error, setError] = useState(null);
  const debug = useRef(import.meta.env.VITE_DEBUG === 'true');
  // Meeting state
  const [meetingActive, setMeetingActive] = useState(false);
  const [meetingData, setMeetingData] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(60000);
  const [gameResult, setGameResult] = useState(null);
  const [isLocalPlayerImposter, setIsLocalPlayerImposter] = useState(false);
  const [isLocalPlayerHost, setIsLocalPlayerHost] = useState(false);
  const LocalImposterRef = useRef(false); // TODO remove unwanted states with ref
  const [roleIndicator, setRoleIndicator] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.showToast) {
        window.showToast(
          'Server might be experiencing slow loading times. Please be patient.',
          'warning',
          0
        );
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    socketService.connect();
    const sockett = socketService.getSocket();
    if (!sockett) {
      console.warn('Socket unavailable after connect()');
      return;
    }
    setSocket(sockett);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleStartGame = (data) => {
      console.log('Game started event received in App:', data, roomIdRef.current, data.roomId === roomId);
      if (data.roomId === roomIdRef.current) {
        data.playerId = playerIdRef.current;
        EventBus.emit('start-game', data);
        setCurrentPage(PAGES.GAME);
        data.isImposter.then((val) => {
          LocalImposterRef.current = val;
          setIsLocalPlayerImposter(val);
          setRoleIndicator(true);
        });
      }
    }

    // Meeting Event from Phaser
    const handleMeetingStarted = (data) => {
      console.log('Meeting started in App:', data);
      setMeetingData(data);
      setMeetingActive(true);
      setTimeRemaining(60000); // Reset timer to 60 seconds
    };

    const handleMeetingEnded = (data) => {
      console.log('Meeting ended in App:', data);
      setMeetingActive(false);
      setMeetingData(null);
    };

    const handleGameEnd = (data) => {
      console.log('Game end event received in App:', data);
      setGameResult(data);
      setCurrentPage(PAGES.GAMEEND);
    };

    const handleVote = (data) => {
      console.log('Vote event received in App:', data, meetingData);
      setMeetingData(prev => ({...prev, players: {...prev.players, [data.callerId]: {...prev.players[data.callerId], voted: true}}}));
    };
    const handleNotif = (data) => {
      if (window.showToast) {
        window.showToast(data.message, 'info', 3000);
      }
    }

    sockett.on('connect', handleConnect);
    sockett.on('disconnect', handleDisconnect);
    sockett.on('game:started', handleStartGame);
    sockett.on('meeting:voted', handleVote);
    sockett.on('game:notif', handleNotif);

    EventBus.on('meeting:started', handleMeetingStarted);
    EventBus.on('meeting:ended', handleMeetingEnded);
    EventBus.on('game:ended', handleGameEnd);

    return () => {
      sockett.off('connect', handleConnect);
      sockett.off('disconnect', handleDisconnect);
      sockett.off('game:started', handleStartGame);
      sockett.off('meeting:voted', handleVote);
      sockett.off('game:notif', handleNotif);
      EventBus.off('meeting:started', handleMeetingStarted);
      EventBus.off('meeting:ended', handleMeetingEnded);
      EventBus.off('game:ended', handleGameEnd);
      socketService.disconnect();
    };
  }, []);

  const handleJoinRoom = (data) => {
    const joinedRoomId = data.roomId;
    playerIdRef.current = data.playerId;

    console.log('Joining room with ID:', joinedRoomId);
    setRoomId(joinedRoomId);
    roomIdRef.current = joinedRoomId;
    setCurrentPage(PAGES.WAITING);
    setIsLocalPlayerHost(data.isHost);
  };
  const handleStartGameBtn = () => {
    socket.emit('game:start', { roomId });
  }
  const handleBackToMenu = () => {
    const playerId = sessionStorage.getItem('playerId');
    if (socket && playerId) socket.emit('room:leave', {playerId});
    setRoomId(null);
    setCurrentPage(PAGES.MENU);
    window.location.reload();
  };

  // Timer countdown for meeting
  useEffect(() => {
    if (!meetingActive) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1000) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [meetingActive]);

  const handleVoteCallBack = (data) => {
    data.roomId = roomId;
    socket.emit('meeting:vote', data);
  }

  const handleEndMeeting = () => {
    if (!socket || !roomId) return;
    console.log('Ending meeting');
    socket.emit('meeting:end', {
      roomId: roomId
    });
  };

  return (
    <div id="app">
      <ToastContainer />
      {error && <p className={styles.error}>{error}</p>}
      {debug.current && <div className={`${styles.statusBadge} ${isConnected ? styles.connected : styles.disconnected}`}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>}
      {roleIndicator && <RoleIndicator
        role={{imposter: LocalImposterRef.current}}
        onAnimationEnd={() => {setRoleIndicator(false)}}
      />}

      {currentPage === PAGES.MENU && (
        <Menu onJoinGame={handleJoinRoom}/>
      )}

      {currentPage === PAGES.GAMEEND && (
        <EndGame
          result={gameResult}
          onBackToMenu={handleBackToMenu}
          isLocalPlayerImposter={isLocalPlayerImposter}
        />
      )}

      {(currentPage === PAGES.GAME || currentPage === PAGES.WAITING) && (
        <div className={styles.gameContainer}>
          <PhaserGame/>
          {
            currentPage === PAGES.WAITING && (
              isLocalPlayerHost
                ? <Button
                  onClick={handleStartGameBtn}
                  children="Start Game"
                  className={styles.startBtn}
                />
                : <Button
                  children="Waiting for Host to Start"
                  className={styles.startBtn}
                />
            )
          }
          <button className={styles.backButton} onClick={handleBackToMenu}>Leave</button>
          <div className={styles.roomTag}>
            Room: {roomId}
          </div>

          {meetingActive && meetingData && (
            <Meeting
              players={meetingData.players}
              currentPlayerId={playerIdRef.current}
              onVote={handleVoteCallBack}
              onEndMeeting={handleEndMeeting}
              timeRemaining={timeRemaining}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default App
