import { ReactNode } from "react";
import styles from "./styles.module.css";

type Props = {
  title: string,
  children: ReactNode,
}

export default function HomepageZoneContainer(props: Props): JSX.Element {
  return (
    <section className={styles.zoneContainer}>
      <h2>{props.title}</h2>
      {props.children}
    </section>
  );
}
