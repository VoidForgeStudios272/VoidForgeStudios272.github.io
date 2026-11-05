import {useState,useEffect} from "react";
import styles from './meetingTile.module.css';

// Public assets should be referenced by URL paths (served from /assets/...)
const playerIcon = '/assets/meeting/pfp.png';
const voteIcon = '/assets/meeting/voted.png';
const ivotedIcon = '/assets/meeting/ivoted.png';
const cancelIcon = '/assets/meeting/cancel.png';
const confirmIcon = '/assets/meeting/confirm.png';
const localPlayerId = sessionStorage.getItem('playerId');
// player: {id, name, voted, color}
export default function MeetingTile({player, votes, VoteCallBack}) {
  const [selected, setSelected] = useState(false);
  const [localPlayerVoted, setLocalPlayerVoted] = useState(false);

  const handleConfirm = () => {
    setSelected(false);
    VoteCallBack({callerId: localPlayerId, votedForId: player.id});
    setLocalPlayerVoted(true);

  }
  const handleCancel = () => {
    setSelected(false);
  }
  return <>
  <div className={styles.tile} onClick={() => {!localPlayerVoted && setSelected(!selected)}}>
    <div className="flex flex-row">
    <div className={styles.playerIcon}>
      <img src={playerIcon} alt="Player Icon" className={styles.iconImage}/>
      {player.voted && <img src={ivotedIcon} alt="I Voted Icon" className={styles.ivoted}/>}
    </div>

    <div className={styles.textContainer}>
      <div className={styles.name}>
        {player.name}
      </div>
      <div className={styles.votesContainer}>
        {votes && votes.map(vote => (
          <div key={vote.id} className={styles.vote}>
            <img src={voteIcon} alt="Vote Icon" className={styles.voteImage}/>
          </div>
        ))}
      </div>
    </div>
    </div>

    {selected && <div className='flex justify-between items-center max-w-[60px]'>
      <img src={confirmIcon} alt="Confirm Icon" className='h-1/2' onClick={handleConfirm}/>
      <img src={cancelIcon} alt="Cancel Icon" className='h-1/2' onClick={handleCancel}/>
    </div>}

  </div>
  </>
}
