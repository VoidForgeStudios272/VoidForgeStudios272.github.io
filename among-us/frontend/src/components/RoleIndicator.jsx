import styles from './RoleIndicator.module.css';
export default function RoleIndicator({role}) {
  return <>
    {role.imposter ? <div className={`${styles.imposter} ${styles.container}`}>
      Youre the Imposter
    </div> :
    <div className={`${styles.crewmate} ${styles.container}`}>
      Youre a Crewmate
    </div>}
  </>
}
