import {useState} from 'react';
import styles from './Meeting.module.css';
import Button from './Button';
// Public assets are served from the project root; reference by URL instead of importing from public/
const screenImg = '/assets/meeting/screen.png';
import MeetingTile from '../components/MeetingTile.jsx'

function Meeting({players, onVote, timeRemaining}) {

  const [hasVoted, setHasVoted] = useState(false);
  const playerList = Object.values(players || {}).filter(p => p.isAlive !== false);

  return (
    <div className={styles.meetingOverlay}>
        <div className={styles.screenContent}>
          <div className={styles.contentWrapper}>
            <h1 className={styles.title}>Who is The Imposter?</h1>
            <div className={styles.content}>
              <div className={styles.playerGrid}>
                {playerList.map(player => (<MeetingTile player={player} name={player.name} VoteCallBack={onVote}/>))}
              </div>
              <div className={styles.timer}>
                Time Remaining: {Math.ceil(timeRemaining / 1000)}s
              </div>
            </div>
          </div>
      </div>
    </div>
)

}

export default Meeting;
