import styles from './EndGame.module.css';
import Button from './Button';

export default function EndGame({ result, onBackToMenu, isLocalPlayerImposter }) {
    const isImposterWin = result?.isImposter;
    // If local player is imposter, and imposter wins, it's a victory
    // If local player is crewmate, and imposter wins, it's a defeat
    const isVictory = isLocalPlayerImposter ? isImposterWin : !isImposterWin;

    return (
        <div className={`${styles.endGameOverlay} ${isVictory ? styles.victory : styles.defeat}`}>
            <div className={styles.content}>
                <div className={styles.resultDetails}>
                    <p className={styles.winnerMessage}>
                        {isImposterWin ? 'Imposters Won' : 'Crewmates Won'}
                    </p>
                </div>

                <div className={styles.characterContainer}>
                     <div className={`${styles.character} ${isVictory ? styles.jump : styles.ghost}`}>
                        <svg viewBox="0 0 100 120" className={styles.crewmateSvg}>
                            {/* Simple Among Us-style crewmate SVG */}
                            <path d="M20,40 Q20,10 50,10 Q80,10 80,40 L80,90 Q80,100 70,100 L30,100 Q20,100 20,90 Z" fill="currentColor" />
                            <rect x="10" y="50" width="15" height="40" rx="5" fill="currentColor" /> {/* Backpack */}
                            <rect x="40" y="25" width="45" height="25" rx="12" fill="#a7d8ff" stroke="#333" strokeWidth="3" /> {/* Visor */}
                            <rect x="30" y="100" width="15" height="15" rx="4" fill="currentColor" /> {/* Left leg */}
                            <rect x="55" y="100" width="15" height="15" rx="4" fill="currentColor" /> {/* Right leg */}
                        </svg>
                     </div>
                </div>

                <Button onClick={onBackToMenu} className={styles.menuBtn}>
                    Return to Menu
                </Button>
            </div>
        </div>
    );
}
